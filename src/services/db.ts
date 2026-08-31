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

// Helpers for localStorage with dynamic migration
const getUsers = (): User[] => {
  const data = localStorage.getItem('raktsetu_users');
  if (!data) return [];
  try {
    const users: any[] = JSON.parse(data);
    let migrated = false;
    const migratedUsers: User[] = users.map((u: any) => {
      if (u.role === 'DONOR' || u.role === 'RECEIVER') {
        migrated = true;
        return { ...u, role: 'USER' as const };
      }
      return u as User;
    });
    if (migrated) {
      localStorage.setItem('raktsetu_users', JSON.stringify(migratedUsers));
    }
    return migratedUsers;
  } catch (e) {
    return [];
  }
};

const saveUsers = (users: User[]) => {
  localStorage.setItem('raktsetu_users', JSON.stringify(users));
};

const getDonors = (): DonorProfile[] => {
  const data = localStorage.getItem('raktsetu_donors');
  if (!data) return [];
  try {
    const donors: any[] = JSON.parse(data);
    let migrated = false;
    const migratedDonors: DonorProfile[] = donors.map((d: any) => {
      const updated = { ...d };
      // Map legacy availability property to availabilityStatus
      if (d.availability !== undefined && d.availabilityStatus === undefined) {
        migrated = true;
        updated.availabilityStatus = d.availability;
        delete updated.availability;
      }
      // Guarantee eligibilityStatus exists
      if (d.eligibilityStatus === undefined) {
        migrated = true;
        updated.eligibilityStatus = 'PENDING';
      }
      // Guarantee timestamps exist
      if (d.createdAt === undefined) {
        migrated = true;
        updated.createdAt = new Date().toISOString();
      }
      if (d.updatedAt === undefined) {
        migrated = true;
        updated.updatedAt = new Date().toISOString();
      }
      return updated as DonorProfile;
    });
    if (migrated) {
      localStorage.setItem('raktsetu_donors', JSON.stringify(migratedDonors));
    }
    return migratedDonors;
  } catch (e) {
    return [];
  }
};

const notifySync = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('raktsetu_storage_sync'));
  }
};

const saveDonors = (donors: DonorProfile[]) => {
  localStorage.setItem('raktsetu_donors', JSON.stringify(donors));
  notifySync();
};

const getReceivers = (): ReceiverProfile[] => {
  const data = localStorage.getItem('raktsetu_receivers');
  return data ? JSON.parse(data) : [];
};

const saveReceivers = (receivers: ReceiverProfile[]) => {
  localStorage.setItem('raktsetu_receivers', JSON.stringify(receivers));
  notifySync();
};

const getHospitals = (): HospitalProfile[] => {
  const data = localStorage.getItem('raktsetu_hospitals');
  return data ? JSON.parse(data) : [];
};

const saveHospitals = (hospitals: HospitalProfile[]) => {
  localStorage.setItem('raktsetu_hospitals', JSON.stringify(hospitals));
  notifySync();
};

const getRequests = (): BloodRequest[] => {
  const data = localStorage.getItem('raktsetu_requests');
  return data ? JSON.parse(data) : [];
};

const saveRequests = (requests: BloodRequest[]) => {
  localStorage.setItem('raktsetu_requests', JSON.stringify(requests));
  notifySync();
};

const getMatches = (): Match[] => {
  const data = localStorage.getItem('raktsetu_matches');
  return data ? JSON.parse(data) : [];
};

const saveMatches = (matches: Match[]) => {
  localStorage.setItem('raktsetu_matches', JSON.stringify(matches));
  notifySync();
};

const getNotifications = (): AppNotification[] => {
  const data = localStorage.getItem('raktsetu_notifications');
  return data ? JSON.parse(data) : [];
};

const saveNotifications = (notifications: AppNotification[]) => {
  localStorage.setItem('raktsetu_notifications', JSON.stringify(notifications));
  notifySync();
};

const getReports = (): UserReport[] => {
  const data = localStorage.getItem('raktsetu_reports');
  return data ? JSON.parse(data) : [];
};

const saveReports = (reports: UserReport[]) => {
  localStorage.setItem('raktsetu_reports', JSON.stringify(reports));
  notifySync();
};

const getBlocks = (): UserBlock[] => {
  const data = localStorage.getItem('raktsetu_blocks');
  return data ? JSON.parse(data) : [];
};

const saveBlocks = (blocks: UserBlock[]) => {
  localStorage.setItem('raktsetu_blocks', JSON.stringify(blocks));
  notifySync();
};



