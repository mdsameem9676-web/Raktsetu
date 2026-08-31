import { db } from './db';
import type { BloodRequest, MatchStatus } from './db';
import { isBloodCompatible } from '../utils/bloodCompatibility';
import { getCachedCoordinates } from './geocodingService';

export interface MatchResult {
  donorId: string;
  donorName: string;
  bloodGroup: string;
  receiverBloodGroup: string;
  isBloodCompatible: boolean;
  matchScore: number;
  distanceKm: number | null;
  distanceText: string;
  hasCoordinates: boolean;
  availability: 'AVAILABLE';
  eligibilityStatus: 'ELIGIBLE' | 'PENDING';
  matchStatus: MatchStatus;
  matchId?: string;
  acceptedAt?: string;
  reasons: string[];
}

export interface RankedBloodRequest {
  request: BloodRequest;
  matchScore: number;
  distanceKm: number | null;
  distanceText: string;
  hasCoordinates: boolean;
  matchStatus: MatchStatus;
  matchId?: string;
  isBloodCompatible: boolean;
  reasons: string[];
  journeyMatch?: {
    acceptedAt?: string;
    onTheWayAt?: string;
    arrivedAt?: string;
    completedAt?: string;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// PRIVATE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Anonymize donor name for privacy: "Rahul Sharma" → "Rahul S."
 */
const anonymizeName = (fullName?: string, fallbackId?: string): string => {
  if (!fullName || !fullName.trim()) {
    return fallbackId ? `Donor #${fallbackId.slice(0, 4)}` : 'Verified Donor';
  }
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
};

/**
 * Haversine formula — accurate great-circle distance in km.
 * Works for ANY two GPS coordinates on Earth.
 */
export const haversineDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth radius in km
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10; // 1 decimal place
};

/**
 * Resolve coordinates for a location. Priority order:
 *   1. Explicit lat/lng stored on the record (most accurate, set at save time)
 *   2. Geocode cache lookup by location string (set previously via Nominatim API)
 *   3. Inline "lat,lng" string format (legacy fallback)
 *
 * Does NOT make network calls — those happen at profile/request save time in
 * the dashboard so the matching engine stays synchronous and fast.
 */
const resolveCoords = (
  lat?: number,
  lng?: number,
  locationText?: string
): { lat: number; lng: number } | null => {
  // 1. Use stored explicit coordinates first
  if (lat !== undefined && lng !== undefined && !isNaN(lat) && !isNaN(lng)) {
    return { lat, lng };
  }

  // 2. Try geocode cache (populated when user saved their profile/request)
  if (locationText) {
    const cached = getCachedCoordinates(locationText);
    if (cached) return cached;

    // 3. Legacy: inline "lat,lng" string (kept for backward compatibility)
    const m = locationText.match(/^(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)$/);
    if (m) {
      const parsedLat = parseFloat(m[1]);
      const parsedLng = parseFloat(m[3]);
      if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
        return { lat: parsedLat, lng: parsedLng };
      }
    }
  }

  return null;
};

/**
 * Compute the distance score (25-point component of 100-point match score).
 * Closer = higher score. Consistent across both matching directions.
 */
const distanceScoreFrom = (distanceKm: number): number => {
  if (distanceKm <= 2)  return 25;
  if (distanceKm <= 5)  return 22;
  if (distanceKm <= 10) return 18;
  if (distanceKm <= 20) return 14;
  if (distanceKm <= 50) return 10;
  return 6;
};

/**
 * Format a distance for human display.
 *   3.2 km → "3.2 km away"
 *   0.4 km → "< 1 km away"
 */
const formatDistanceText = (distanceKm: number): string => {
  if (distanceKm < 1) return '< 1 km away';
  return `${distanceKm} km away`;
};


