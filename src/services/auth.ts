import { db, seedAdmin } from './db';
import type { User, DonorProfile, ReceiverProfile, HospitalProfile } from './db';

// Ensure admin user is seeded on script evaluation
seedAdmin();

export interface CurrentSession {
  user: User;
  donorProfile?: DonorProfile;
  receiverProfile?: ReceiverProfile;
  hospitalProfile?: HospitalProfile;
}

// Secure client-side password hashing using SHA-256 Web Crypto API
export const hashPassword = async (password: string): Promise<string> => {
  const msgUint8 = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const authService = {
  /**
   * Log in user by matching email and hashed password
   */
  login: async (email: string, password: string): Promise<User> => {
    // Artificial delay to simulate network latency
    await new Promise(resolve => setTimeout(resolve, 800));

    const user = db.findUserByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password.');
    }

    const hashed = await hashPassword(password);
    if (user.passwordHash !== hashed) {
      throw new Error('Invalid email or password.');
    }

    // Save session
    sessionStorage.setItem('raktsetu_session_token', user.id);
    return user;
  },

  /**
   * Register a new user with multi-capability profile payloads
   */
  register: async (
    userData: {
      name: string;
      email: string;
      phone: string;
      password: string;
      role: 'USER' | 'HOSPITAL';
    },
    profileData: {
      donorProfile?: Omit<DonorProfile, 'userId' | 'eligibilityStatus' | 'createdAt' | 'updatedAt'>;
      receiverProfile?: Omit<ReceiverProfile, 'userId'>;
      hospitalProfile?: Omit<HospitalProfile, 'userId' | 'verificationStatus'>;
    }
  ): Promise<User> => {
    // Artificial delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const existingUser = db.findUserByEmail(userData.email);
    if (existingUser) {
      throw new Error('An account with this email already exists.');
    }

    const passwordHash = await hashPassword(userData.password);

    // 1. Create base User
    const newUser = db.createUser({
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      passwordHash,
      role: userData.role,
    });

    // 2. Create profiles based on capability configuration
    if (userData.role === 'USER') {
      if (profileData.donorProfile) {
        const donor: Omit<DonorProfile, 'createdAt' | 'updatedAt'> = {
          userId: newUser.id,
          bloodGroup: profileData.donorProfile.bloodGroup,
          location: profileData.donorProfile.location,
          availabilityStatus: profileData.donorProfile.availabilityStatus || 'AVAILABLE',
          preferredRadius: Number(profileData.donorProfile.preferredRadius) || 10,
          lastDonationDate: profileData.donorProfile.lastDonationDate || '',
          eligibilityStatus: 'PENDING', // Seed as PENDING eligibility status initially
        };
        db.createDonorProfile(donor);
      }
      
      if (profileData.receiverProfile) {
        const receiver: ReceiverProfile = {
          userId: newUser.id,
          location: profileData.receiverProfile.location,
          emergencyContact: profileData.receiverProfile.emergencyContact,
        };
        db.createReceiverProfile(receiver);
      }
    } else if (userData.role === 'HOSPITAL') {
      if (profileData.hospitalProfile) {
        const hospital: HospitalProfile = {
          userId: newUser.id,
          hospitalName: profileData.hospitalProfile.hospitalName,
          hospitalAddress: profileData.hospitalProfile.hospitalAddress,
          contactNumber: profileData.hospitalProfile.contactNumber,
          registrationNumber: profileData.hospitalProfile.registrationNumber,
          verificationStatus: 'PENDING',
        };
        db.createHospitalProfile(hospital);
      }
    }

    // Auto-login
    sessionStorage.setItem('raktsetu_session_token', newUser.id);
    return newUser;
  },

  /**
   * Retrieve current session holding dual user profiles
   */
  getCurrentSession: (): CurrentSession | null => {
    const userId = sessionStorage.getItem('raktsetu_session_token');
    if (!userId) return null;

    const user = db.findUserById(userId);
    if (!user) {
      sessionStorage.removeItem('raktsetu_session_token');
      return null;
    }

    const session: CurrentSession = { user };

    if (user.role === 'USER') {
      session.donorProfile = db.findDonorProfileByUserId(user.id);
      session.receiverProfile = db.findReceiverProfileByUserId(user.id);
    } else if (user.role === 'HOSPITAL') {
      session.hospitalProfile = db.findHospitalProfileByUserId(user.id);
    }

    return session;
  },

  /**
   * Sign out the active user
   */
  logout: () => {
    sessionStorage.removeItem('raktsetu_session_token');
  }
};
