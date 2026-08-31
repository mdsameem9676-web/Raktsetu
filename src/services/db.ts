import { supabase, isSupabaseConfigured } from './supabase';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: 'USER' | 'HOSPITAL' | 'ADMIN';
  createdAt: string;
}

export interface DonorProfile {
  userId: string;
  bloodGroup: string;
  location: string;
  latitude?: number;
  longitude?: number;
  availabilityStatus: 'AVAILABLE' | 'UNAVAILABLE' | 'TEMPORARILY_UNAVAILABLE';
  eligibilityStatus: 'PENDING' | 'ELIGIBLE' | 'NOT_CONFIRMED';
  preferredRadius: number;
  lastDonationDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReceiverProfile {
  userId: string;
  location: string;
  emergencyContact: string;
}

export interface HospitalProfile {
  userId: string;
  hospitalName: string;
  hospitalAddress: string;
  contactNumber: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  registrationNumber: string;
}

export interface BloodRequest {
  id: string;
  receiverId: string;
  bloodGroup: string;
  units: number;
  hospital: string;
  location: string;
  latitude?: number;
  longitude?: number;
  requiredDate: string;
  requiredTime: string;
  urgency: 'NORMAL' | 'URGENT' | 'CRITICAL';
  additionalNotes?: string;
  status: 'ACTIVE' | 'RESOLVED' | 'CANCELLED';
  createdAt: string;
  resolvedAt?: string;
  cancelledAt?: string;
}

export type MatchStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'ON_THE_WAY'
  | 'ARRIVED'
  | 'COMPLETED'
  | 'DECLINED'
  | 'CONFIRMED'
  | 'CANCELLED';

export interface Match {
  id: string;
  requestId: string;
  donorId: string; // donor's userId
  matchScore: number;
  status: MatchStatus;
  createdAt: string;
  updatedAt: string;
  acceptedAt?: string;
  onTheWayAt?: string;
  arrivedAt?: string;
  completedAt?: string;
  declinedAt?: string;
  confirmedAt?: string;
}

export type NotificationType =
  | 'REQUEST_CREATED'
  | 'NEW_MATCH'
  | 'DONOR_ACCEPTED'
  | 'REQUEST_ACCEPTED'
  | 'DONOR_ON_THE_WAY'
  | 'DONOR_ARRIVED'
  | 'DONATION_COMPLETED'
  | 'REQUEST_UNAVAILABLE'
  | 'REQUEST_RESOLVED'
  | 'REQUEST_CANCELLED';

export type ReportReason =
  | 'SUSPICIOUS_PROFILE'
  | 'FAKE_BLOOD_REQUEST'
  | 'INCORRECT_INFORMATION'
  | 'MISUSE_OF_PLATFORM'
  | 'OTHER_SAFETY_CONCERN';

export interface UserReport {
  id: string;
  reporterId: string;
  reportedUserId: string;
  requestId?: string;
  reason: ReportReason | string;
  description?: string;
  status: 'OPEN' | 'REVIEWED' | 'RESOLVED';
  createdAt: string;
}

export interface UserBlock {
  id: string;
  blockerId: string;
  blockedUserId: string;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedRequestId?: string;
  urgency?: 'NORMAL' | 'URGENT' | 'CRITICAL';
  metadata?: {
    bloodGroup?: string;
    units?: number;
    distanceText?: string;
    donorName?: string;
    hospital?: string;
  };
  isRead: boolean;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────
// STORAGE CACHE & SYNC DISPATCHER
// ─────────────────────────────────────────────────────────────

const safeGet = (key: string): any[] => {
  try {
    const d = localStorage.getItem(key);
    return d ? JSON.parse(d) : [];
  } catch {
    return [];
  }
};

const safeSet = (key: string, data: any[]) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // ignore
  }
};

const triggerSync = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('raktsetu_storage_sync'));
  }
};

const getUsers = (): User[] => safeGet('raktsetu_users');
const saveUsers = (users: User[]) => { safeSet('raktsetu_users', users); triggerSync(); };

const getDonors = (): DonorProfile[] => safeGet('raktsetu_donors');
const saveDonors = (donors: DonorProfile[]) => { safeSet('raktsetu_donors', donors); triggerSync(); };

