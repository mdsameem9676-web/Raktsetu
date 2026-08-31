import { db } from './db';
import type { Match } from './db';
import { isBloodCompatible } from '../utils/bloodCompatibility';
import { notificationService } from './notificationService';

export interface ActionResponse {
  success: boolean;
  match?: Match;
  message: string;
}

/**
 * Service for managing donor Accept / Decline actions on Blood Request matches (Step 7).
 */
export const matchActionService = {
  /**
   * Donor accepts an active blood request.
   */
  acceptMatch: (requestId: string, donorUserId: string): ActionResponse => {
    if (!donorUserId) {
      return { success: false, message: 'Authentication required to accept request.' };
    }

    const donor = db.findDonorProfileByUserId(donorUserId);
    if (!donor) {
      return { success: false, message: 'Donor profile not found.' };
    }

    const request = db.findBloodRequestById(requestId);
    if (!request) {
      return { success: false, message: 'Blood request not found.' };
    }

    if (request.status !== 'ACTIVE') {
      return { success: false, message: 'This blood request is no longer active.' };
    }

    // Never allow a user to accept their own request
    if (request.receiverId === donorUserId) {
      return { success: false, message: 'You cannot accept your own blood request.' };
    }

    // Verify availability
    if (donor.availabilityStatus !== 'AVAILABLE') {
      return { success: false, message: 'You must be marked as Available to accept a blood request.' };
    }

    // Verify eligibility
    if (donor.eligibilityStatus !== 'ELIGIBLE') {
      return { success: false, message: 'You must confirm your donor eligibility declaration before accepting a blood request.' };
    }

    // Verify block status
    if (db.isUserBlocked(donorUserId, request.receiverId)) {
      return { success: false, message: 'Interaction is restricted with this user.' };
    }

    // Verify compatibility
    if (!isBloodCompatible(donor.bloodGroup, request.bloodGroup)) {
      return { success: false, message: 'Blood type is not compatible with this request.' };
    }

    // ══════════════════════════════════════════════════════
    // MULTI-DONOR CLAIM RULE / RACE CONDITION PROTECTION
    // Prevent multiple donors from claiming a filled request
    // ══════════════════════════════════════════════════════
    const existingAccepted = db
      .findMatchesByRequestId(requestId)
      .filter(m => m.status === 'ACCEPTED' || m.status === 'CONFIRMED' || m.status === 'ON_THE_WAY' || m.status === 'ARRIVED');
    const thisDonorAccepted = existingAccepted.some(m => m.donorId === donorUserId);
    if (!thisDonorAccepted && existingAccepted.length >= (request.units || 1)) {
      return {
        success: false,
        message: 'This request is no longer available.',
      };
    }

    // ══════════════════════════════════════════════════════
    // BUSINESS RULE: ONE DONOR → ONE ACTIVE ACCEPTED REQUEST
    // Check BEFORE looking up any existing match record so
    // even simultaneous double-clicks are safely blocked.
    // ══════════════════════════════════════════════════════
    const currentActiveAccepted = db.findActiveAcceptedMatchByDonorId(donorUserId);
    if (currentActiveAccepted) {
      // Allow the donor to "re-accept" the same request they already accepted (idempotent)
      if (currentActiveAccepted.requestId !== requestId) {
        return {
          success: false,
          message:
            'You already have an active accepted blood request. ' +
            'Complete your current donation before accepting another request.',
        };
      }
    }


    const existingMatch = db.findMatchByRequestAndDonor(requestId, donorUserId);

    if (existingMatch) {
      if (existingMatch.status === 'ACCEPTED' || existingMatch.status === 'CONFIRMED') {
        return { success: false, match: existingMatch, message: 'You have already accepted this request.' };
      }
      if (existingMatch.status === 'DECLINED') {
        return { success: false, match: existingMatch, message: 'You previously declined this request.' };
      }
      if (existingMatch.status === 'CANCELLED') {
        return { success: false, match: existingMatch, message: 'This match was cancelled.' };
      }

      // Transition match status directly to ACCEPTED in DB
      const updated = db.updateMatchStatus(existingMatch.id, 'ACCEPTED', 'acceptedAt');
      if (updated) {
        notificationService.notifyDonorAccepted(requestId, donorUserId);
        return { success: true, match: updated, message: 'Blood request accepted successfully. Match status is now ACCEPTED.' };
      }
    }

    // Create new ACCEPTED match record
    const newMatch = db.createOrUpdateMatch({
      requestId,
      donorId: donorUserId,
      matchScore: 94,
      status: 'ACCEPTED',
      acceptedAt: new Date().toISOString(),
    });

    notificationService.notifyDonorAccepted(requestId, donorUserId);
    return { success: true, match: newMatch, message: 'Blood request accepted successfully. Match status is now ACCEPTED.' };
  },



  /**
   * Donor declines an active blood request.
   */
  declineMatch: (requestId: string, donorUserId: string): ActionResponse => {
    if (!donorUserId) {
      return { success: false, message: 'Authentication required to decline request.' };
    }

    const donor = db.findDonorProfileByUserId(donorUserId);
    if (!donor) {
      return { success: false, message: 'Donor profile not found.' };
    }

    const request = db.findBloodRequestById(requestId);
    if (!request) {
      return { success: false, message: 'Blood request not found.' };
    }

    const existingMatch = db.findMatchByRequestAndDonor(requestId, donorUserId);

    if (existingMatch) {
      if (existingMatch.status === 'DECLINED') {
        return { success: false, match: existingMatch, message: 'You have already declined this request.' };
      }

      const updated = db.updateMatchStatus(existingMatch.id, 'DECLINED', 'declinedAt');
      return { success: true, match: updated, message: 'Request declined.' };
    }

    const newMatch = db.createOrUpdateMatch({
      requestId,
      donorId: donorUserId,
      matchScore: 0,
      status: 'DECLINED',
      declinedAt: new Date().toISOString(),
    });
    return { success: true, match: newMatch, message: 'Request declined.' };
  },

  /**
   * Donor starts their journey to the receiver/hospital.
   */
  startJourney: (requestId: string, donorUserId: string): ActionResponse => {
    if (!donorUserId) {
      return { success: false, message: 'Authentication required.' };
    }
    const request = db.findBloodRequestById(requestId);
    if (!request || request.status !== 'ACTIVE') {
      return { success: false, message: 'This blood request is no longer active.' };
    }
    const match = db.findMatchByRequestAndDonor(requestId, donorUserId);
    if (!match || match.donorId !== donorUserId) {
      return { success: false, message: 'You are not the accepted donor for this request.' };
    }
    if (match.status !== 'ACCEPTED' && match.status !== 'CONFIRMED') {
      return { success: false, match, message: 'Cannot start journey: request must be in ACCEPTED status.' };
    }

    const updated = db.updateMatchStatus(match.id, 'ON_THE_WAY', 'onTheWayAt');
    if (updated) {
      notificationService.notifyDonorOnTheWay(requestId, donorUserId);
      return { success: true, match: updated, message: 'Journey started. Recipient has been notified that you are on the way.' };
    }
    return { success: false, message: 'Failed to update journey status.' };
  },

  /**
   * Donor reaches the receiver/hospital location.
   */
  donorReached: (requestId: string, donorUserId: string): ActionResponse => {
    if (!donorUserId) {
      return { success: false, message: 'Authentication required.' };
    }
    const request = db.findBloodRequestById(requestId);
    if (!request || request.status !== 'ACTIVE') {
      return { success: false, message: 'This blood request is no longer active.' };
    }
    const match = db.findMatchByRequestAndDonor(requestId, donorUserId);
    if (!match || match.donorId !== donorUserId) {
      return { success: false, message: 'You are not the accepted donor for this request.' };
    }
    if (match.status !== 'ON_THE_WAY') {
      return { success: false, match, message: 'Cannot mark reached: journey must be in ON THE WAY status.' };
    }

    const updated = db.updateMatchStatus(match.id, 'ARRIVED', 'arrivedAt');
    if (updated) {
      notificationService.notifyDonorArrived(requestId, donorUserId);
      return { success: true, match: updated, message: 'Marked as arrived. Recipient has been notified that you have reached.' };
    }
    return { success: false, message: 'Failed to update journey status.' };
  },

  /**
   * Marks blood donation as completed.
   */
  completeDonation: (requestId: string, userId: string): ActionResponse => {
    if (!userId) {
      return { success: false, message: 'Authentication required.' };
    }
    const request = db.findBloodRequestById(requestId);
    if (!request || request.status !== 'ACTIVE') {
      return { success: false, message: 'This blood request is no longer active.' };
    }

    // Find the active match for this request
    const matches = db.findMatchesByRequestId(requestId);
    const activeMatch = matches.find(m =>
      m.status === 'ACCEPTED' || m.status === 'CONFIRMED' || m.status === 'ON_THE_WAY' || m.status === 'ARRIVED'
    );
    if (!activeMatch) {
      return { success: false, message: 'No active accepted match found for this blood request.' };
    }

    // Security check: only receiver or accepted donor can complete
    if (request.receiverId !== userId && activeMatch.donorId !== userId) {
      return { success: false, message: 'You are not authorized to mark this donation as completed.' };
    }

    const updated = db.updateMatchStatus(activeMatch.id, 'COMPLETED', 'completedAt');
    if (updated) {
      notificationService.notifyDonationCompleted(requestId, activeMatch.donorId);
      return { success: true, match: updated, message: 'Donation marked as completed.' };
    }
    return { success: false, message: 'Failed to complete donation.' };
  },


  /**
   * Retrieve match record for a specific donor and request.
   */
  getMatch: (requestId: string, donorUserId: string): Match | undefined => {
    return db.findMatchByRequestAndDonor(requestId, donorUserId);
  },

  /**
   * Retrieve all matches for a request (receiver verification).
   */
  getMatchesForRequest: (requestId: string, receiverUserId?: string): Match[] => {
    const request = db.findBloodRequestById(requestId);
    if (!request) return [];
    if (receiverUserId && request.receiverId !== receiverUserId) {
      console.warn(`[Security] Unauthorized access attempt to matches of request ${requestId} by user ${receiverUserId}`);
      return [];
    }
    return db.findMatchesByRequestId(requestId);
  },
};