// Seed admin user
const ADMIN_PASSWORD_HASH = '240751996944e8f17046e7f1ee0fbf9087c53e8fbffb9dc31d36d4dfadff6fdc';

export const seedAdmin = () => {
  const users = getUsers();
  const adminExists = users.some(u => u.role === 'ADMIN' || u.email === 'admin@raktsetu.org');
  
  if (!adminExists) {
    const adminUser: User = {
      id: 'admin-id-0000-000000000000',
      name: 'System Admin',
      email: 'admin@raktsetu.org',
      phone: '+919999999999',
      passwordHash: ADMIN_PASSWORD_HASH,
      role: 'ADMIN',
      createdAt: new Date().toISOString()
    };
    users.push(adminUser);
    saveUsers(users);
  }
};

// Database CRUD Operations
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
    
    // Find pre-existing timestamps to preserve createdAt
    const existing = donors.find(d => d.userId === profile.userId);
    
    const newProfile: DonorProfile = {
      ...profile,
      createdAt: existing ? existing.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    filtered.push(newProfile);
    saveDonors(filtered);
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
      
      return true;
    }
    return false;
  },

  // Hospital Profiles
  createHospitalProfile: (profile: HospitalProfile): HospitalProfile => {
    const hospitals = getHospitals();
    hospitals.push(profile);
    saveHospitals(hospitals);
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
    return newRequest;
  },

  findActiveBloodRequestByReceiverId: (receiverId: string): BloodRequest | undefined => {
    return getRequests().find(r => r.receiverId === receiverId && r.status === 'ACTIVE');
  },

  resolveBloodRequest: (requestId: string, callerUserId?: string): boolean => {
    const requests = getRequests();
    const idx = requests.findIndex(r => r.id === requestId);
    if (idx !== -1) {
      // Ownership check: if callerUserId is passed, caller must be owner or admin
      if (callerUserId && requests[idx].receiverId !== callerUserId) {
        const caller = getUsers().find(u => u.id === callerUserId);
        if (caller?.role !== 'ADMIN') return false;
      }
      if (requests[idx].status === 'RESOLVED') return true; // idempotent

      requests[idx].status = 'RESOLVED';
      requests[idx].resolvedAt = new Date().toISOString();
      saveRequests(requests);

      // Update linked ACCEPTED/CONFIRMED matches to COMPLETED
      const matches = getMatches();
      let matchesChanged = false;
      matches.forEach(m => {
        if (m.requestId === requestId && (m.status === 'ACCEPTED' || m.status === 'CONFIRMED' || m.status === 'ON_THE_WAY' || m.status === 'ARRIVED')) {
          m.status = 'COMPLETED';
          m.updatedAt = new Date().toISOString();
          matchesChanged = true;
        }
      });
      if (matchesChanged) {
        saveMatches(matches);
      }
      return true;
    }
    return false;
  },

  cancelBloodRequest: (requestId: string, callerUserId?: string): boolean => {
    const requests = getRequests();
    const idx = requests.findIndex(r => r.id === requestId);
    if (idx !== -1) {
      // Ownership check: if callerUserId is passed, caller must be owner or admin
      if (callerUserId && requests[idx].receiverId !== callerUserId) {
        const caller = getUsers().find(u => u.id === callerUserId);
        if (caller?.role !== 'ADMIN') return false;
      }
      if (requests[idx].status === 'CANCELLED') return true; // idempotent

      requests[idx].status = 'CANCELLED';
      requests[idx].cancelledAt = new Date().toISOString();
      saveRequests(requests);

      // Update linked pending matches to CANCELLED
      const matches = getMatches();
      let matchesChanged = false;
      matches.forEach(m => {
        if (m.requestId === requestId && m.status === 'PENDING') {
          m.status = 'CANCELLED';
          m.updatedAt = new Date().toISOString();
          matchesChanged = true;
        }
      });
      if (matchesChanged) {
        saveMatches(matches);
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

  // Matches (Step 7)
  createOrUpdateMatch: (matchData: Omit<Match, 'id' | 'createdAt' | 'updatedAt'>): Match => {
    const matches = getMatches();
    const existingIdx = matches.findIndex(
      m => m.requestId === matchData.requestId && m.donorId === matchData.donorId
    );

    if (existingIdx !== -1) {
      const existing = matches[existingIdx];
      const updated: Match = {
        ...existing,
        ...matchData,
        updatedAt: new Date().toISOString(),
      };
      matches[existingIdx] = updated;
      saveMatches(matches);
      return updated;
    }

    const newMatch: Match = {
      ...matchData,
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    matches.push(newMatch);
    saveMatches(matches);
    return newMatch;
  },

  findMatchById: (id: string): Match | undefined => {
    return getMatches().find(m => m.id === id);
  },

  findMatchByRequestAndDonor: (requestId: string, donorId: string): Match | undefined => {
    return getMatches().find(m => m.requestId === requestId && m.donorId === donorId);
  },

  findMatchesByRequestId: (requestId: string): Match[] => {
    return getMatches().filter(m => m.requestId === requestId);
  },

  findMatchesByDonorId: (donorId: string): Match[] => {
    return getMatches().filter(m => m.donorId === donorId);
  },

  updateMatchStatus: (
    matchId: string,
    status: MatchStatus,
    timestampKey?: 'acceptedAt' | 'onTheWayAt' | 'arrivedAt' | 'completedAt' | 'declinedAt' | 'confirmedAt'
  ): Match | undefined => {
    const matches = getMatches();
    const idx = matches.findIndex(m => m.id === matchId);
    if (idx !== -1) {
      const match = matches[idx];
      match.status = status;
      match.updatedAt = new Date().toISOString();
      if (timestampKey) {
        match[timestampKey] = new Date().toISOString();
      }
      matches[idx] = match;
      saveMatches(matches);
      return match;
    }
    return undefined;
  },

  /**
   * Returns the active journey match for this donor where the linked
   * blood request is still ACTIVE. Used to enforce the business rule:
   *   ONE DONOR → ONE ACTIVE ACCEPTED/JOURNEY REQUEST AT A TIME.
   */
  findActiveAcceptedMatchByDonorId: (donorId: string): Match | undefined => {
    const activeStatuses: MatchStatus[] = ['ACCEPTED', 'CONFIRMED', 'ON_THE_WAY', 'ARRIVED'];
    const matches = getMatches().filter(
      m => m.donorId === donorId && activeStatuses.includes(m.status)
    );
    if (matches.length === 0) return undefined;

    const requests = getRequests();
    // An active accepted match is one where the linked blood request is still ACTIVE
    return matches.find(m => {
      const req = requests.find(r => r.id === m.requestId);
      return req && req.status === 'ACTIVE';
    });
  },


  getAllMatches: (): Match[] => {
    return getMatches();
  },

  // ── Notifications (Step 5) ──────────────────────────────
  createNotification: (data: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'>): AppNotification => {
    const notifications = getNotifications();
    const newNotif: AppNotification = {
      ...data,
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    notifications.unshift(newNotif); // newest first
    saveNotifications(notifications);
    return newNotif;
  },

  getNotificationsByUserId: (userId: string): AppNotification[] => {
    return getNotifications()
      .filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getUnreadNotificationsCount: (userId: string): number => {
    return getNotifications().filter(n => n.userId === userId && !n.isRead).length;
  },

  markNotificationAsRead: (notificationId: string): boolean => {
    const notifications = getNotifications();
    const idx = notifications.findIndex(n => n.id === notificationId);
    if (idx !== -1) {
      notifications[idx].isRead = true;
      saveNotifications(notifications);
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
    }
    return updated;
  },

  hasNotification: (userId: string, type: NotificationType, relatedRequestId?: string): boolean => {
    const notifications = getNotifications();
    return notifications.some(
      n => n.userId === userId && n.type === type && (!relatedRequestId || n.relatedRequestId === relatedRequestId)
    );
  },

  // ── Reports (Step 8) ────────────────────────────────────
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
      return true;
    }
    return false;
  },

  // ── User Blocks (Step 8) ────────────────────────────────
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
    return newBlock;
  },

  unblockUser: (blockerId: string, blockedUserId: string): boolean => {
    const blocks = getBlocks();
    const filtered = blocks.filter(b => !(b.blockerId === blockerId && b.blockedUserId === blockedUserId));
    if (filtered.length !== blocks.length) {
      saveBlocks(filtered);
      return true;
    }
    return false;
  },

  /**
   * Returns true if either userA has blocked userB OR userB has blocked userA.
   */
  isUserBlocked: (userA: string, userB: string): boolean => {
    if (!userA || !userB || userA === userB) return false;
    const blocks = getBlocks();
    return blocks.some(
      b => (b.blockerId === userA && b.blockedUserId === userB) ||
           (b.blockerId === userB && b.blockedUserId === userA)
    );
  },

  getBlockedUserIds: (userId: string): string[] => {
    const blocks = getBlocks();
    return blocks.filter(b => b.blockerId === userId).map(b => b.blockedUserId);
  },
};