const getReceivers = (): ReceiverProfile[] => safeGet('raktsetu_receivers');
const saveReceivers = (receivers: ReceiverProfile[]) => { safeSet('raktsetu_receivers', receivers); triggerSync(); };

const getHospitals = (): HospitalProfile[] => safeGet('raktsetu_hospitals');
const saveHospitals = (hospitals: HospitalProfile[]) => { safeSet('raktsetu_hospitals', hospitals); triggerSync(); };

const getRequests = (): BloodRequest[] => safeGet('raktsetu_requests');
const saveRequests = (requests: BloodRequest[]) => { safeSet('raktsetu_requests', requests); triggerSync(); };

const getMatches = (): Match[] => safeGet('raktsetu_matches');
const saveMatches = (matches: Match[]) => { safeSet('raktsetu_matches', matches); triggerSync(); };

const getReports = (): UserReport[] => safeGet('raktsetu_reports');
const saveReports = (reports: UserReport[]) => { safeSet('raktsetu_reports', reports); triggerSync(); };

const getBlocks = (): UserBlock[] => safeGet('raktsetu_blocks');
const saveBlocks = (blocks: UserBlock[]) => { safeSet('raktsetu_blocks', blocks); triggerSync(); };

const getNotifications = (): AppNotification[] => safeGet('raktsetu_notifications');
const saveNotifications = (notifications: AppNotification[]) => { safeSet('raktsetu_notifications', notifications); triggerSync(); };

// ─────────────────────────────────────────────────────────────
// SUPABASE REAL-TIME & CLOUD SYNCHRONIZATION
// ─────────────────────────────────────────────────────────────

let realtimeChannel: any = null;

export const seedAdmin = () => {
  const users = getUsers();
  const adminEmail = 'admin@raktsetu.org';
  const existing = users.find(u => u.email && u.email.toLowerCase() === adminEmail);
  if (!existing) {
    const adminUser: User = {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Raktsetu Administrator',
      email: adminEmail,
      phone: '+919999999999',
      passwordHash: '29d4791e84ffb007908b8b9818ea1914eb130f4fa94ad41973b1dc6ef009d73d', // SHA-256 for AdminPassword123!
      role: 'ADMIN',
      createdAt: new Date().toISOString(),
    };
    users.push(adminUser);
    saveUsers(users);
  }
};

/**
 * Synchronizes all state from Supabase PostgreSQL tables into local cache
 * and subscribes to Realtime postgres_changes channel.
 */