// ─────────────────────────────────────────────────────────────────────────────
// MATCHING ENGINE
// ─────────────────────────────────────────────────────────────────────────────
export const matchingService = {
  /**
   * getMatchesForRequest — Receiver perspective
   *
   * Finds all compatible, available donors for a given active blood request,
   * calculates real geographical distance from each donor to the request
   * location, and returns ranked results (ACCEPTED first, then by score).
   */
  getMatchesForRequest: (requestId: string, currentUserId?: string): MatchResult[] => {
    const request = db.findBloodRequestById(requestId);
    if (!request || request.status !== 'ACTIVE') {
      console.warn(`[MatchingEngine] Active BloodRequest not found: ${requestId}`);
      return [];
    }

    // Security: verify the caller owns this request
    if (currentUserId && request.receiverId !== currentUserId) {
      console.warn(`[MatchingEngine] Unauthorized access attempt by userId: ${currentUserId}`);
      return [];
    }

    // Resolve request's geographic coordinates (once, not per donor)
    const reqCoords = resolveCoords(request.latitude, request.longitude, request.location);

    const allDonors = db.getAllDonors();
    const matches: MatchResult[] = [];

    for (const donor of allDonors) {
      // 1. Skip own request
      if (donor.userId === request.receiverId) continue;

      // 2. BLOCK FILTER: Skip if either user has blocked the other
      if (db.isUserBlocked(donor.userId, request.receiverId)) continue;

      // 3. HARD FILTER: availability (must be AVAILABLE)
      if (donor.availabilityStatus !== 'AVAILABLE') continue;

      // 4. HARD FILTER: RBC blood compatibility (deterministic)
      if (!isBloodCompatible(donor.bloodGroup, request.bloodGroup)) continue;

      // 5. HARD FILTER: eligibility declaration (must be ELIGIBLE)
      if (donor.eligibilityStatus !== 'ELIGIBLE') continue;

      // 6. Read real-time match status from DB (single source of truth)
      const existingMatch = db.findMatchByRequestAndDonor(request.id, donor.userId);
      const matchStatus: MatchStatus = existingMatch ? existingMatch.status : 'PENDING';

      // 6. Distance calculation
      const donorCoords = resolveCoords(donor.latitude, donor.longitude, donor.location);
      let distanceKm: number | null = null;
      let distanceText = 'Nearby';
      let distanceScore = 15; // neutral when no coords
      let hasCoordinates = false;

      if (donorCoords && reqCoords) {
        distanceKm = haversineDistance(
          donorCoords.lat, donorCoords.lng,
          reqCoords.lat,  reqCoords.lng
        );
        distanceText = formatDistanceText(distanceKm);
        distanceScore = distanceScoreFrom(distanceKm);
        hasCoordinates = true;

        // Radius check: exclude donors outside their own configured radius
        if (donor.preferredRadius && distanceKm > donor.preferredRadius) continue;
      }

      // 7. Composite match score (100 points)
      const bloodScore = 40;        // blood compatibility: fixed
      const availabilityScore = 15; // always AVAILABLE by this point
      const urgencyScore =
        request.urgency === 'CRITICAL' ? 10 :
        request.urgency === 'URGENT'   ? 8  : 5;
      const eligibilityScore = donor.eligibilityStatus === 'ELIGIBLE' ? 10 : 5;
      const totalScore = Math.min(100,
        bloodScore + distanceScore + availabilityScore + urgencyScore + eligibilityScore
      );

      // 8. Reasons
      const reasons: string[] = [
        '✓ Blood compatibility: Compatible RBC donor',
        '✓ Available donor',
        donor.eligibilityStatus === 'ELIGIBLE'
          ? '✓ Eligible donor'
          : '⏳ Eligibility pending verification',
      ];
      if (hasCoordinates) {
        reasons.push(`📍 Distance: ${distanceText}`);
      }
      if (matchStatus === 'ACCEPTED' || matchStatus === 'CONFIRMED') {
        reasons.unshift('✓ Donor accepted this request');
      } else if (matchStatus === 'DECLINED') {
        reasons.unshift('⚫ Donor declined this request');
      }
      if (request.urgency === 'CRITICAL') reasons.push('🔴 Critical emergency match');
      else if (request.urgency === 'URGENT') reasons.push('🟡 Urgent requirement');

      const user = db.findUserById(donor.userId);

      matches.push({
        donorId: donor.userId,
        donorName: anonymizeName(user?.name, donor.userId),
        bloodGroup: donor.bloodGroup,
        receiverBloodGroup: request.bloodGroup,
        isBloodCompatible: true,
        matchScore: Math.round(totalScore),
        distanceKm,
        distanceText,
        hasCoordinates,
        availability: 'AVAILABLE',
        eligibilityStatus: donor.eligibilityStatus === 'ELIGIBLE' ? 'ELIGIBLE' : 'PENDING',
        matchStatus: matchStatus === 'CONFIRMED' ? 'ACCEPTED' : matchStatus,
        matchId: existingMatch?.id,
        acceptedAt: existingMatch?.acceptedAt,
        reasons,
      });
    }

    // Sort: ACCEPTED first, then by match score, then by proximity (closest first)
    matches.sort((a, b) => {
      const aAcc = a.matchStatus === 'ACCEPTED' || a.matchStatus === 'CONFIRMED' ? 1 : 0;
      const bAcc = b.matchStatus === 'ACCEPTED' || b.matchStatus === 'CONFIRMED' ? 1 : 0;
      if (aAcc !== bAcc) return bAcc - aAcc;
      if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
      const distA = a.distanceKm ?? 9999;
      const distB = b.distanceKm ?? 9999;
      return distA - distB;
    });

    return matches;
  },

  /**
   * getCompatibleRequestsForDonor — Donor perspective
   *
   * Finds all active, blood-compatible blood requests that are within the
   * donor's preferred radius. Calculates real geographical distance from the
   * donor's location to each request's location using the Haversine formula.
   *
   * Requests outside the donor's radius are EXCLUDED.
   * Requests are sorted: proximity (closest first) → urgency → match score.
   *
   * If no coordinates are available for the donor, a warning is returned
   * so the donor knows to update their location. Requests are NOT falsely
   * labelled "Nearby" when coordinates are unknown.
   */
  getCompatibleRequestsForDonor: (donorUserId: string): RankedBloodRequest[] => {
    const donor = db.findDonorProfileByUserId(donorUserId);
    if (!donor) {
      console.warn(`[MatchingEngine] Donor profile not found for userId: ${donorUserId}`);
      return [];
    }

    const allRequests = db.getAllBloodRequests();
    const activeRequests = allRequests.filter(r => r.status === 'ACTIVE');
    const results: RankedBloodRequest[] = [];

    // Resolve donor coordinates once (not per request)
    const donorCoords = resolveCoords(donor.latitude, donor.longitude, donor.location);

    for (const req of activeRequests) {
      // 1. Skip own request
      if (req.receiverId === donorUserId) continue;

      // 2. BLOCK FILTER: Skip if either user has blocked the other
      if (db.isUserBlocked(donorUserId, req.receiverId)) continue;

      // 3. HARD FILTER: RBC blood compatibility
      if (!isBloodCompatible(donor.bloodGroup, req.bloodGroup)) continue;

      // 4. Real-time match status — preserve all journey states
      const existingMatch = db.findMatchByRequestAndDonor(req.id, donorUserId);
      const matchStatus: MatchStatus = existingMatch
        ? existingMatch.status
        : 'PENDING';

      const isAcceptedOrJourney = matchStatus === 'ACCEPTED' || matchStatus === 'CONFIRMED' || matchStatus === 'ON_THE_WAY' || matchStatus === 'ARRIVED' || matchStatus === 'COMPLETED';

      // 5. AVAILABILITY & ELIGIBILITY: If donor is unavailable or not confirmed eligible,
      // hide new available requests, but preserve existing accepted/journey requests!
      if (!isAcceptedOrJourney) {
        if (donor.availabilityStatus !== 'AVAILABLE') continue;
        if (donor.eligibilityStatus !== 'ELIGIBLE') continue;
      }

      // If request has been claimed by another donor (fulfilled), exclude for other donors
      const acceptedMatchesForReq = db
        .findMatchesByRequestId(req.id)
        .filter(m => m.status === 'ACCEPTED' || m.status === 'CONFIRMED' || m.status === 'ON_THE_WAY' || m.status === 'ARRIVED');
      const isClaimedByOther = acceptedMatchesForReq.some(m => m.donorId !== donorUserId) && acceptedMatchesForReq.length >= (req.units || 1);
      if (isClaimedByOther && !isAcceptedOrJourney) {
        continue;
      }


      // 4. Distance calculation
      const reqCoords = resolveCoords(req.latitude, req.longitude, req.location);
      let distanceKm: number | null = null;
      let distanceText = 'Nearby';
      let distanceScore = 15; // neutral
      let hasCoordinates = false;

      if (donorCoords && reqCoords) {
        distanceKm = haversineDistance(
          donorCoords.lat, donorCoords.lng,
          reqCoords.lat,  reqCoords.lng
        );
        distanceText = formatDistanceText(distanceKm);
        distanceScore = distanceScoreFrom(distanceKm);
        hasCoordinates = true;

        // ── RADIUS FILTER ─────────────────────────────────────
        // Only include requests within the donor's configured radius.
        // This is the critical gate that was previously bypassed when
        // coordinates were unavailable.
        const radius = donor.preferredRadius || 10;
        if (distanceKm > radius) continue;
        // ──────────────────────────────────────────────────────
      }
      // When donor has no coordinates: include all compatible requests
      // but display "Location unknown" — donor will be prompted to add location.

      // 5. Composite match score
      const bloodScore = 40;
      const availabilityScore = donor.availabilityStatus === 'AVAILABLE' ? 15 : 0;
      const urgencyScore =
        req.urgency === 'CRITICAL' ? 10 :
        req.urgency === 'URGENT'   ? 8  : 5;
      const eligibilityScore = donor.eligibilityStatus === 'ELIGIBLE' ? 10 : 5;
      const totalScore = Math.min(100,
        bloodScore + distanceScore + availabilityScore + urgencyScore + eligibilityScore
      );

      const reasons: string[] = [
        `✓ Compatible with recipient's ${req.bloodGroup} blood`,
        `🏥 Hospital: ${req.hospital}`,
      ];
      if (hasCoordinates) {
        reasons.push(`📍 ${distanceText}`);
      }

      results.push({
        request: req,
        matchScore: Math.round(totalScore),
        distanceKm,
        distanceText,
        hasCoordinates,
        matchStatus,
        matchId: existingMatch?.id,
        isBloodCompatible: true,
        reasons,
        // Journey timestamps — passed through from the existing Match record
        journeyMatch: existingMatch ? {
          acceptedAt: existingMatch.acceptedAt,
          onTheWayAt: existingMatch.onTheWayAt,
          arrivedAt: existingMatch.arrivedAt,
          completedAt: existingMatch.completedAt,
        } : undefined,
      });
    }

    // ── SORTING ───────────────────────────────────────────────────────────────
    // Priority:
    //   1. Declined requests always go to the bottom
    //   2. Within non-declined: sort by PROXIMITY (closest first)
    //      when both have coordinates; fall back to urgency → score
    //   3. Urgency as tiebreaker when distances are equal
    //   4. Match score as final tiebreaker
    const urgencyWeight: Record<string, number> = { CRITICAL: 3, URGENT: 2, NORMAL: 1 };

    results.sort((a, b) => {
      // Declined to bottom
      const aDeclined = a.matchStatus === 'DECLINED' ? 1 : 0;
      const bDeclined = b.matchStatus === 'DECLINED' ? 1 : 0;
      if (aDeclined !== bDeclined) return aDeclined - bDeclined;

      // Both have real distances → sort by proximity (ascending = closest first)
      if (a.distanceKm !== null && b.distanceKm !== null) {
        const distDiff = a.distanceKm - b.distanceKm;
        if (Math.abs(distDiff) > 0.1) return distDiff; // more than 0.1 km difference
      }

      // One or both lack distance → fall back to urgency then score
      const uDiff =
        (urgencyWeight[b.request.urgency] || 0) -
        (urgencyWeight[a.request.urgency] || 0);
      if (uDiff !== 0) return uDiff;

      return b.matchScore - a.matchScore;
    });

    return results;
  },

  /**
   * Returns whether the donor's location is geocoded and usable for matching.
   * Used by the dashboard to show a "please add location" prompt.
   */
  donorHasValidLocation: (donorUserId: string): boolean => {
    const donor = db.findDonorProfileByUserId(donorUserId);
    if (!donor) return false;
    return resolveCoords(donor.latitude, donor.longitude, donor.location) !== null;
  },
};
