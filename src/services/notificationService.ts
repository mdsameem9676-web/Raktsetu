import { db } from './db';
import type { BloodRequest } from './db';
import { matchingService } from './matchingService';

/**
 * Service for triggering, coordinating, and managing in-app notifications (Step 5).
 * Safe and non-blocking: errors in notification delivery never disrupt primary actions.
 */
export const notificationService = {
  /**
   * Triggered when a receiver creates a new blood request.
   * 1. Notifies the receiver that their request was created.
   * 2. Identifies matching, available donors within range and notifies them.
   */
  notifyRequestCreated: (request: BloodRequest) => {
    try {
      // 1. Receiver notification
      if (!db.hasNotification(request.receiverId, 'REQUEST_CREATED', request.id)) {
        db.createNotification({
          userId: request.receiverId,
          type: 'REQUEST_CREATED',
          title: '🩸 Blood Request Created',
          message: `Your ${request.bloodGroup} blood request for ${request.units} unit${request.units > 1 ? 's' : ''} has been created.`,
          relatedRequestId: request.id,
          urgency: request.urgency,
          metadata: {
            bloodGroup: request.bloodGroup,
            units: request.units,
            hospital: request.hospital,
          },
        });
      }

      // 2. Notify all compatible, available donors in the area
      const matches = matchingService.getMatchesForRequest(request.id, request.receiverId);
      matches.forEach(match => {
        if (!db.hasNotification(match.donorId, 'NEW_MATCH', request.id)) {
          const isUrgent = request.urgency === 'CRITICAL' || request.urgency === 'URGENT';
          db.createNotification({
            userId: match.donorId,
            type: 'NEW_MATCH',
            title: isUrgent ? '🔴 URGENT BLOOD REQUEST' : '🩸 New Blood Request Nearby',
            message: `An ${request.bloodGroup} blood request is available ${match.distanceText}.`,
            relatedRequestId: request.id,
            urgency: request.urgency,
            metadata: {
              bloodGroup: request.bloodGroup,
              units: request.units,
              distanceText: match.distanceText,
              hospital: request.hospital,
            },
          });
        }
      });
    } catch (err) {
      console.warn('[NotificationService] Error in notifyRequestCreated:', err);
    }
  },

  /**
   * Triggered when a donor accepts a blood request.
   * 1. Notifies the receiver that a donor accepted their request (HIGH PRIORITY).
   * 2. Notifies the donor of their confirmed acceptance.
   * 3. Notifies other competing donors that the single-unit request is no longer available.
   */
  notifyDonorAccepted: (requestId: string, donorUserId: string) => {
    try {
      const request = db.findBloodRequestById(requestId);
      if (!request) return;

      const donorUser = db.findUserById(donorUserId);
      const donorName = donorUser ? donorUser.name : 'A compatible donor';

      // 1. Receiver notification (High Priority)
      if (!db.hasNotification(request.receiverId, 'DONOR_ACCEPTED', requestId)) {
        db.createNotification({
          userId: request.receiverId,
          type: 'DONOR_ACCEPTED',
          title: '🟢 Donor Accepted Your Request',
          message: `Your blood request has been accepted by ${donorName}.`,
          relatedRequestId: requestId,
          urgency: request.urgency,
          metadata: {
            bloodGroup: request.bloodGroup,
            units: request.units,
            donorName,
            hospital: request.hospital,
          },
        });
      }

      // 2. Donor acceptance confirmation
      if (!db.hasNotification(donorUserId, 'REQUEST_ACCEPTED', requestId)) {
        db.createNotification({
          userId: donorUserId,
          type: 'REQUEST_ACCEPTED',
          title: '✓ Request Accepted',
          message: `You have accepted the ${request.bloodGroup} blood request.`,
          relatedRequestId: requestId,
          urgency: request.urgency,
          metadata: {
            bloodGroup: request.bloodGroup,
            units: request.units,
            hospital: request.hospital,
          },
        });
      }

      // 3. Notify other matching donors if request is single-unit (or fully claimed)
      const allMatches = db.findMatchesByRequestId(requestId);
      allMatches.forEach(m => {
        if (m.donorId !== donorUserId && !db.hasNotification(m.donorId, 'REQUEST_UNAVAILABLE', requestId)) {
          db.createNotification({
            userId: m.donorId,
            type: 'REQUEST_UNAVAILABLE',
            title: 'Request No Longer Available',
            message: 'Another donor has accepted this blood request.',
            relatedRequestId: requestId,
            urgency: 'NORMAL',
            metadata: {
              bloodGroup: request.bloodGroup,
              hospital: request.hospital,
            },
          });
        }
      });

    } catch (err) {
      console.warn('[NotificationService] Error in notifyDonorAccepted:', err);
    }
  },

  /**
   * Triggered when a donor starts their journey.
   * Notifies receiver that the donor is on the way.
   */
  notifyDonorOnTheWay: (requestId: string, donorUserId: string) => {
    try {
      const request = db.findBloodRequestById(requestId);
      if (!request) return;

      const donorUser = db.findUserById(donorUserId);
      const donorName = donorUser ? donorUser.name : 'Your donor';

      if (!db.hasNotification(request.receiverId, 'DONOR_ON_THE_WAY', requestId)) {
        db.createNotification({
          userId: request.receiverId,
          type: 'DONOR_ON_THE_WAY',
          title: '🚗 Donor is on the way',
          message: `${donorName} is on the way to ${request.hospital}.`,
          relatedRequestId: requestId,
          urgency: request.urgency,
          metadata: {
            bloodGroup: request.bloodGroup,
            donorName,
            hospital: request.hospital,
          },
        });
      }
    } catch (err) {
      console.warn('[NotificationService] Error in notifyDonorOnTheWay:', err);
    }
  },

  /**
   * Triggered when a donor reaches the receiver/hospital.
   * Notifies receiver that the donor has arrived.
   */
  notifyDonorArrived: (requestId: string, donorUserId: string) => {
    try {
      const request = db.findBloodRequestById(requestId);
      if (!request) return;

      const donorUser = db.findUserById(donorUserId);
      const donorName = donorUser ? donorUser.name : 'Your donor';

      if (!db.hasNotification(request.receiverId, 'DONOR_ARRIVED', requestId)) {
        db.createNotification({
          userId: request.receiverId,
          type: 'DONOR_ARRIVED',
          title: '📍 Donor Has Arrived',
          message: `${donorName} has reached ${request.hospital}.`,
          relatedRequestId: requestId,
          urgency: request.urgency,
          metadata: {
            bloodGroup: request.bloodGroup,
            donorName,
            hospital: request.hospital,
          },
        });
      }
    } catch (err) {
      console.warn('[NotificationService] Error in notifyDonorArrived:', err);
    }
  },

  /**
   * Triggered when blood donation is completed.
   */
  notifyDonationCompleted: (requestId: string, donorUserId: string) => {
    try {
      const request = db.findBloodRequestById(requestId);
      if (!request) return;

      // Receiver notification
      if (!db.hasNotification(request.receiverId, 'DONATION_COMPLETED', requestId)) {
        db.createNotification({
          userId: request.receiverId,
          type: 'DONATION_COMPLETED',
          title: '✓ Donation Completed',
          message: 'The blood donation has been completed.',
          relatedRequestId: requestId,
        });
      }

      // Donor notification
      if (!db.hasNotification(donorUserId, 'DONATION_COMPLETED', requestId)) {
        db.createNotification({
          userId: donorUserId,
          type: 'DONATION_COMPLETED',
          title: '✓ Donation Completed',
          message: 'Your blood donation has been marked as completed. Thank you for saving lives!',
          relatedRequestId: requestId,
        });
      }
    } catch (err) {
      console.warn('[NotificationService] Error in notifyDonationCompleted:', err);
    }
  },

  /**
   * Triggered when a receiver resolves their blood request.
   * 1. Notifies receiver that request is resolved.
   * 2. Notifies the accepting donor that the request has been resolved.
   */

  notifyRequestResolved: (requestId: string) => {
    try {
      const request = db.findBloodRequestById(requestId);
      if (!request) return;

      // 1. Receiver notification
      if (!db.hasNotification(request.receiverId, 'REQUEST_RESOLVED', requestId)) {
        db.createNotification({
          userId: request.receiverId,
          type: 'REQUEST_RESOLVED',
          title: '✓ Blood Request Resolved',
          message: 'Your blood request has been marked as resolved.',
          relatedRequestId: requestId,
        });
      }

      // 2. Notify donor(s) who accepted this request
      const matches = db.findMatchesByRequestId(requestId);
      matches.forEach(m => {
        if (m.status === 'ACCEPTED' || m.status === 'CONFIRMED' || m.status === 'COMPLETED') {
          if (!db.hasNotification(m.donorId, 'REQUEST_RESOLVED', requestId)) {
            db.createNotification({
              userId: m.donorId,
              type: 'REQUEST_RESOLVED',
              title: '✓ Request Resolved',
              message: 'The blood request you accepted has been resolved.',
              relatedRequestId: requestId,
            });
          }
        }
      });
    } catch (err) {
      console.warn('[NotificationService] Error in notifyRequestResolved:', err);
    }
  },

  /**
   * Triggered when a receiver cancels their blood request.
   */
  notifyRequestCancelled: (requestId: string) => {
    try {
      const request = db.findBloodRequestById(requestId);
      if (!request) return;

      // 1. Receiver notification
      if (!db.hasNotification(request.receiverId, 'REQUEST_CANCELLED', requestId)) {
        db.createNotification({
          userId: request.receiverId,
          type: 'REQUEST_CANCELLED',
          title: 'Request Cancelled',
          message: 'Your blood request has been cancelled.',
          relatedRequestId: requestId,
        });
      }

      // 2. Notify donor(s) who accepted this request
      const matches = db.findMatchesByRequestId(requestId);
      matches.forEach(m => {
        if (m.status === 'ACCEPTED' || m.status === 'CONFIRMED') {
          if (!db.hasNotification(m.donorId, 'REQUEST_CANCELLED', requestId)) {
            db.createNotification({
              userId: m.donorId,
              type: 'REQUEST_CANCELLED',
              title: 'Request Cancelled',
              message: 'The blood request was cancelled by the receiver.',
              relatedRequestId: requestId,
            });
          }
        }
      });
    } catch (err) {
      console.warn('[NotificationService] Error in notifyRequestCancelled:', err);
    }
  },
};