export const initCloudSync = async () => {
  if (!isSupabaseConfigured() || !supabase) {
    seedAdmin();
    return;
  }

  try {
    // 1. Fetch cloud records concurrently
    const [
      usersRes,
      donorsRes,
      receiversRes,
      hospitalsRes,
      requestsRes,
      matchesRes,
      blocksRes,
      reportsRes,
      notifsRes,
    ] = await Promise.all([
      supabase.from('users').select('*'),
      supabase.from('donor_profiles').select('*'),
      supabase.from('receiver_profiles').select('*'),
      supabase.from('hospital_profiles').select('*'),
      supabase.from('blood_requests').select('*'),
      supabase.from('matches').select('*'),
      supabase.from('user_blocks').select('*'),
      supabase.from('user_reports').select('*'),
      supabase.from('notifications').select('*'),
    ]);

    // Map database snake_case to TypeScript camelCase and update cache
    if (usersRes.data) {
      const mappedUsers: User[] = usersRes.data.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        passwordHash: u.password_hash,
        role: u.role,
        createdAt: u.created_at,
      }));
      safeSet('raktsetu_users', mappedUsers);
    }

    if (donorsRes.data) {
      const mappedDonors: DonorProfile[] = donorsRes.data.map(d => ({
        userId: d.user_id,
        bloodGroup: d.blood_group,
        location: d.location,
        latitude: d.latitude,
        longitude: d.longitude,
        availabilityStatus: d.availability_status,
        eligibilityStatus: d.eligibility_status,
        preferredRadius: d.preferred_radius,
        lastDonationDate: d.last_donation_date || '',
        createdAt: d.created_at,
        updatedAt: d.updated_at,
      }));
      safeSet('raktsetu_donors', mappedDonors);
    }

    if (receiversRes.data) {
      const mappedReceivers: ReceiverProfile[] = receiversRes.data.map(r => ({
        userId: r.user_id,
        location: r.location,
        emergencyContact: r.emergency_contact,
      }));
      safeSet('raktsetu_receivers', mappedReceivers);
    }

    if (hospitalsRes.data) {
      const mappedHospitals: HospitalProfile[] = hospitalsRes.data.map(h => ({
        userId: h.user_id,
        hospitalName: h.hospital_name,
        hospitalAddress: h.hospital_address,
        contactNumber: h.contact_number,
        verificationStatus: h.verification_status,
        registrationNumber: h.registration_number,
      }));
      safeSet('raktsetu_hospitals', mappedHospitals);
    }

    if (requestsRes.data) {
      const mappedRequests: BloodRequest[] = requestsRes.data.map(r => ({
        id: r.id,
        receiverId: r.receiver_id,
        bloodGroup: r.blood_group,
        units: r.units,
        hospital: r.hospital,
        location: r.location,
        latitude: r.latitude,
        longitude: r.longitude,
        requiredDate: r.required_date,
        requiredTime: r.required_time,
        urgency: r.urgency,
        additionalNotes: r.additional_notes,
        status: r.status,
        createdAt: r.created_at,
        resolvedAt: r.resolved_at,
        cancelledAt: r.cancelled_at,
      }));
      safeSet('raktsetu_requests', mappedRequests);
    }

    if (matchesRes.data) {
      const mappedMatches: Match[] = matchesRes.data.map(m => ({
        id: m.id,
        requestId: m.request_id,
        donorId: m.donor_id,
        matchScore: m.match_score,
        status: m.status,
        createdAt: m.created_at,
        updatedAt: m.updated_at,
        acceptedAt: m.accepted_at,
        onTheWayAt: m.on_the_way_at,
        arrivedAt: m.arrived_at,
        completedAt: m.completed_at,
        declinedAt: m.declined_at,
        confirmedAt: m.confirmed_at,
      }));
      safeSet('raktsetu_matches', mappedMatches);
    }

    if (blocksRes.data) {
      const mappedBlocks: UserBlock[] = blocksRes.data.map(b => ({
        id: b.id,
        blockerId: b.blocker_id,
        blockedUserId: b.blocked_user_id,
        createdAt: b.created_at,
      }));
      safeSet('raktsetu_blocks', mappedBlocks);
    }

    if (reportsRes.data) {
      const mappedReports: UserReport[] = reportsRes.data.map(rep => ({
        id: rep.id,
        reporterId: rep.reporter_id,
        reportedUserId: rep.reported_user_id,
        requestId: rep.request_id,
        reason: rep.reason,
        description: rep.description,
        status: rep.status,
        createdAt: rep.created_at,
      }));
      safeSet('raktsetu_reports', mappedReports);
    }

    if (notifsRes.data) {
      const mappedNotifs: AppNotification[] = notifsRes.data.map(n => ({
        id: n.id,
        userId: n.user_id,
        type: n.type,
        title: n.title,
        message: n.message,
        relatedRequestId: n.related_request_id,
        urgency: n.urgency,
        metadata: n.metadata,
        isRead: n.is_read,
        createdAt: n.created_at,
      }));
      safeSet('raktsetu_notifications', mappedNotifs);
    }

    seedAdmin();
    triggerSync();

    // 2. Subscribe to Realtime postgres_changes once (singleton subscription)
    if (!realtimeChannel && supabase) {
      realtimeChannel = supabase
        .channel('raktsetu_realtime_channel')
        .on('postgres_changes', { event: '*', schema: 'public' }, () => {
          // Re-sync data when changes occur remotely on any device
          initCloudSync();
        })
        .subscribe();
    }
  } catch (err) {
    console.warn('[Supabase Sync] Warning during cloud sync (using cache fallback):', err);
    seedAdmin();
  }
};

// Automatically run cloud sync on module load
if (typeof window !== 'undefined') {
  initCloudSync();
}

// ─────────────────────────────────────────────────────────────
// EXPORTED DATABASE ADAPTER (db)
// ─────────────────────────────────────────────────────────────

export const db = {
  // Users
  createUser: (user: Omit<User, 'id' | 'createdAt'>): User => {
    const users = getUsers();
    const newUser: User = {
      ...user,
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    saveUsers(users);

    if (supabase) {
      supabase.from('users').insert({
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        password_hash: newUser.passwordHash,
        role: newUser.role,
        created_at: newUser.createdAt,
      }).then();
    }

    return newUser;
  },

  findUserByEmail: (email: string): User | undefined => {
    if (!email) return undefined;
    return getUsers().find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
  },

  findUserById: (id: string): User | undefined => {
    return getUsers().find(u => u.id === id);
  },

  getAllUsers: (): User[] => {
    return getUsers();
  },

  // Donor Profiles
  createDonorProfile: (profile: Omit<DonorProfile, 'createdAt' | 'updatedAt'>): DonorProfile => {
    const donors = getDonors();
    const filtered = donors.filter(d => d.userId !== profile.userId);
    const existing = donors.find(d => d.userId === profile.userId);

    const newProfile: DonorProfile = {
      ...profile,
      createdAt: existing ? existing.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    filtered.push(newProfile);
    saveDonors(filtered);

    if (supabase) {
      supabase.from('donor_profiles').upsert({
        user_id: newProfile.userId,
        blood_group: newProfile.bloodGroup,
        location: newProfile.location,
        latitude: newProfile.latitude,
        longitude: newProfile.longitude,
        availability_status: newProfile.availabilityStatus,
        eligibility_status: newProfile.eligibilityStatus,
        preferred_radius: newProfile.preferredRadius,
        last_donation_date: newProfile.lastDonationDate || null,
        created_at: newProfile.createdAt,
        updated_at: newProfile.updatedAt,
      }).then();
    }

    return newProfile;
  },

  findDonorProfileByUserId: (userId: string): DonorProfile | undefined => {
    return getDonors().find(p => p.userId === userId);
  },

  updateDonorAvailability: (userId: string, availabilityStatus: 'AVAILABLE' | 'UNAVAILABLE' | 'TEMPORARILY_UNAVAILABLE'): boolean => {
    const donors = getDonors();
    const donor = donors.find(d => d.userId === userId);
    if (donor) {
      donor.availabilityStatus = availabilityStatus;
      donor.updatedAt = new Date().toISOString();
      saveDonors(donors);

      if (supabase) {
        supabase.from('donor_profiles')
          .update({ availability_status: availabilityStatus, updated_at: donor.updatedAt })
          .eq('user_id', userId)
          .then();
      }
      return true;
    }
    return false;
  },

  deleteDonorProfile: (userId: string, callerUserId?: string): boolean => {
    if (callerUserId && callerUserId !== userId) {
      const caller = getUsers().find(u => u.id === callerUserId);
      if (caller?.role !== 'ADMIN') return false;
    }
    const donors = getDonors();
    const filtered = donors.filter(d => d.userId !== userId);
    if (filtered.length !== donors.length) {
      saveDonors(filtered);
      if (supabase) {
        supabase.from('donor_profiles').delete().eq('user_id', userId).then();
      }
      return true;
    }
    return false;
  },

  // Receiver Profiles
  createReceiverProfile: (profile: ReceiverProfile): ReceiverProfile => {
    const receivers = getReceivers();
    const filtered = receivers.filter(r => r.userId !== profile.userId);
    filtered.push(profile);
    saveReceivers(filtered);

    if (supabase) {
      supabase.from('receiver_profiles').upsert({
        user_id: profile.userId,
        location: profile.location,
        emergency_contact: profile.emergencyContact,
        created_at: new Date().toISOString(),
      }).then();
    }

    return profile;
  },

  findReceiverProfileByUserId: (userId: string): ReceiverProfile | undefined => {
    return getReceivers().find(p => p.userId === userId);
  },

  deleteReceiverProfile: (userId: string, callerUserId?: string): boolean => {
    if (callerUserId && callerUserId !== userId) {
      const caller = getUsers().find(u => u.id === callerUserId);
      if (caller?.role !== 'ADMIN') return false;
    }
    const receivers = getReceivers();
    const filtered = receivers.filter(r => r.userId !== userId);
    if (filtered.length !== receivers.length) {
      saveReceivers(filtered);

      // Mark active requests as resolved
      const requests = getRequests();
      const updated = requests.map(req => {
        if (req.receiverId === userId && req.status === 'ACTIVE') {
          return { ...req, status: 'RESOLVED' as const };
        }
        return req;
      });
      saveRequests(updated);

      if (supabase) {
        supabase.from('receiver_profiles').delete().eq('user_id', userId).then();
        supabase.from('blood_requests').update({ status: 'RESOLVED' }).eq('receiver_id', userId).eq('status', 'ACTIVE').then();
      }

      return true;
    }
    return false;
  },

  // Hospital Profiles
  createHospitalProfile: (profile: HospitalProfile): HospitalProfile => {
    const hospitals = getHospitals();
    const filtered = hospitals.filter(h => h.userId !== profile.userId);
    filtered.push(profile);
    saveHospitals(filtered);

    if (supabase) {
      supabase.from('hospital_profiles').upsert({
        user_id: profile.userId,
        hospital_name: profile.hospitalName,
        hospital_address: profile.hospitalAddress,
        contact_number: profile.contactNumber,
        verification_status: profile.verificationStatus,
        registration_number: profile.registrationNumber,
        created_at: new Date().toISOString(),
      }).then();
    }

    return profile;
  },

  findHospitalProfileByUserId: (userId: string): HospitalProfile | undefined => {
    return getHospitals().find(p => p.userId === userId);
  },

  updateHospitalVerification: (userId: string, status: 'PENDING' | 'VERIFIED' | 'REJECTED'): boolean => {
    const hospitals = getHospitals();
    const idx = hospitals.findIndex(h => h.userId === userId);
    if (idx !== -1) {
      hospitals[idx].verificationStatus = status;
      saveHospitals(hospitals);

      if (supabase) {
        supabase.from('hospital_profiles').update({ verification_status: status }).eq('user_id', userId).then();
      }
      return true;
    }
    return false;
  },

  // Blood Requests
  createBloodRequest: (request: Omit<BloodRequest, 'id' | 'createdAt' | 'status'>): BloodRequest => {
    const validBloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    if (!validBloodGroups.includes(request.bloodGroup)) {
      throw new Error('Invalid blood group specified.');
    }
    const units = Number(request.units);
    if (isNaN(units) || units < 1 || units > 20) {
      throw new Error('Units must be between 1 and 20.');
    }
    if (!request.hospital || !request.hospital.trim()) {
      throw new Error('Hospital name is required.');
    }
    if (!request.location || !request.location.trim()) {
      throw new Error('Location is required.');
    }
    if (!['NORMAL', 'URGENT', 'CRITICAL'].includes(request.urgency)) {
      throw new Error('Invalid urgency specified.');
    }

    const requests = getRequests();
    const filtered = requests.map(r => {
      if (r.receiverId === request.receiverId && r.status === 'ACTIVE') {
        return { ...r, status: 'RESOLVED' as const };
      }
      return r;
    });

    const newRequest: BloodRequest = {
      ...request,
      units,
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };

    filtered.push(newRequest);
    saveRequests(filtered);

    if (supabase) {
      supabase.from('blood_requests').update({ status: 'RESOLVED' }).eq('receiver_id', request.receiverId).eq('status', 'ACTIVE').then();
      supabase.from('blood_requests').insert({
        id: newRequest.id,
        receiver_id: newRequest.receiverId,
        blood_group: newRequest.bloodGroup,
        units: newRequest.units,
        hospital: newRequest.hospital,
        location: newRequest.location,
        latitude: newRequest.latitude,
        longitude: newRequest.longitude,
        required_date: newRequest.requiredDate,
        required_time: newRequest.requiredTime,
        urgency: newRequest.urgency,
        additional_notes: newRequest.additionalNotes,
        status: newRequest.status,
        created_at: newRequest.createdAt,
      }).then();
    }

    return newRequest;
  },

  findActiveBloodRequestByReceiverId: (receiverId: string): BloodRequest | undefined => {
    return getRequests().find(r => r.receiverId === receiverId && r.status === 'ACTIVE');
  },

  resolveBloodRequest: (requestId: string, callerUserId?: string): boolean => {
    const requests = getRequests();
    const idx = requests.findIndex(r => r.id === requestId);
    if (idx !== -1) {
      if (callerUserId && requests[idx].receiverId !== callerUserId) {
        const caller = getUsers().find(u => u.id === callerUserId);
        if (caller?.role !== 'ADMIN') return false;
      }
      if (requests[idx].status === 'RESOLVED') return true;

      const resolvedAt = new Date().toISOString();
      requests[idx].status = 'RESOLVED';
      requests[idx].resolvedAt = resolvedAt;
      saveRequests(requests);

      const matches = getMatches();
      let matchesChanged = false;
      matches.forEach(m => {
        if (m.requestId === requestId && (m.status === 'ACCEPTED' || m.status === 'CONFIRMED' || m.status === 'ON_THE_WAY' || m.status === 'ARRIVED')) {
          m.status = 'COMPLETED';
          m.updatedAt = resolvedAt;
          matchesChanged = true;
        }
      });
      if (matchesChanged) {
        saveMatches(matches);
      }

      if (supabase) {
        supabase.from('blood_requests').update({ status: 'RESOLVED', resolved_at: resolvedAt }).eq('id', requestId).then();
        supabase.from('matches').update({ status: 'COMPLETED', updated_at: resolvedAt }).eq('request_id', requestId).in('status', ['ACCEPTED', 'CONFIRMED', 'ON_THE_WAY', 'ARRIVED']).then();
      }

      return true;
    }
    return false;
  },

  cancelBloodRequest: (requestId: string, callerUserId?: string): boolean => {
    const requests = getRequests();
    const idx = requests.findIndex(r => r.id === requestId);
    if (idx !== -1) {
      if (callerUserId && requests[idx].receiverId !== callerUserId) {
        const caller = getUsers().find(u => u.id === callerUserId);
        if (caller?.role !== 'ADMIN') return false;
      }
      if (requests[idx].status === 'CANCELLED') return true;

      const cancelledAt = new Date().toISOString();
      requests[idx].status = 'CANCELLED';
      requests[idx].cancelledAt = cancelledAt;
      saveRequests(requests);

      const matches = getMatches();
      let matchesChanged = false;
      matches.forEach(m => {
        if (m.requestId === requestId && m.status === 'PENDING') {
          m.status = 'CANCELLED';
          m.updatedAt = cancelledAt;
          matchesChanged = true;
        }
      });
      if (matchesChanged) {
        saveMatches(matches);
      }

      if (supabase) {
        supabase.from('blood_requests').update({ status: 'CANCELLED', cancelled_at: cancelledAt }).eq('id', requestId).then();
        supabase.from('matches').update({ status: 'CANCELLED', updated_at: cancelledAt }).eq('request_id', requestId).eq('status', 'PENDING').then();
      }

      return true;
    }
    return false;
  },

  findBloodRequestById: (id: string): BloodRequest | undefined => {
    return getRequests().find(r => r.id === id);
  },

  getAllBloodRequests: (): BloodRequest[] => {
    return getRequests();
  },

  // Donors
  getAllDonors: (): DonorProfile[] => {
    return getDonors();
  },

  // Matches
  createOrUpdateMatch: (match: Omit<Match, 'id' | 'createdAt' | 'updatedAt'>): Match => {
    const matches = getMatches();
    const existing = matches.find(m => m.requestId === match.requestId && m.donorId === match.donorId);

    const now = new Date().toISOString();
    let savedMatch: Match;

    if (existing) {
      savedMatch = {
        ...existing,
        ...match,
        updatedAt: now,
      };
      const idx = matches.findIndex(m => m.id === existing.id);
      matches[idx] = savedMatch;
    } else {
      savedMatch = {
        ...match,
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
        createdAt: now,
        updatedAt: now,
      };
      matches.push(savedMatch);
    }

    saveMatches(matches);

    if (supabase) {
      supabase.from('matches').upsert({
        id: savedMatch.id,
        request_id: savedMatch.requestId,
        donor_id: savedMatch.donorId,
        match_score: savedMatch.matchScore,
        status: savedMatch.status,
        created_at: savedMatch.createdAt,
        updated_at: savedMatch.updatedAt,
        accepted_at: savedMatch.acceptedAt,
        on_the_way_at: savedMatch.onTheWayAt,
        arrived_at: savedMatch.arrivedAt,
        completed_at: savedMatch.completedAt,
        declined_at: savedMatch.declinedAt,
        confirmed_at: savedMatch.confirmedAt,
      }).then();
    }

    return savedMatch;
  },

  updateMatchStatus: (
    matchId: string,
    status: MatchStatus,
    timestampField?: 'acceptedAt' | 'onTheWayAt' | 'arrivedAt' | 'completedAt' | 'declinedAt' | 'confirmedAt'
  ): Match | undefined => {
    const matches = getMatches();
    const idx = matches.findIndex(m => m.id === matchId);
    if (idx !== -1) {
      const now = new Date().toISOString();
      const updated: Match = {
        ...matches[idx],
        status,
        updatedAt: now,
        ...(timestampField ? { [timestampField]: now } : {}),
      };
      matches[idx] = updated;
      saveMatches(matches);

      if (supabase) {
        const updatePayload: any = {
          status,
          updated_at: now,
        };
        if (timestampField === 'acceptedAt') updatePayload.accepted_at = now;
        if (timestampField === 'onTheWayAt') updatePayload.on_the_way_at = now;
        if (timestampField === 'arrivedAt') updatePayload.arrived_at = now;
        if (timestampField === 'completedAt') updatePayload.completed_at = now;
        if (timestampField === 'declinedAt') updatePayload.declined_at = now;
        if (timestampField === 'confirmedAt') updatePayload.confirmed_at = now;

        supabase.from('matches').update(updatePayload).eq('id', matchId).then();
      }

      return updated;
    }
    return undefined;
  },

  findMatchesByRequestId: (requestId: string): Match[] => {
    return getMatches().filter(m => m.requestId === requestId);
  },

  findActiveAcceptedMatchByDonorId: (donorId: string): Match | undefined => {
    return getMatches().find(
      m => m.donorId === donorId &&
      (m.status === 'ACCEPTED' || m.status === 'CONFIRMED' || m.status === 'ON_THE_WAY' || m.status === 'ARRIVED')
    );
  },

  findMatchByRequestAndDonor: (requestId: string, donorId: string): Match | undefined => {
    return getMatches().find(m => m.requestId === requestId && m.donorId === donorId);
  },

  findMatchById: (id: string): Match | undefined => {
    return getMatches().find(m => m.id === id);
  },

  getAllMatches: (): Match[] => {
    return getMatches();
  },

  // Notifications
  createNotification: (notif: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'>): AppNotification => {
    const notifications = getNotifications();
    const newNotif: AppNotification = {
      ...notif,
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    notifications.unshift(newNotif);
    saveNotifications(notifications);

    if (supabase) {
      supabase.from('notifications').insert({
        id: newNotif.id,
        user_id: newNotif.userId,
        type: newNotif.type,
        title: newNotif.title,
        message: newNotif.message,
        related_request_id: newNotif.relatedRequestId || null,
        urgency: newNotif.urgency || null,
        metadata: newNotif.metadata || {},
        is_read: false,
        created_at: newNotif.createdAt,
      }).then();
    }

    return newNotif;
  },

  getNotificationsByUserId: (userId: string): AppNotification[] => {
    return getNotifications().filter(n => n.userId === userId);
  },

  markNotificationAsRead: (notificationId: string): boolean => {
    const notifications = getNotifications();
    const idx = notifications.findIndex(n => n.id === notificationId);
    if (idx !== -1) {
      notifications[idx].isRead = true;
      saveNotifications(notifications);

      if (supabase) {
        supabase.from('notifications').update({ is_read: true }).eq('id', notificationId).then();
      }
      return true;
    }
    return false;
  },

  markAllNotificationsAsRead: (userId: string): boolean => {
    const notifications = getNotifications();
    let updated = false;
    notifications.forEach(n => {
      if (n.userId === userId && !n.isRead) {
        n.isRead = true;
        updated = true;
      }
    });
    if (updated) {
      saveNotifications(notifications);
      if (supabase) {
        supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).then();
      }
    }
    return updated;
  },

  hasNotification: (userId: string, type: NotificationType, relatedRequestId?: string): boolean => {
    const notifications = getNotifications();
    return notifications.some(
      n => n.userId === userId && n.type === type && (!relatedRequestId || n.relatedRequestId === relatedRequestId)
    );
  },

  // Reports
  createReport: (report: Omit<UserReport, 'id' | 'createdAt' | 'status'>): UserReport => {
    if (!report.reporterId || !report.reportedUserId) {
      throw new Error('Reporter ID and Reported User ID are required.');
    }
    if (!report.reason || !report.reason.trim()) {
      throw new Error('Report reason is required.');
    }
    const reports = getReports();
    const newReport: UserReport = {
      ...report,
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
      status: 'OPEN',
      createdAt: new Date().toISOString(),
    };
    reports.unshift(newReport);
    saveReports(reports);

    if (supabase) {
      supabase.from('user_reports').insert({
        id: newReport.id,
        reporter_id: newReport.reporterId,
        reported_user_id: newReport.reportedUserId,
        request_id: newReport.requestId || null,
        reason: newReport.reason,
        description: newReport.description,
        status: newReport.status,
        created_at: newReport.createdAt,
      }).then();
    }

    return newReport;
  },

  getAllReceivers: (): ReceiverProfile[] => {
    return getReceivers();
  },

  getAllReports: (): UserReport[] => {
    return getReports();
  },

  getReportsByReporter: (reporterId: string): UserReport[] => {
    return getReports().filter(r => r.reporterId === reporterId);
  },

  updateReportStatus: (reportId: string, status: 'OPEN' | 'REVIEWED' | 'RESOLVED'): boolean => {
    const reports = getReports();
    const idx = reports.findIndex(r => r.id === reportId);
    if (idx !== -1) {
      reports[idx].status = status;
      saveReports(reports);

      if (supabase) {
        supabase.from('user_reports').update({ status }).eq('id', reportId).then();
      }
      return true;
    }
    return false;
  },

  // User Blocks
  getAllBlocks: (): UserBlock[] => {
    return getBlocks();
  },

  blockUser: (blockerId: string, blockedUserId: string): UserBlock => {
    if (!blockerId || !blockedUserId || blockerId === blockedUserId) {
      throw new Error('Invalid block request: cannot block self or empty user ID.');
    }
    const blocks = getBlocks();
    const existing = blocks.find(b => b.blockerId === blockerId && b.blockedUserId === blockedUserId);
    if (existing) return existing;

    const newBlock: UserBlock = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
      blockerId,
      blockedUserId,
      createdAt: new Date().toISOString(),
    };
    blocks.push(newBlock);
    saveBlocks(blocks);

    if (supabase) {
      supabase.from('user_blocks').insert({
        id: newBlock.id,
        blocker_id: newBlock.blockerId,
        blocked_user_id: newBlock.blockedUserId,
        created_at: newBlock.createdAt,
      }).then();
    }

    return newBlock;
  },

  unblockUser: (blockerId: string, blockedUserId: string): boolean => {
    const blocks = getBlocks();
    const filtered = blocks.filter(b => !(b.blockerId === blockerId && b.blockedUserId === blockedUserId));
    if (filtered.length !== blocks.length) {
      saveBlocks(filtered);

      if (supabase) {
        supabase.from('user_blocks').delete().eq('blocker_id', blockerId).eq('blocked_user_id', blockedUserId).then();
      }
      return true;
    }
    return false;
  },

  isUserBlocked: (userA: string, userB: string): boolean => {
    if (!userA || !userB || userA === userB) return false;
    const blocks = getBlocks();
    return blocks.some(
      b =>
        (b.blockerId === userA && b.blockedUserId === userB) ||
        (b.blockerId === userB && b.blockedUserId === userA)
    );
  },
};
