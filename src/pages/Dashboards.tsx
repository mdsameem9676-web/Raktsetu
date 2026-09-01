import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth';
import type { CurrentSession } from '../services/auth';
import { db } from '../services/db';
import type { User, BloodRequest, DonorProfile, ReceiverProfile, UserReport, UserBlock, Match } from '../services/db';
import { matchingService } from '../services/matchingService';
import type { MatchResult, RankedBloodRequest } from '../services/matchingService';
import { matchActionService } from '../services/matchActionService';
import { geocodeLocation } from '../services/geocodingService';
import { notificationService } from '../services/notificationService';
import type { AppNotification } from '../services/db';

import {
  Heart, LogOut, Shield, MapPin, Activity,
  Building2, Phone, CheckCircle2, AlertTriangle,
  Users2, Sparkles, PlusCircle, Trash2, Calendar,
  ShieldAlert, RefreshCw, X, Clock, Droplets, Edit2, Award, ThumbsUp, ThumbsDown, Info,
  Bell, CheckCheck, Flag, Ban, BarChart3, Search, Layers
} from 'lucide-react';

const URGENCY_BADGE: Record<string, { label: string; classes: string }> = {
  CRITICAL: { label: '🔴 Critical', classes: 'bg-rose-100 text-rose-800 border-rose-200' },
  URGENT:   { label: '🟡 Urgent',   classes: 'bg-amber-100 text-amber-800 border-amber-200' },
  NORMAL:   { label: '🟢 Normal',   classes: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
};

const STATUS_BADGE: Record<string, { label: string; dot: string }> = {
  AVAILABLE:              { label: '🟢 Available',             dot: 'bg-emerald-400' },
  UNAVAILABLE:            { label: '⚫ Unavailable',            dot: 'bg-slate-400' },
  TEMPORARILY_UNAVAILABLE:{ label: '🔴 Temp Unavailable',      dot: 'bg-rose-400' },
};

const formatTimeAgo = (isoString: string): string => {
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return 'Recent';
  }
};

// ─────────────────────────────────────────────────────────
// NOTIFICATION BELL & DROPDOWN (Step 5)
// ─────────────────────────────────────────────────────────
interface NotificationBellDropdownProps {
  userId: string;
}

const NotificationBellDropdown: React.FC<NotificationBellDropdownProps> = ({ userId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const loadNotifications = useCallback(() => {
    if (!userId) return;
    const list = db.getNotificationsByUserId(userId);
    setNotifications(list);
  }, [userId]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Real-time synchronization
  useEffect(() => {
    const handleSync = () => loadNotifications();
    window.addEventListener('storage', handleSync);
    window.addEventListener('raktsetu_storage_sync', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('raktsetu_storage_sync', handleSync);
    };
  }, [loadNotifications]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAllRead = () => {
    db.markAllNotificationsAsRead(userId);
    loadNotifications();
  };

  const handleItemClick = (notif: AppNotification) => {
    if (!notif.isRead) {
      db.markNotificationAsRead(notif.id);
      loadNotifications();
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-slate-100 flex items-center justify-center shadow-xs"
        title="Notifications"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[9px] font-black h-4 min-w-4 px-1 rounded-full flex items-center justify-center animate-pulse shadow-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 z-50 animate-in fade-in zoom-in-95 duration-100 max-h-[80vh] flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <Bell className="h-4 w-4 text-rose-600" />
                Notifications
              </h4>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-100 px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all as read
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1 space-y-2 pr-1 divide-y divide-slate-50">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Bell className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-semibold text-slate-600">No notifications yet</p>
                <p className="text-[10px] text-slate-400 mt-0.5">You'll see alerts here when matching events occur.</p>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => handleItemClick(n)}
                  className={`p-3 rounded-xl cursor-pointer transition-all ${
                    !n.isRead
                      ? 'bg-rose-50/40 hover:bg-rose-50/70 border border-rose-100/60'
                      : 'hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className={`text-xs ${!n.isRead ? 'font-black text-slate-900' : 'font-bold text-slate-700'}`}>
                      {n.title}
                    </p>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap font-medium">
                      {formatTimeAgo(n.createdAt)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {n.message}
                  </p>
                  {n.urgency && (n.urgency === 'URGENT' || n.urgency === 'CRITICAL') && (
                    <span className="inline-block mt-1.5 text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded border bg-rose-100 text-rose-800 border-rose-200">
                      {n.urgency}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};


// ─────────────────────────────────────────────────────────
// DASHBOARD LAYOUT WRAPPER
// ─────────────────────────────────────────────────────────
interface DashboardLayoutProps {
  session: CurrentSession;
  title: string;
  onLogout: () => void;
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ session, title, onLogout, children }) => (
  <div className="min-h-screen bg-slate-50 flex flex-col">
    <header className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="bg-rose-600 p-2 rounded-xl text-white">
            <Heart className="h-4 w-4 fill-current" />
          </div>
          <span className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
            Raktsetu Portal
            <span className="text-[9px] font-bold text-rose-700 bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded uppercase">
              {session.user.role}
            </span>
          </span>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <NotificationBellDropdown userId={session.user.id} />
          <div className="hidden sm:block text-right">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Signed in as</p>
            <p className="text-sm font-bold text-slate-800">{session.user.name}</p>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-slate-100"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </div>
    </header>


    <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{title}</h1>
          <p className="text-sm text-slate-500 font-medium">
            Welcome back, {session.user.name}. Here is your coordination portal.
          </p>
        </div>
        <div className="text-xs text-slate-400 font-semibold bg-white px-3.5 py-2 rounded-xl border border-slate-100 shadow-sm flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-rose-500 animate-pulse" />
          Two-Way Capabilities Enabled
        </div>
      </div>
      {children}
    </main>
  </div>
);


// ─────────────────────────────────────────────────────────
// REPORT MODAL (Safety & Trust Step 8)
// ─────────────────────────────────────────────────────────
interface ReportModalProps {
  reportedUserId: string;
  reportedUserName?: string;
  requestId?: string;
  onClose: () => void;
  onSubmitReport: (reason: string, description: string) => void;
}

const ReportModal: React.FC<ReportModalProps> = ({
  reportedUserName,
  onClose,
  onSubmitReport,
}) => {
  const [reason, setReason] = useState<string>('SUSPICIOUS_PROFILE');
  const [description, setDescription] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitReport(reason, description);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-start gap-3 mb-4">
          <div className="bg-rose-100 p-2.5 rounded-xl text-rose-600">
            <Flag className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Report Safety Concern</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Report {reportedUserName ? <strong>{reportedUserName}</strong> : 'this user/request'} confidentially
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Reason for Report *
            </label>
            <select
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-400"
            >
              <option value="SUSPICIOUS_PROFILE">Suspicious Profile / Activity</option>
              <option value="FAKE_BLOOD_REQUEST">Fake Blood Request</option>
              <option value="INCORRECT_INFORMATION">Incorrect or Misleading Information</option>
              <option value="MISUSE_OF_PLATFORM">Misuse of Platform / Inappropriate Behavior</option>
              <option value="OTHER_SAFETY_CONCERN">Other Safety Concern</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Additional Details (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="Describe what happened or why you are reporting..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-[11px] text-slate-500 leading-relaxed">
            🛡️ Reports are reviewed by moderators. Submitting a report does not automatically delete profiles or cancel active matches.
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-xs"
            >
              Submit Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


// ─────────────────────────────────────────────────────────
// REQUEST DETAIL MODAL (Donor inspecting a request with Accept/Decline)
// ─────────────────────────────────────────────────────────
interface RequestDetailModalProps {
  rankedItem: RankedBloodRequest;
  onClose: () => void;
  onAccept: (requestId: string) => void;
  onDecline: (requestId: string) => void;
  onReport?: (reportedUserId: string, reportedUserName?: string, requestId?: string) => void;
  onBlock?: (targetUserId: string, targetUserName?: string) => void;
}

const RequestDetailModal: React.FC<RequestDetailModalProps> = ({
  rankedItem,
  onClose,
  onAccept,
  onDecline,
  onReport,
  onBlock,
}) => {
  const { request, matchScore, distanceText, matchStatus, reasons } = rankedItem;
  const urgency = URGENCY_BADGE[request.urgency] ?? URGENCY_BADGE.NORMAL;

  const [confirmMode, setConfirmMode] = useState<'NONE' | 'ACCEPT' | 'DECLINE'>('NONE');

  const isAccepted = matchStatus === 'ACCEPTED' || matchStatus === 'CONFIRMED';
  const isDeclined = matchStatus === 'DECLINED';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-start gap-3 mb-5">
          <div className="bg-rose-100 p-2.5 rounded-xl">
            <Droplets className="h-5 w-5 text-rose-600" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Blood Request Details</h3>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${urgency.classes}`}>
                {urgency.label}
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                🎯 {matchScore}% Overall Match Score
              </span>
              {isAccepted ? (
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  ✓ MATCH ACCEPTED
                </span>
              ) : isDeclined ? (
                <span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded">
                  ⚫ DECLINED
                </span>
              ) : (
                <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded flex items-center gap-1">
                  🟡 REQUEST AVAILABLE
                </span>
              )}

            </div>
          </div>
        </div>

        <div className="space-y-3 text-sm">
          {/* Critical Emergency Warning */}
          {request.urgency === 'CRITICAL' && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-[11px] text-rose-800 font-medium flex items-start gap-2">
              <ShieldAlert className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <span>
                <strong>Emergency situation?</strong> Please contact local emergency services or a qualified medical facility immediately. Raktsetu is not a replacement for emergency medical care.
              </span>
            </div>
          )}

          {/* Blood Compatibility Badge */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span className="text-xs font-bold text-emerald-900">Blood Compatibility:</span>
            </div>
            <span className="text-xs font-extrabold text-emerald-700">✓ Compatible RBC Donor</span>
          </div>

          <div className="grid grid-cols-3 gap-3 bg-slate-50 rounded-2xl p-4">
            <div className="text-center">
              <p className="text-[9px] uppercase font-bold text-slate-400 mb-1">Blood Group</p>
              <p className="text-2xl font-black text-rose-600">{request.bloodGroup}</p>
            </div>
            <div className="text-center border-x border-slate-200">
              <p className="text-[9px] uppercase font-bold text-slate-400 mb-1">Units</p>
              <p className="text-2xl font-black text-slate-800">{request.units}</p>
            </div>
            <div className="text-center">
              <p className="text-[9px] uppercase font-bold text-slate-400 mb-1">Proximity</p>
              <p className="text-sm font-black text-indigo-600 mt-2">{distanceText}</p>
            </div>
          </div>

          <div className="space-y-2 px-1">
            <div className="flex items-center gap-2.5 text-slate-700 text-xs">
              <Building2 className="h-4 w-4 text-slate-400 shrink-0" />
              <span className="font-semibold">{request.hospital}</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-700 text-xs">
              <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
              <span>{request.location}</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-700 text-xs">
              <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
              <span>Required by <strong>{request.requiredDate}</strong> at <strong>{request.requiredTime}</strong></span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-500 text-xs">
              <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span>Posted {new Date(request.createdAt).toLocaleString()}</span>
            </div>
          </div>

          {request.additionalNotes && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-800 font-medium">
              📝 <strong>Notes:</strong> {request.additionalNotes}
            </div>
          )}

          {/* Match reasons */}
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Matching Criteria & Factors</p>
            <ul className="text-xs text-slate-600 space-y-1">
              {reasons.map((r, i) => (
                <li key={i} className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* ══ ACCEPT / DECLINE ACTIONS ══ */}
          <div className="pt-2 border-t border-slate-100">
            {isAccepted ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 mx-auto mb-1.5" />
                <p className="text-xs font-bold text-emerald-900">You have accepted this blood request.</p>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  Match status is <strong>ACCEPTED</strong>. The recipient has been updated.
                </p>
              </div>
            ) : isDeclined ? (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
                <p className="text-xs font-bold text-slate-600">You declined this blood request.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">This request remains available to other suitable donors.</p>
              </div>
            ) : confirmMode === 'ACCEPT' ? (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-3">
                <p className="text-xs font-bold text-rose-900 text-center">
                  Are you sure you want to accept this blood request?
                </p>
                <p className="text-[11px] text-rose-700 text-center leading-relaxed">
                  By accepting, you confirm your availability to coordinate for donation with the medical facility.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmMode('NONE')}
                    className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      onAccept(request.id);
                      setConfirmMode('NONE');
                    }}
                    className="flex-1 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm"
                  >
                    Confirm Accept
                  </button>
                </div>
              </div>
            ) : confirmMode === 'DECLINE' ? (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <p className="text-xs font-bold text-slate-800 text-center">
                  Are you sure you want to decline this request?
                </p>
                <p className="text-[11px] text-slate-500 text-center leading-relaxed">
                  The request will remain active for other suitable donors in the area.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmMode('NONE')}
                    className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      onDecline(request.id);
                      setConfirmMode('NONE');
                    }}
                    className="flex-1 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-xl shadow-sm"
                  >
                    Confirm Decline
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-[11px] font-bold text-slate-600 uppercase mb-2 text-center">
                  Would you like to help with this request?
                </p>
                <div className="flex gap-2.5">
                  <button
                    onClick={() => setConfirmMode('ACCEPT')}
                    className="flex-1 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-all"
                  >
                    <ThumbsUp className="h-3.5 w-3.5" />
                    Accept Request
                  </button>
                  <button
                    onClick={() => setConfirmMode('DECLINE')}
                    className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all flex items-center justify-center gap-1"
                  >
                    <ThumbsDown className="h-3.5 w-3.5" />
                    Decline
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Informational Medical Disclaimer */}
        <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-3 text-[10px] text-slate-500 leading-relaxed flex items-start gap-2">
          <Info className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
          <span>
            <strong>Medical Disclaimer:</strong> Compatibility shown is based on simplified RBC blood-group matching for this MVP. Final transfusion compatibility must always be verified by qualified medical professionals.
          </span>
        </div>

        {/* Safety & Trust Actions (Step 8) */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <button
            onClick={() => onReport?.(request.receiverId, `Blood Request for ${request.bloodGroup}`, request.id)}
            className="hover:text-rose-600 flex items-center gap-1.5 transition-colors font-medium"
          >
            <Flag className="h-3.5 w-3.5" />
            Report Request
          </button>
          <button
            onClick={() => onBlock?.(request.receiverId, 'this Requester')}
            className="hover:text-slate-700 flex items-center gap-1.5 transition-colors font-medium"
          >
            <Ban className="h-3.5 w-3.5" />
            Block Requester
          </button>
        </div>
      </div>
    </div>
  );
};


// ─────────────────────────────────────────────────────────
// DONOR MATCH DETAIL MODAL (Receiver inspecting a matched donor)
// ─────────────────────────────────────────────────────────
interface DonorMatchModalProps {
  match: MatchResult;
  onClose: () => void;
  onReport?: (reportedUserId: string, reportedUserName?: string) => void;
  onBlock?: (targetUserId: string, targetUserName?: string) => void;
}

const DonorMatchModal: React.FC<DonorMatchModalProps> = ({ match, onClose, onReport, onBlock }) => {
  const isAccepted = match.matchStatus === 'ACCEPTED' || match.matchStatus === 'CONFIRMED';
  const isDeclined = match.matchStatus === 'DECLINED';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-start gap-3 mb-5">
          <div className="bg-emerald-100 p-2.5 rounded-xl">
            <Award className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Matching Donor Profile</h3>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded border uppercase bg-emerald-50 text-emerald-800 border-emerald-200">
                🥇 {match.matchScore}% Overall Match Score
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                isAccepted
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                  : isDeclined
                  ? 'bg-slate-100 text-slate-600 border-slate-300'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}>
                {isAccepted ? '✓ ACCEPTED' : isDeclined ? 'DECLINED' : 'PENDING'}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3 text-sm">
          {/* Blood Compatibility Breakdown */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Blood Compatibility:
              </span>
              <span className="text-xs font-extrabold text-emerald-700">✓ Compatible</span>
            </div>
            <div className="text-[11px] text-emerald-800 flex justify-between pt-1 border-t border-emerald-200/60">
              <span>Donor Blood: <strong>{match.bloodGroup}</strong></span>
              <span>Recipient Blood: <strong>{match.receiverBloodGroup}</strong></span>
            </div>
            <p className="text-[10px] text-emerald-700/80 pt-0.5">
              The {match.matchScore}% score is an <strong>Overall Match Score</strong> based on compatibility, availability, proximity, urgency, and eligibility.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 bg-slate-50 rounded-2xl p-4">
            <div className="text-center">
              <p className="text-[9px] uppercase font-bold text-slate-400 mb-1">Donor</p>
              <p className="text-sm font-extrabold text-slate-800 truncate">{match.donorName}</p>
            </div>
            <div className="text-center border-x border-slate-200">
              <p className="text-[9px] uppercase font-bold text-slate-400 mb-1">Blood Group</p>
              <p className="text-2xl font-black text-rose-600">{match.bloodGroup}</p>
            </div>
            <div className="text-center">
              <p className="text-[9px] uppercase font-bold text-slate-400 mb-1">Match Status</p>
              <p className={`text-xs font-bold mt-1 ${isAccepted ? 'text-emerald-600' : isDeclined ? 'text-slate-500' : 'text-amber-600'}`}>
                {isAccepted ? '✓ ACCEPTED' : isDeclined ? 'DECLINED' : 'PENDING'}
              </p>
            </div>
          </div>

          <div className="space-y-2 px-1">
            <div className="flex items-center gap-2.5 text-slate-700 text-xs">
              <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
              <span>Proximity: <strong>{match.distanceText}</strong></span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-700 text-xs">
              <Shield className="h-4 w-4 text-slate-400 shrink-0" />
              <span>Eligibility: <strong className="capitalize">{match.eligibilityStatus.toLowerCase()}</strong></span>
            </div>
            {match.acceptedAt && (
              <div className="flex items-center gap-2.5 text-emerald-700 text-xs font-semibold">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Accepted on: {new Date(match.acceptedAt).toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Reasons */}
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase mb-1.5">Match Verification Details</p>
            <ul className="text-xs text-slate-600 space-y-1.5">
              {match.reasons.map((r, i) => (
                <li key={i} className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Informational Medical Disclaimer */}
        <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-3 text-[10px] text-slate-500 leading-relaxed flex items-start gap-2">
          <Info className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
          <span>
            <strong>Medical Disclaimer:</strong> Compatibility shown is based on simplified RBC blood-group matching for this MVP. Final transfusion compatibility must always be verified by qualified medical professionals.
          </span>
        </div>

        {/* Safety & Trust Actions (Step 8) */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <button
            onClick={() => onReport?.(match.donorId, match.donorName)}
            className="hover:text-rose-600 flex items-center gap-1.5 transition-colors font-medium"
          >
            <Flag className="h-3.5 w-3.5" />
            Report Donor
          </button>
          <button
            onClick={() => onBlock?.(match.donorId, match.donorName)}
            className="hover:text-slate-700 flex items-center gap-1.5 transition-colors font-medium"
          >
            <Ban className="h-3.5 w-3.5" />
            Block Donor
          </button>
        </div>
      </div>
    </div>
  );
};


// ─────────────────────────────────────────────────────────
// JOURNEY TRACKER (Donor view — inline in RequestCard)
// ─────────────────────────────────────────────────────────
interface JourneyTrackerProps {
  matchStatus: import('../services/db').MatchStatus;
  journeyMatch?: {
    acceptedAt?: string;
    onTheWayAt?: string;
    arrivedAt?: string;
    completedAt?: string;
  };
  requestCreatedAt: string;
  onStartJourney?: () => void;
  onReached?: () => void;
  onCompleteDonation?: () => void;
  isDonorView?: boolean;
}

const JourneyTracker: React.FC<JourneyTrackerProps> = ({
  matchStatus,
  journeyMatch,
  requestCreatedAt,
  onStartJourney,
  onReached,
  onCompleteDonation,
  isDonorView = false,
}) => {
  const fmt = (iso?: string) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const steps = [
    {
      label: 'Request Created',
      done: true,
      ts: fmt(requestCreatedAt),
    },
    {
      label: 'Donor Accepted',
      done: !!journeyMatch?.acceptedAt || ['ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'COMPLETED'].includes(matchStatus),
      ts: fmt(journeyMatch?.acceptedAt),
    },
    {
      label: 'On The Way',
      done: !!journeyMatch?.onTheWayAt || ['ON_THE_WAY', 'ARRIVED', 'COMPLETED'].includes(matchStatus),
      ts: fmt(journeyMatch?.onTheWayAt),
    },
    {
      label: 'Reached Receiver',
      done: !!journeyMatch?.arrivedAt || ['ARRIVED', 'COMPLETED'].includes(matchStatus),
      ts: fmt(journeyMatch?.arrivedAt),
    },
    {
      label: 'Donation Completed',
      done: !!journeyMatch?.completedAt || matchStatus === 'COMPLETED',
      ts: fmt(journeyMatch?.completedAt),
    },
  ];

  const statusHeader = () => {
    if (matchStatus === 'COMPLETED') return { emoji: '✅', label: 'Donation Completed', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    if (matchStatus === 'ARRIVED') return { emoji: '📍', label: 'Donor Has Arrived', color: 'text-indigo-700 bg-indigo-50 border-indigo-200' };
    if (matchStatus === 'ON_THE_WAY') return { emoji: '🚗', label: 'Donor is On The Way', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    return { emoji: '🟢', label: 'Donor Accepted', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  };

  const header = statusHeader();

  return (
    <div className="mt-3 border border-slate-100 rounded-2xl bg-slate-50/50 p-3">
      {/* Status header */}
      <div className={`text-[11px] font-bold px-2.5 py-1.5 rounded-xl border mb-3 flex items-center gap-1.5 ${header.color}`}>
        <span>{header.emoji}</span>
        <span className="uppercase tracking-wide">{header.label}</span>
      </div>

      {/* Timeline steps */}
      <div className="space-y-0 mb-3">
        {steps.map((step, i) => (
          <div key={i} className="flex items-start gap-2 pb-2">
            <div className="flex flex-col items-center">
              <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                step.done
                  ? 'bg-emerald-500 border-emerald-500'
                  : 'bg-white border-slate-300'
              }`}>
                {step.done && <span className="text-white text-[8px] font-black">✓</span>}
              </div>
              {i < steps.length - 1 && (
                <div className={`w-0.5 h-4 mt-0.5 ${step.done ? 'bg-emerald-400' : 'bg-slate-200'}`} />
              )}
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <p className={`text-[11px] font-semibold leading-tight ${step.done ? 'text-slate-800' : 'text-slate-400'}`}>
                {step.label}
              </p>
              {step.ts && (
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">{step.ts}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Donor Action Buttons — only show when isDonorView */}
      {isDonorView && (
        <div className="space-y-1.5">
          {matchStatus === 'ACCEPTED' && onStartJourney && (
            <button
              onClick={onStartJourney}
              className="w-full text-xs font-bold py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white transition-colors flex items-center justify-center gap-1.5 shadow-xs"
            >
              🚗 Start Journey
            </button>
          )}
          {matchStatus === 'ON_THE_WAY' && onReached && (
            <button
              onClick={onReached}
              className="w-full text-xs font-bold py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center justify-center gap-1.5 shadow-xs"
            >
              📍 I've Reached
            </button>
          )}
          {matchStatus === 'ARRIVED' && onCompleteDonation && (
            <button
              onClick={onCompleteDonation}
              className="w-full text-xs font-bold py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center justify-center gap-1.5 shadow-xs"
            >
              ✓ Donation Completed
            </button>
          )}
          {matchStatus === 'COMPLETED' && (
            <div className="text-center py-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 rounded-xl border border-emerald-200">
              ✅ Thank you for saving a life!
            </div>
          )}
        </div>
      )}
    </div>
  );
};


// ─────────────────────────────────────────────────────────
// REQUEST CARD (Donor view)
// ─────────────────────────────────────────────────────────
interface RequestCardProps {
  item: RankedBloodRequest;
  onView: (item: RankedBloodRequest) => void;
  /** True when the donor already has a DIFFERENT active accepted request */
  donorHasActiveDonation?: boolean;
  onStartJourney?: (requestId: string) => void;
  onReached?: (requestId: string) => void;
  onCompleteDonation?: (requestId: string) => void;
}

const RequestCard: React.FC<RequestCardProps> = ({ item, onView, donorHasActiveDonation = false, onStartJourney, onReached, onCompleteDonation }) => {
  const { request, matchScore, distanceText, matchStatus, journeyMatch } = item;
  const urgency = URGENCY_BADGE[request.urgency] ?? URGENCY_BADGE.NORMAL;
  const isOnJourney = matchStatus === 'ACCEPTED' || matchStatus === 'CONFIRMED' || matchStatus === 'ON_THE_WAY' || matchStatus === 'ARRIVED' || matchStatus === 'COMPLETED';
  // Card is "locked" when the donor has another active accepted donation
  // and this card itself is NOT that accepted request
  const isLocked = donorHasActiveDonation && !isOnJourney;


  return (
    <div className={`border rounded-2xl p-4 sm:p-5 shadow-sm transition-all flex flex-col justify-between h-full ${
      isOnJourney
        ? 'bg-emerald-50/30 border-emerald-200 ring-1 ring-emerald-100'
        : isLocked
        ? 'bg-slate-50 border-slate-200 opacity-80'

        : 'bg-white border-slate-100 hover:shadow-md hover:border-rose-100'
    }`}>
      <div>
        <div className="flex items-start justify-between mb-3 gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${urgency.classes}`}>
              {urgency.label}
            </span>
            <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded">
              🎯 {matchScore}% Overall Match Score
            </span>
            {isOnJourney ? (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${
                matchStatus === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                matchStatus === 'ARRIVED' ? 'bg-indigo-100 text-indigo-800 border-indigo-300' :
                matchStatus === 'ON_THE_WAY' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                'bg-emerald-100 text-emerald-800 border-emerald-300'
              }`}>
                {matchStatus === 'COMPLETED' ? '✅ COMPLETED' :
                 matchStatus === 'ARRIVED' ? '📍 ARRIVED' :
                 matchStatus === 'ON_THE_WAY' ? '🚗 ON THE WAY' :
                 '✓ ACCEPTED'}
              </span>
            ) : isLocked ? (
              <span className="text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-300 px-2 py-0.5 rounded flex items-center gap-1">
                🔒 Locked
              </span>
            ) : (
              <span className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300 px-2 py-0.5 rounded">
                🟡 Request Available
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">
            {new Date(request.createdAt).toLocaleDateString()}
          </span>

        </div>

        <div className="flex items-center gap-3 mb-3 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Blood Group</p>
            <p className="text-2xl font-black text-rose-600 leading-none mt-0.5">{request.bloodGroup}</p>
          </div>
          <div className="border-l border-slate-200 pl-3.5">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Volume</p>
            <p className="text-lg font-extrabold text-slate-800">{request.units} <span className="text-xs text-slate-500 font-semibold">Units</span></p>
          </div>
          <div className="border-l border-slate-200 pl-3.5 ml-auto text-right">
            <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider">Proximity</p>
            <p className="text-xs font-extrabold text-indigo-600 mt-0.5">{distanceText}</p>
          </div>
        </div>

        <div className="space-y-1.5 text-xs font-medium text-slate-600 mb-3">
          <p className="flex items-center gap-1.5 truncate" title={request.hospital}>
            <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{request.hospital}</span>
          </p>
          <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            Required: {request.requiredDate} · {request.requiredTime}
          </p>
        </div>

        <div className="bg-emerald-50/60 rounded-xl p-2 mb-3 text-[11px] font-semibold text-emerald-800 flex items-center justify-between border border-emerald-100">
          <span className="text-slate-600 text-[10px] font-bold uppercase">Compatibility</span>
          <span className="text-emerald-700 font-bold">✓ Compatible RBC</span>
        </div>

        {/* Journey Tracker — shown when donor accepted/in-progress */}
        {isOnJourney && (
          <JourneyTracker
            matchStatus={matchStatus}
            journeyMatch={journeyMatch}
            requestCreatedAt={request.createdAt}
            isDonorView={true}
            onStartJourney={onStartJourney ? () => onStartJourney(request.id) : undefined}
            onReached={onReached ? () => onReached(request.id) : undefined}
            onCompleteDonation={onCompleteDonation ? () => onCompleteDonation(request.id) : undefined}
          />
        )}
      </div>

      {!isOnJourney && (
        isLocked ? (
          <button
            disabled
            className="w-full text-xs font-bold py-2.5 rounded-xl border mt-1 bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed flex items-center justify-center gap-1.5"
            title="Complete your current accepted donation before accepting another request."
          >
            🔒 Complete Current Donation First
          </button>
        ) : (
          <button
            onClick={() => onView(item)}
            className="w-full text-xs font-bold py-2.5 rounded-xl transition-all border mt-1 text-rose-600 hover:text-white hover:bg-rose-600 border-rose-200"
          >
            View Request Details
          </button>
        )
      )}
    </div>
  );
};



// ─────────────────────────────────────────────────────────
// DONOR MATCH CARD (Receiver view)
// ─────────────────────────────────────────────────────────
interface DonorMatchCardProps {
  match: MatchResult;
  index: number;
  onView: (match: MatchResult) => void;
}

const DonorMatchCard: React.FC<DonorMatchCardProps> = ({ match, index, onView }) => {
  const badgeRank = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🎖️';
  const isAccepted = match.matchStatus === 'ACCEPTED' || match.matchStatus === 'CONFIRMED';
  const isDeclined = match.matchStatus === 'DECLINED';

  return (
    <div className={`bg-white border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all ${
      isAccepted ? 'border-emerald-300 ring-2 ring-emerald-100 bg-emerald-50/20' : 'border-slate-100 hover:border-emerald-100'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border bg-emerald-50 text-emerald-800 border-emerald-200">
            {badgeRank} {match.matchScore}% Overall Match Score
          </span>
          {isAccepted && (
            <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border bg-emerald-600 text-white border-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              ACCEPTED
            </span>
          )}
        </div>
        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {match.distanceText}
        </span>
      </div>

      <div className="flex items-center gap-4 mb-3">
        <div>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Blood Group</p>
          <p className="text-3xl font-black text-rose-600 leading-none mt-0.5">{match.bloodGroup}</p>
        </div>
        <div className="border-l border-slate-100 pl-4">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Donor</p>
          <p className="text-sm font-extrabold text-slate-800 mt-1">{match.donorName}</p>
        </div>
        <div className="border-l border-slate-100 pl-4 ml-auto text-right">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Availability</p>
          <p className="text-xs font-bold text-emerald-600 mt-1">
            🟢 Available
          </p>
        </div>
      </div>

      {/* Blood Compatibility & Status Display */}
      <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 mb-3 text-xs space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-500">Blood Compatibility:</span>
          <span className="font-extrabold text-emerald-700">✓ Compatible</span>
        </div>
        <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
          <span className="font-semibold text-slate-500">Match Status:</span>
          <span className={`font-extrabold px-2 py-0.5 rounded text-[11px] ${
            isAccepted
              ? 'text-emerald-700 bg-emerald-100 border border-emerald-300'
              : isDeclined
              ? 'text-slate-600 bg-slate-200 border border-slate-300'
              : 'text-amber-700 bg-amber-100 border border-amber-200'
          }`}>
            {isAccepted ? '✓ ACCEPTED' : isDeclined ? 'DECLINED' : 'PENDING'}
          </span>
        </div>
      </div>

      <div className="space-y-1 text-xs text-slate-600 mb-4 px-1">
        {match.reasons.slice(0, 3).map((r, i) => (
          <p key={i} className="flex items-center gap-1.5 text-[11px]">
            <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
            <span>{r}</span>
          </p>
        ))}
      </div>

      <button
        onClick={() => onView(match)}
        className={`w-full text-xs font-bold py-2 rounded-xl transition-all border ${
          isAccepted
            ? 'bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-600'
            : 'text-emerald-700 hover:text-white hover:bg-emerald-600 border-emerald-200'
        }`}
      >
        {isAccepted ? '✓ View Accepted Donor Details' : 'View Match Details'}
      </button>
    </div>
  );
};


// ─────────────────────────────────────────────────────────
// DONOR PROFILE EDIT FORM (inline)
// ─────────────────────────────────────────────────────────
interface DonorEditFormProps {
  profile: DonorProfile;
  onSave: (updated: Partial<DonorProfile>) => void;
  onCancel: () => void;
}

const DonorEditForm: React.FC<DonorEditFormProps> = ({ profile, onSave, onCancel }) => {
  const [form, setForm] = useState({
    bloodGroup: profile.bloodGroup,
    location: profile.location,
    preferredRadius: String(profile.preferredRadius),
    lastDonationDate: profile.lastDonationDate || '',
    eligibilityConfirmed: profile.eligibilityStatus === 'ELIGIBLE',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      bloodGroup: form.bloodGroup,
      location: form.location,
      preferredRadius: Number(form.preferredRadius) || 10,
      lastDonationDate: form.lastDonationDate,
      eligibilityStatus: form.eligibilityConfirmed ? 'ELIGIBLE' : 'NOT_CONFIRMED',
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 border border-slate-100 rounded-2xl p-4 bg-slate-50 mt-3">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2">
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Edit Donor Profile</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Blood Group</label>
          <select
            required
            value={form.bloodGroup}
            onChange={e => setForm({ ...form, bloodGroup: e.target.value })}
            className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white"
          >
            <option value="">Select</option>
            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
              <option key={bg} value={bg}>{bg}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Location / City</label>
          <input
            type="text"
            required
            value={form.location}
            onChange={e => setForm({ ...form, location: e.target.value })}
            className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Preferred Radius (km)</label>
          <input
            type="number"
            min="1"
            max="200"
            required
            value={form.preferredRadius}
            onChange={e => setForm({ ...form, preferredRadius: e.target.value })}
            className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Last Donation Date</label>
          <input
            type="date"
            value={form.lastDonationDate}
            onChange={e => setForm({ ...form, lastDonationDate: e.target.value })}
            className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white"
          />
        </div>
      </div>

      {/* Step 8: Donor Eligibility Self-Declaration */}
      <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 space-y-2">
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={form.eligibilityConfirmed}
            onChange={e => setForm({ ...form, eligibilityConfirmed: e.target.checked })}
            className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-400 h-4 w-4"
          />
          <div>
            <p className="text-xs font-bold text-emerald-950">
              I confirm that I am currently willing and generally eligible to donate blood.
            </p>
            <p className="text-[10px] text-emerald-700 mt-0.5 leading-relaxed">
              Eligibility shown here is based on user-provided information. Final blood donation eligibility must be confirmed by a qualified medical professional or blood bank.
            </p>
          </div>
        </label>
      </div>

      <div className="flex gap-2 justify-end text-xs pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-slate-500 hover:bg-slate-100 rounded-lg"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="bg-rose-600 text-white font-bold px-4 py-1.5 rounded-xl shadow-sm hover:bg-rose-700"
        >
          Save Changes
        </button>
      </div>
    </form>
  );
};


// ─────────────────────────────────────────────────────────
// 1. UNIFIED USER DASHBOARD
// ─────────────────────────────────────────────────────────
export const UserDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<CurrentSession | null>(null);

  // Donor inline onboarding form
  const [showDonorForm, setShowDonorForm] = useState(false);
  const [showDonorEditForm, setShowDonorEditForm] = useState(false);
  const [donorForm, setDonorForm] = useState({
    bloodGroup: '',
    location: '',
    availabilityStatus: 'AVAILABLE' as DonorProfile['availabilityStatus'],
    preferredRadius: '10',
    lastDonationDate: '',
    eligibilityConfirmed: true,
  });

  // Report Modal state (Safety & Trust Step 8)
  const [reportModalData, setReportModalData] = useState<{
    isOpen: boolean;
    reportedUserId: string;
    reportedUserName?: string;
    requestId?: string;
  }>({
    isOpen: false,
    reportedUserId: '',
    reportedUserName: '',
    requestId: undefined,
  });


  // Receiver inline onboarding form
  const [showReceiverForm, setShowReceiverForm] = useState(false);
  const [receiverForm, setReceiverForm] = useState({
    location: '',
    emergencyContact: '',
  });

  // Blood request (receiver side)
  const [activeRequest, setActiveRequest] = useState<BloodRequest | null>(null);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestFormError, setRequestFormError] = useState('');
  const [requestForm, setRequestForm] = useState({
    bloodGroup: '',
    units: 1,
    hospital: '',
    location: '',
    requiredDate: '',
    requiredTime: '',
    urgency: 'NORMAL' as BloodRequest['urgency'],
    additionalNotes: '',
  });

  // Donor → ranked requests state
  const [matchedRequests, setMatchedRequests] = useState<RankedBloodRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestsError, setRequestsError] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<RankedBloodRequest | null>(null);

  // Receiver → matching donors state
  const [matchingDonors, setMatchingDonors] = useState<MatchResult[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [matchesError, setMatchesError] = useState('');
  const [selectedDonorMatch, setSelectedDonorMatch] = useState<MatchResult | null>(null);

  // ── Session loader ──────────────────────────────────────
  const loadSession = useCallback(() => {
    const active = authService.getCurrentSession();
    if (active) {
      setSession(active);
      const req = db.findActiveBloodRequestByReceiverId(active.user.id);
      setActiveRequest(req || null);
    }
  }, []);

  useEffect(() => { loadSession(); }, [loadSession]);

  // ── Load compatible blood requests for donor ──
  const loadMatchedRequests = useCallback((userId: string) => {
    setRequestsLoading(true);
    setRequestsError('');
    setTimeout(() => {
      try {
        const results = matchingService.getCompatibleRequestsForDonor(userId);
        setMatchedRequests(results);
      } catch (err) {
        console.error('[DonorRequests] Failed to load compatible requests:', err);
        setRequestsError('Unable to load blood requests. Please try again.');
      } finally {
        setRequestsLoading(false);
      }
    }, 300);
  }, []);

  // ── Load matching donors for receiver's active request ──
  const loadDonorMatches = useCallback((requestId: string, userId: string) => {
    setMatchesLoading(true);
    setMatchesError('');
    setTimeout(() => {
      try {
        const results = matchingService.getMatchesForRequest(requestId, userId);
        setMatchingDonors(results);
      } catch (err) {
        console.error('[ReceiverMatches] Failed to load matching donors:', err);
        setMatchesError('Unable to load matching donors. Please try again.');
      } finally {
        setMatchesLoading(false);
      }
    }, 300);
  }, []);

  // When donor profile is present, load requests
  useEffect(() => {
    if (session?.donorProfile) {
      loadMatchedRequests(session.user.id);
    }
  }, [session?.donorProfile, session?.user.id, loadMatchedRequests]);

  // When receiver active request is present, load matching donors
  useEffect(() => {
    if (session && activeRequest) {
      loadDonorMatches(activeRequest.id, session.user.id);
    } else {
      setMatchingDonors([]);
    }
  }, [session, activeRequest, loadDonorMatches]);

  // ── Real-time Cross-Tab & Storage Synchronization ───────
  useEffect(() => {
    const handleSync = () => {
      loadSession();
      const current = authService.getCurrentSession();
      if (current?.donorProfile) {
        loadMatchedRequests(current.user.id);
      }
      const activeReq = db.findActiveBloodRequestByReceiverId(current?.user.id || '');
      if (activeReq && current?.user.id) {
        loadDonorMatches(activeReq.id, current.user.id);
      } else {
        setMatchingDonors([]);
      }
    };

    window.addEventListener('storage', handleSync);
    window.addEventListener('raktsetu_storage_sync', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('raktsetu_storage_sync', handleSync);
    };
  }, [loadSession, loadMatchedRequests, loadDonorMatches]);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };


  // ── STEP 7: Donor Accept / Decline Handlers ──────────────
  const handleAcceptRequest = (requestId: string) => {
    if (!session) return;
    const res = matchActionService.acceptMatch(requestId, session.user.id);
    if (res.success) {
      // Reload immediately from database for donor and receiver
      loadMatchedRequests(session.user.id);
      if (activeRequest) loadDonorMatches(activeRequest.id, session.user.id);
      setSelectedRequest(null);
    } else {
      alert(res.message);
    }
  };

  const handleDeclineRequest = (requestId: string) => {
    if (!session) return;
    const res = matchActionService.declineMatch(requestId, session.user.id);
    if (res.success) {
      loadMatchedRequests(session.user.id);
      if (activeRequest) loadDonorMatches(activeRequest.id, session.user.id);
      setSelectedRequest(null);
    } else {
      alert(res.message);
    }
  };

  // ── STEP 7: Journey Action Handlers ──────────────────────
  const handleStartJourney = (requestId: string) => {
    if (!session) return;
    const res = matchActionService.startJourney(requestId, session.user.id);
    if (res.success) {
      loadMatchedRequests(session.user.id);
      if (activeRequest) loadDonorMatches(activeRequest.id, session.user.id);
    } else {
      alert(res.message);
    }
  };

  const handleDonorReached = (requestId: string) => {
    if (!session) return;
    const res = matchActionService.donorReached(requestId, session.user.id);
    if (res.success) {
      loadMatchedRequests(session.user.id);
      if (activeRequest) loadDonorMatches(activeRequest.id, session.user.id);
    } else {
      alert(res.message);
    }
  };

  const handleCompleteDonation = (requestId: string) => {
    if (!session) return;
    const res = matchActionService.completeDonation(requestId, session.user.id);
    if (res.success) {
      loadMatchedRequests(session.user.id);
      if (activeRequest) loadDonorMatches(activeRequest.id, session.user.id);
    } else {
      alert(res.message);
    }
  };

  // ── Safety & Trust (Step 8): Report & Block Handlers ─────
  const handleOpenReport = (reportedUserId: string, reportedUserName?: string, requestId?: string) => {
    setReportModalData({
      isOpen: true,
      reportedUserId,
      reportedUserName,
      requestId,
    });
  };

  const handleCloseReport = () => {
    setReportModalData({
      isOpen: false,
      reportedUserId: '',
      reportedUserName: '',
      requestId: undefined,
    });
  };

  const handleSubmitReport = (reason: string, description: string) => {
    if (!session) return;
    try {
      db.createReport({
        reporterId: session.user.id,
        reportedUserId: reportModalData.reportedUserId,
        requestId: reportModalData.requestId,
        reason,
        description,
      });
      alert('Thank you. Your report has been submitted confidentially to platform moderators.');
      handleCloseReport();
    } catch (err) {
      console.error('Failed to submit report:', err);
      alert('Failed to submit report. Please try again.');
    }
  };

  const handleBlockUser = (targetUserId: string, targetUserName?: string) => {
    if (!session) return;
    if (window.confirm(`Are you sure you want to block ${targetUserName || 'this user'}? They will no longer appear in your blood matches.`)) {
      db.blockUser(session.user.id, targetUserId);
      if (session.donorProfile) loadMatchedRequests(session.user.id);
      if (activeRequest) loadDonorMatches(activeRequest.id, session.user.id);
      setSelectedRequest(null);
      setSelectedDonorMatch(null);
      alert('User has been blocked successfully.');
    }
  };

  // ── Helper: geocode a location string → coords, best-effort ──────────────
  const geocodeAndGetCoords = async (
    locationText: string
  ): Promise<{ latitude?: number; longitude?: number }> => {
    if (!locationText.trim()) return {};
    try {
      const result = await geocodeLocation(locationText);
      if (result) return { latitude: result.lat, longitude: result.lng };
    } catch {
      /* geocoding failure is non-fatal — save proceeds without coords */
    }
    return {};
  };

  // ── Donor Profile Handlers ──────────────────────────────
  const handleEnableDonor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    // Geocode the donor's location before saving so the matching engine has real coords
    const coords = await geocodeAndGetCoords(donorForm.location);
    db.createDonorProfile({
      userId: session.user.id,
      bloodGroup: donorForm.bloodGroup,
      location: donorForm.location,
      ...coords,
      availabilityStatus: donorForm.availabilityStatus,
      preferredRadius: Number(donorForm.preferredRadius) || 10,
      lastDonationDate: donorForm.lastDonationDate,
      eligibilityStatus: donorForm.eligibilityConfirmed ? 'ELIGIBLE' : 'NOT_CONFIRMED',
    });
    setShowDonorForm(false);
    loadSession();
    if (session.donorProfile) loadMatchedRequests(session.user.id);
  };

  const handleDisableDonor = () => {
    if (!session) return;
    if (window.confirm('Are you sure you want to disable your Donor Capability? This will remove your listing.')) {
      db.deleteDonorProfile(session.user.id);
      setMatchedRequests([]);
      loadSession();
    }
  };

  const handleAvailabilityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!session?.donorProfile) return;
    const value = e.target.value as DonorProfile['availabilityStatus'];
    db.updateDonorAvailability(session.user.id, value);
    loadSession();
    loadMatchedRequests(session.user.id);
  };

  const handleSaveDonorProfile = async (updated: Partial<DonorProfile>) => {
    if (!session?.donorProfile) return;
    // If location changed, geocode the new location
    let coords: { latitude?: number; longitude?: number } = {};
    if (updated.location && updated.location !== session.donorProfile.location) {
      coords = await geocodeAndGetCoords(updated.location);
    }
    const current = db.findDonorProfileByUserId(session.user.id);
    if (current) {
      db.createDonorProfile({
        ...current,
        ...updated,
        ...coords,
      });
    }
    setShowDonorEditForm(false);
    loadSession();
    loadMatchedRequests(session.user.id);
  };

  // ── Receiver Profile Handlers ───────────────────────────
  const handleEnableReceiver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    // Geocode receiver location (for future use in receiver-side matching)
    await geocodeAndGetCoords(receiverForm.location); // warms cache
    db.createReceiverProfile({
      userId: session.user.id,
      location: receiverForm.location,
      emergencyContact: receiverForm.emergencyContact,
    });
    setShowReceiverForm(false);
    loadSession();
  };

  const handleDisableReceiver = () => {
    if (!session) return;
    if (window.confirm('Are you sure you want to disable your Receiver Capability? This will clear any active requests.')) {
      db.deleteReceiverProfile(session.user.id);
      setActiveRequest(null);
      setMatchingDonors([]);
      loadSession();
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setRequestFormError('');
    if (!session?.receiverProfile) return;
    const { bloodGroup, hospital, location, requiredDate, requiredTime } = requestForm;
    if (!bloodGroup || !hospital.trim() || !location.trim() || !requiredDate || !requiredTime) {
      setRequestFormError('Please fill in all required request fields.');
      return;
    }
    // Geocode the request location before saving so distance can be calculated
    const coords = await geocodeAndGetCoords(location);
    const newReq = db.createBloodRequest({
      receiverId: session.user.id,
      bloodGroup,
      units: Number(requestForm.units) || 1,
      hospital,
      location,
      ...coords,
      requiredDate,
      requiredTime,
      urgency: requestForm.urgency,
      additionalNotes: requestForm.additionalNotes,
    });
    setActiveRequest(newReq);
    setShowRequestForm(false);
    setRequestForm({ bloodGroup: '', units: 1, hospital: '', location: '', requiredDate: '', requiredTime: '', urgency: 'NORMAL', additionalNotes: '' });

    // Refresh matches for the new request
    loadDonorMatches(newReq.id, session.user.id);
    if (session.donorProfile) loadMatchedRequests(session.user.id);

    // Trigger in-app notifications for receiver & matching nearby donors (Step 5)
    notificationService.notifyRequestCreated(newReq);
  };

  const handleResolveRequest = () => {
    if (!activeRequest) return;
    if (window.confirm('Are you sure you want to mark this blood request as resolved?')) {
      const reqId = activeRequest.id;
      db.resolveBloodRequest(reqId);
      notificationService.notifyRequestResolved(reqId);
      setActiveRequest(null);
      setMatchingDonors([]);
      if (session?.donorProfile) loadMatchedRequests(session.user.id);
    }
  };

  const handleCancelRequest = () => {
    if (!activeRequest) return;
    if (window.confirm('Are you sure you want to cancel this blood request?')) {
      const reqId = activeRequest.id;
      db.cancelBloodRequest(reqId);
      notificationService.notifyRequestCancelled(reqId);
      setActiveRequest(null);
      setMatchingDonors([]);
      if (session?.donorProfile) loadMatchedRequests(session.user.id);
    }
  };




  if (!session) return null;

  const hasDonor = !!session.donorProfile;
  const hasReceiver = !!session.receiverProfile;

  // Check if any donor accepted receiver's active request (includes all journey stages)
  const acceptedDonorMatch = matchingDonors.find(
    m => m.matchStatus === 'ACCEPTED' || m.matchStatus === 'CONFIRMED'
      || m.matchStatus === 'ON_THE_WAY' || m.matchStatus === 'ARRIVED'
      || m.matchStatus === 'COMPLETED'
  );

  // ── ONE-DONOR-ONE-ACTIVE-ACCEPTED-REQUEST rule (frontend reflection) ──
  // Reads fresh from the database (same source the backend service uses)
  // so this stays accurate after refresh and after logout/login.
  const donorActiveAcceptedMatch = hasDonor
    ? db.findActiveAcceptedMatchByDonorId(session.user.id)
    : undefined;
  // True when the donor already holds an ACCEPTED request that is still ACTIVE
  const donorHasActiveDonation = !!donorActiveAcceptedMatch;

  return (
    <DashboardLayout session={session} title="Unified Dashboard" onLogout={handleLogout}>
      {/* ── TOP ROW: CAPABILITY CARDS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* ══ LEFT: DONOR CAPABILITY ══ */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Heart className={`h-5 w-5 ${hasDonor ? 'text-rose-600 fill-current animate-pulse' : 'text-slate-300'}`} />
                Donor Capability
              </h3>
              <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${
                hasDonor ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-slate-100 text-slate-400 border-slate-200'
              }`}>
                {hasDonor ? 'Enabled' : 'Disabled'}
              </span>
            </div>

            {/* Donor Enabled View */}
            {hasDonor && session.donorProfile ? (
              <div className="space-y-4">
                {/* Stat grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Blood Group</p>
                    <p className="text-3xl font-black text-rose-600 mt-0.5">{session.donorProfile.bloodGroup}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Eligibility</p>
                    <p className="text-sm font-bold text-slate-700 mt-0.5 capitalize">
                      {session.donorProfile.eligibilityStatus === 'PENDING' ? '🟡 Pending' :
                       session.donorProfile.eligibilityStatus === 'ELIGIBLE' ? '🟢 Eligible' : '⚫ Not Confirmed'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-600">
                  <p className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    {session.donorProfile.location}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5 text-slate-400" />
                    Radius: {session.donorProfile.preferredRadius} km
                  </p>
                </div>

                <div className="text-[10px] text-slate-400 leading-relaxed">
                  📅 Last Donation: <strong>{session.donorProfile.lastDonationDate || 'No record'}</strong>
                </div>

                {/* Step 8: Donor Eligibility Notice & Medical Disclaimer */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Self-Declared Eligibility</span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                      session.donorProfile.eligibilityStatus === 'ELIGIBLE'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}>
                      {session.donorProfile.eligibilityStatus === 'ELIGIBLE' ? '✓ Eligible' : '⚠️ Not Confirmed'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed border-t border-slate-200/60 pt-1.5">
                    Eligibility shown here is based on user-provided information. Final blood donation eligibility must be confirmed by a qualified medical professional or blood bank.
                  </p>
                </div>

                {/* Availability dropdown */}
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Availability Status</p>
                  <select
                    value={session.donorProfile.availabilityStatus || 'AVAILABLE'}
                    onChange={handleAvailabilityChange}
                    className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-400"
                  >
                    <option value="AVAILABLE">🟢 Available</option>
                    <option value="UNAVAILABLE">⚫ Unavailable</option>
                    <option value="TEMPORARILY_UNAVAILABLE">🔴 Temp Unavailable</option>
                  </select>
                </div>

                {/* Edit profile form toggle */}
                {showDonorEditForm ? (
                  <DonorEditForm
                    profile={session.donorProfile}
                    onSave={handleSaveDonorProfile}
                    onCancel={() => setShowDonorEditForm(false)}
                  />
                ) : (
                  <button
                    onClick={() => setShowDonorEditForm(true)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-xl border border-slate-100 transition-colors"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    Edit Donor Profile
                  </button>
                )}
              </div>
            ) : (
              /* Donor Disabled View */
              <div>
                <p className="text-sm text-slate-500 leading-relaxed mb-5">
                  You aren't registered as a blood donor yet. Enable donor capability to appear in emergency coordination matching.
                </p>
                {showDonorForm ? (
                  <form onSubmit={handleEnableDonor} className="space-y-4 border-t border-slate-100 pt-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 flex items-start gap-2">
                      <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-amber-800 font-semibold leading-relaxed">
                        Please ensure you are medically eligible to donate blood. <strong>Raktsetu does not provide medical clearance.</strong>
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Blood Group</label>
                        <select
                          required
                          value={donorForm.bloodGroup}
                          onChange={e => setDonorForm({ ...donorForm, bloodGroup: e.target.value })}
                          className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white"
                        >
                          <option value="">Select</option>
                          {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                            <option key={bg} value={bg}>{bg}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Location</label>
                        <input
                          type="text"
                          required
                          placeholder="City / Area"
                          value={donorForm.location}
                          onChange={e => setDonorForm({ ...donorForm, location: e.target.value })}
                          className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Radius (km)</label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={donorForm.preferredRadius}
                          onChange={e => setDonorForm({ ...donorForm, preferredRadius: e.target.value })}
                          className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Last Donation</label>
                        <input
                          type="date"
                          value={donorForm.lastDonationDate}
                          onChange={e => setDonorForm({ ...donorForm, lastDonationDate: e.target.value })}
                          className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Availability</label>
                      <select
                        value={donorForm.availabilityStatus}
                        onChange={e => setDonorForm({ ...donorForm, availabilityStatus: e.target.value as any })}
                        className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white"
                      >
                        <option value="AVAILABLE">🟢 Available</option>
                        <option value="UNAVAILABLE">⚫ Unavailable</option>
                        <option value="TEMPORARILY_UNAVAILABLE">🔴 Temp Unavailable</option>
                      </select>
                    </div>

                    {/* Step 8: Donor Eligibility Self-Declaration */}
                    <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 space-y-2">
                      <label className="flex items-start gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={donorForm.eligibilityConfirmed}
                          onChange={e => setDonorForm({ ...donorForm, eligibilityConfirmed: e.target.checked })}
                          className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-400 h-4 w-4"
                        />
                        <div>
                          <p className="text-xs font-bold text-emerald-950">
                            I confirm that I am currently willing and generally eligible to donate blood.
                          </p>
                          <p className="text-[10px] text-emerald-700 mt-0.5 leading-relaxed">
                            Eligibility shown here is based on user-provided information. Final blood donation eligibility must be confirmed by a qualified medical professional or blood bank.
                          </p>
                        </div>
                      </label>
                    </div>

                    <div className="flex gap-2 justify-end text-xs">
                      <button type="button" onClick={() => setShowDonorForm(false)} className="px-3 py-1.5 text-slate-500 hover:bg-slate-100 rounded-lg">
                        Cancel
                      </button>
                      <button type="submit" className="bg-rose-600 text-white font-bold px-4 py-1.5 rounded-xl shadow-sm hover:bg-rose-700">
                        Save Donor Details
                      </button>
                    </div>
                  </form>
                ) : null}
              </div>
            )}

            {/* Footer actions */}
            {hasDonor ? (
              <div className="border-t border-slate-100 pt-4 mt-5 flex justify-end">
                <button
                  onClick={handleDisableDonor}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-100 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Disable Donor Mode
                </button>
              </div>
            ) : !showDonorForm ? (
              <button
                onClick={() => setShowDonorForm(true)}
                className="w-full bg-rose-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-rose-700 shadow-sm text-sm flex items-center justify-center gap-1.5 mt-5"
              >
                <PlusCircle className="h-4 w-4" />
                Become a Blood Donor
              </button>
            ) : null}
          </div>
        </div>

        {/* ══ RIGHT: RECEIVER PANEL ══ */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Users2 className={`h-5 w-5 ${hasReceiver ? 'text-indigo-600' : 'text-slate-300'}`} />
                Receiver Capability
              </h3>
              <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${
                hasReceiver ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-slate-100 text-slate-400 border-slate-200'
              }`}>
                {hasReceiver ? 'Enabled' : 'Disabled'}
              </span>
            </div>

            {/* Receiver Enabled View */}
            {hasReceiver && session.receiverProfile ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-600">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Receiver Address</p>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      {session.receiverProfile.location}
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Emergency Line</p>
                    <span className="flex items-center gap-1 font-mono">
                      <Phone className="h-4 w-4 text-slate-400" />
                      {session.receiverProfile.emergencyContact}
                    </span>
                  </div>
                </div>

                {/* Compact Request Status / Action */}
                {activeRequest ? (
                  <div className="bg-rose-50 border border-rose-100 rounded-2xl p-3.5 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-rose-700 flex items-center gap-1.5 animate-pulse">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-600" />
                        Active Request in Progress
                      </span>
                      <p className="text-xs font-black text-slate-800 mt-1">
                        {activeRequest.bloodGroup} · {activeRequest.units} Unit{activeRequest.units > 1 ? 's' : ''} ({activeRequest.urgency})
                      </p>
                    </div>
                    <button
                      onClick={handleResolveRequest}
                      className="text-xs text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 px-3 py-1.5 rounded-xl transition-colors font-bold"
                    >
                      Resolve
                    </button>
                  </div>
                ) : !showRequestForm ? (
                  <button
                    onClick={() => { setRequestFormError(''); setShowRequestForm(true); }}
                    className="w-full text-xs text-white bg-indigo-600 hover:bg-indigo-700 font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5"
                  >
                    <PlusCircle className="h-4 w-4" />
                    Request Blood Now
                  </button>
                ) : null}

                {/* Request Form */}
                {showRequestForm && (
                  <form onSubmit={handleSubmitRequest} className="space-y-3.5 border-t border-slate-100 pt-3">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="text-xs font-bold text-slate-700">Submit Blood Request</span>
                      <span className="text-[10px] font-bold text-rose-600 uppercase">Emergency Form</span>
                    </div>
                    {requestFormError && (
                      <div className="text-[10px] text-rose-700 font-bold bg-rose-50 border border-rose-100 rounded-lg p-2 flex items-center gap-1">
                        <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                        {requestFormError}
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 uppercase">Blood Group</label>
                        <select required value={requestForm.bloodGroup} onChange={e => setRequestForm({ ...requestForm, bloodGroup: e.target.value })} className="mt-1 block w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white">
                          <option value="">Select Group</option>
                          {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 uppercase">Units Required</label>
                        <input type="number" min="1" max="20" required value={requestForm.units} onChange={e => setRequestForm({ ...requestForm, units: Number(e.target.value) || 1 })} className="mt-1 block w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 uppercase">Hospital Name</label>
                        <input type="text" required placeholder="City ICU General" value={requestForm.hospital} onChange={e => setRequestForm({ ...requestForm, hospital: e.target.value })} className="mt-1 block w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 uppercase">Hospital Location</label>
                        <input type="text" required placeholder="Address / Area" value={requestForm.location} onChange={e => setRequestForm({ ...requestForm, location: e.target.value })} className="mt-1 block w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 uppercase">Required Date</label>
                        <input type="date" required value={requestForm.requiredDate} onChange={e => setRequestForm({ ...requestForm, requiredDate: e.target.value })} className="mt-1 block w-full px-2 py-1 border border-slate-200 rounded-lg text-xs bg-white" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 uppercase">Required Time</label>
                        <input type="time" required value={requestForm.requiredTime} onChange={e => setRequestForm({ ...requestForm, requiredTime: e.target.value })} className="mt-1 block w-full px-2 py-1 border border-slate-200 rounded-lg text-xs bg-white" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase">Urgency</label>
                      <select value={requestForm.urgency} onChange={e => setRequestForm({ ...requestForm, urgency: e.target.value as any })} className="mt-1 block w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white">
                        <option value="NORMAL">Normal</option>
                        <option value="URGENT">Urgent</option>
                        <option value="CRITICAL">Critical</option>
                      </select>
                    </div>
                    {requestForm.urgency === 'CRITICAL' && (
                      <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5 text-[10px] text-rose-800 font-medium flex items-start gap-2">
                        <ShieldAlert className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                        <span>
                          <strong>Emergency situation?</strong> Please contact local emergency services or a qualified medical facility immediately. Raktsetu is not a replacement for emergency medical care.
                        </span>
                      </div>
                    )}
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase">Additional Notes</label>
                      <textarea rows={2} placeholder="E.g. Bypass surgery scheduled..." value={requestForm.additionalNotes} onChange={e => setRequestForm({ ...requestForm, additionalNotes: e.target.value })} className="mt-1 block w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none" />
                    </div>
                    <div className="flex gap-2 justify-end pt-1 text-xs">
                      <button type="button" onClick={() => setShowRequestForm(false)} className="px-3 py-1.5 text-slate-500 hover:bg-slate-100 rounded-lg">Cancel</button>
                      <button type="submit" className="bg-rose-600 text-white font-bold px-3 py-1.5 rounded-xl shadow-sm hover:bg-rose-700">Submit Blood Request</button>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              /* Receiver Disabled View */
              <div>
                <p className="text-sm text-slate-500 leading-relaxed mb-5">
                  Enable receiver capability to launch emergency blood matching alerts and connect with nearby donors.
                </p>
                {showReceiverForm ? (
                  <form onSubmit={handleEnableReceiver} className="space-y-4 border-t border-slate-100 pt-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Proximity Location</label>
                      <input type="text" required placeholder="Hospital Name / Address" value={receiverForm.location} onChange={e => setReceiverForm({ ...receiverForm, location: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Emergency Contact</label>
                      <input type="tel" required placeholder="Standby relative contact line" value={receiverForm.emergencyContact} onChange={e => setReceiverForm({ ...receiverForm, emergencyContact: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs" />
                    </div>
                    <div className="flex gap-2 justify-end text-xs">
                      <button type="button" onClick={() => setShowReceiverForm(false)} className="px-3 py-1.5 text-slate-500 hover:bg-slate-100 rounded-lg">Cancel</button>
                      <button type="submit" className="bg-indigo-600 text-white font-bold px-3 py-1.5 rounded-xl shadow-sm hover:bg-indigo-700">Enable Requesting</button>
                    </div>
                  </form>
                ) : null}
              </div>
            )}

            {/* Footer actions */}
            {hasReceiver ? (
              <div className="border-t border-slate-100 pt-4 mt-5 flex justify-end">
                <button onClick={handleDisableReceiver} className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-xl border border-indigo-100 transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                  Disable Receiver Mode
                </button>
              </div>
            ) : !showReceiverForm ? (
              <button
                onClick={() => setShowReceiverForm(true)}
                className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-indigo-700 shadow-sm text-sm flex items-center justify-center gap-1.5 mt-5"
              >
                <PlusCircle className="h-4 w-4" />
                Enable Request Capability
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* ══ FULL-WIDTH SECTION: ACTIVE BLOOD REQUEST & MATCHING DONORS ══ */}
      {hasReceiver && activeRequest && (
        <div className="mt-8 space-y-6">
          {/* Active Blood Request Card */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3.5 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold text-rose-700 bg-rose-50 border border-rose-100 px-3 py-1 rounded-xl flex items-center gap-1.5 animate-pulse">
                  <span className="h-2 w-2 rounded-full bg-rose-600" />
                  🆘 ACTIVE BLOOD REQUEST
                </span>
                <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                  acceptedDonorMatch
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-amber-50 text-amber-800 border-amber-300'
                }`}>
                  {acceptedDonorMatch ? '🟢 Match Accepted' : '🟡 Searching for Donor'}
                </span>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={handleCancelRequest}
                  className="text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl transition-colors font-semibold"
                >
                  Cancel Request
                </button>
                <button
                  onClick={handleResolveRequest}
                  className="text-xs text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 px-3.5 py-1.5 rounded-xl transition-colors font-bold shadow-xs"
                >
                  Resolve Request
                </button>
              </div>
            </div>

            {/* Critical Emergency Warning (Step 8) */}
            {activeRequest.urgency === 'CRITICAL' && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 mb-4 text-xs text-rose-800 font-medium flex items-start gap-2 shadow-xs">
                <ShieldAlert className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Emergency situation?</strong> Please contact local emergency services or a qualified medical facility immediately. Raktsetu is not a replacement for emergency medical care.
                </span>
              </div>
            )}

            {/* ══ STATUS BANNER: MATCH ACCEPTED / JOURNEY TRACKER ══ */}
            {acceptedDonorMatch ? (() => {
              const ms = acceptedDonorMatch.matchStatus;
              const bannerConfig = ms === 'COMPLETED'
                ? { bg: 'bg-emerald-50 border-emerald-200', icon: <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />, label: '✅ DONATION COMPLETED', badge: 'Completed', badgeBg: 'bg-emerald-700' }
                : ms === 'ARRIVED'
                ? { bg: 'bg-indigo-50 border-indigo-200', icon: <CheckCircle2 className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />, label: '📍 DONOR HAS ARRIVED', badge: 'Arrived', badgeBg: 'bg-indigo-600' }
                : ms === 'ON_THE_WAY'
                ? { bg: 'bg-amber-50 border-amber-200', icon: <RefreshCw className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />, label: '🚗 DONOR IS ON THE WAY', badge: 'On The Way', badgeBg: 'bg-amber-600' }
                : { bg: 'bg-emerald-50 border-emerald-200', icon: <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />, label: '🟢 MATCH ACCEPTED', badge: 'Donor Accepted', badgeBg: 'bg-emerald-600' };

              // Get journey data from the accepted match result (matchResult has matchId)
              const journeyMatchData = acceptedDonorMatch.matchId
                ? (() => { const m = db.findMatchById ? db.findMatchById(acceptedDonorMatch.matchId!) : null; return m ? { acceptedAt: m.acceptedAt, onTheWayAt: m.onTheWayAt, arrivedAt: m.arrivedAt, completedAt: m.completedAt } : undefined; })()
                : undefined;

              return (
                <div className={`border rounded-2xl p-4 mb-4 flex items-start gap-3 shadow-xs ${bannerConfig.bg}`}>
                  {bannerConfig.icon}
                  <div className="flex-1">
                    <h5 className="text-xs font-bold flex items-center gap-2 text-slate-800">
                      {bannerConfig.label}
                      <span className={`text-[9px] text-white px-2 py-0.5 rounded font-extrabold uppercase ${bannerConfig.badgeBg}`}>
                        {bannerConfig.badge}
                      </span>
                    </h5>
                    <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                      <strong>{acceptedDonorMatch.donorName}</strong> ({acceptedDonorMatch.bloodGroup}) has accepted your blood request ({activeRequest.units} unit).
                    </p>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[11px] font-semibold text-slate-700">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        Distance: {acceptedDonorMatch.distanceText}
                      </span>
                    </div>

                    {/* Journey Tracker — receiver side (no donor actions) */}
                    <JourneyTracker
                      matchStatus={acceptedDonorMatch.matchStatus}
                      journeyMatch={journeyMatchData}
                      requestCreatedAt={activeRequest.createdAt}
                      isDonorView={false}
                    />

                    {/* Receiver Action: Confirm Donation Completed when donor has arrived */}
                    {ms === 'ARRIVED' && (
                      <button
                        onClick={() => handleCompleteDonation(activeRequest.id)}
                        className="mt-2 w-full text-xs font-bold py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        ✓ Confirm Donation Completed
                      </button>
                    )}
                  </div>
                </div>
              );
            })() : (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4 flex items-start gap-3 shadow-xs">
                <RefreshCw className="h-5 w-5 text-amber-600 shrink-0 mt-0.5 animate-spin" />
                <div className="flex-1">
                  <h5 className="text-xs font-bold text-amber-900 flex items-center gap-2">
                    🟡 SEARCHING FOR COMPATIBLE DONOR
                    <span className="text-[9px] bg-amber-600 text-white px-2 py-0.5 rounded font-extrabold uppercase">
                      Broadcast Active
                    </span>
                  </h5>
                  <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                    Request is broadcast to {matchingDonors.length} eligible nearby candidate{matchingDonors.length === 1 ? '' : 's'}. Waiting for donor response.
                  </p>
                </div>
              </div>
            )}


            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div className="bg-slate-50 rounded-2xl p-4 text-center border border-slate-100">
                <p className="text-[10px] uppercase font-bold text-slate-400">Blood Group</p>
                <p className="text-3xl font-black text-rose-600 mt-1">{activeRequest.bloodGroup}</p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 text-center border border-slate-100">
                <p className="text-[10px] uppercase font-bold text-slate-400">Volume Required</p>
                <p className="text-2xl font-black text-slate-800 mt-1">{activeRequest.units} <span className="text-sm font-bold text-slate-500">Unit{activeRequest.units > 1 ? 's' : ''}</span></p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 text-center border border-slate-100">
                <p className="text-[10px] uppercase font-bold text-slate-400">Urgency Level</p>
                <p className="text-xl font-black text-slate-800 mt-1">{activeRequest.urgency}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-semibold text-slate-600 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100">
              <p className="flex items-center gap-2"><Building2 className="h-4 w-4 text-slate-400 shrink-0" /><span className="truncate">{activeRequest.hospital}</span></p>
              <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-slate-400 shrink-0" /><span className="truncate">{activeRequest.location}</span></p>
              <p className="flex items-center gap-2"><Calendar className="h-4 w-4 text-slate-400 shrink-0" /><span>{activeRequest.requiredDate} at {activeRequest.requiredTime}</span></p>
            </div>
            {activeRequest.additionalNotes && (
              <p className="text-xs text-slate-500 mt-3 pt-2 border-t border-slate-100 font-medium">
                📝 <strong>Notes:</strong> {activeRequest.additionalNotes}
              </p>
            )}
          </div>

          {/* Matching Donors Container */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2.5">
                  <div className="p-1.5 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-600">
                    <Award className="h-5 w-5" />
                  </div>
                  MATCHING DONORS
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  {matchingDonors.length} matching candidate{matchingDonors.length > 1 ? 's' : ''} found · Ranked by compatibility + proximity
                </p>
              </div>
              <button
                onClick={() => loadDonorMatches(activeRequest.id, session.user.id)}
                className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 px-3.5 py-2 rounded-xl border border-slate-200 transition-all self-start sm:self-auto shadow-xs"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${matchesLoading ? 'animate-spin' : ''}`} />
                Refresh Donors
              </button>
            </div>

            {matchesLoading ? (
              <div className="text-center py-16 text-slate-400 text-sm font-semibold">
                <RefreshCw className="h-7 w-7 animate-spin mx-auto mb-3 text-emerald-500" />
                Scanning database for compatible donors...
              </div>
            ) : matchesError ? (
              <div className="text-center py-12">
                <AlertTriangle className="h-9 w-9 text-amber-400 mx-auto mb-3" />
                <p className="text-sm text-slate-600 font-semibold">{matchesError}</p>
                <button
                  onClick={() => loadDonorMatches(activeRequest.id, session.user.id)}
                  className="mt-3 text-xs text-emerald-600 font-bold hover:underline"
                >
                  Try Again
                </button>
              </div>
            ) : matchingDonors.length === 0 ? (
              <div className="text-center py-14 bg-slate-50/60 rounded-2xl border border-slate-100 p-6">
                <Users2 className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="text-base font-bold text-slate-800">No suitable donors found yet.</p>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Raktsetu is actively monitoring. Matches require compatible RBC blood group, 'Available' status, and active donor registration within range.
                </p>
                <button
                  onClick={() => loadDonorMatches(activeRequest.id, session.user.id)}
                  className="mt-4 text-xs font-bold text-slate-600 hover:text-emerald-600 bg-white border border-slate-200 px-4 py-2 rounded-xl inline-flex items-center gap-2 shadow-xs transition-all"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Check Again
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {matchingDonors.map((match, idx) => (
                  <DonorMatchCard
                    key={match.donorId}
                    match={match}
                    index={idx}
                    onView={m => setSelectedDonorMatch(m)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ FULL-WIDTH SECTION: BLOOD REQUESTS NEAR YOU (when donor enabled) ══ */}
      {hasDonor && session.donorProfile && (
        <div className="mt-8 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2.5">
                <div className="p-1.5 bg-rose-50 rounded-xl border border-rose-100 text-rose-600">
                  <Droplets className="h-5 w-5" />
                </div>
                Blood Requests Near You
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                {matchedRequests.length} compatible blood request{matchedRequests.length > 1 ? 's' : ''} found · Ranked by intelligent matching + proximity
              </p>
            </div>
            <button
              onClick={() => loadMatchedRequests(session.user.id)}
              className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50 px-3.5 py-2 rounded-xl border border-slate-200 transition-all self-start sm:self-auto shadow-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${requestsLoading ? 'animate-spin' : ''}`} />
              Refresh Requests
            </button>
          </div>

          {session.donorProfile.availabilityStatus !== 'AVAILABLE' && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-xs text-amber-800 font-semibold mb-6 flex items-center gap-2.5">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
              You are currently marked as <strong>{STATUS_BADGE[session.donorProfile.availabilityStatus]?.label}</strong>. Set status to Available in your Donor card above to appear in active matching.
            </div>
          )}

          {/* ── Donor Eligibility Pending Notice ── */}
          {session.donorProfile.eligibilityStatus !== 'ELIGIBLE' && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 mb-6 text-xs text-amber-800 flex items-center justify-between gap-3">
              <div>
                <strong>⚠️ Self-Declared Eligibility Pending:</strong> Please confirm your donation eligibility in your Donor Card above to match with active blood requests.
              </div>
              <button
                onClick={() => setShowDonorEditForm(true)}
                className="font-bold underline text-amber-900 shrink-0 cursor-pointer"
              >
                Confirm Now
              </button>
            </div>
          )}

          {/* ── ONE-DONOR-ONE-ACTIVE-REQUEST banner ── */}
          {donorHasActiveDonation && donorActiveAcceptedMatch && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl px-4 py-3 mb-6 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-rose-900">
                  🩸 Active Donation In Progress
                </p>
                <p className="text-[11px] text-rose-700 mt-0.5 leading-relaxed">
                  You have already accepted a blood request. You can only have one active accepted donation at a time.
                  Other requests are locked until your current donation is resolved or completed.
                </p>
              </div>
            </div>
          )}

          {requestsLoading ? (
            <div className="text-center py-16 text-slate-400 text-sm font-semibold">
              <RefreshCw className="h-7 w-7 animate-spin mx-auto mb-3 text-rose-500" />
              Finding active blood requests near you...
            </div>
          ) : requestsError ? (
            <div className="text-center py-12">
              <AlertTriangle className="h-9 w-9 text-amber-400 mx-auto mb-3" />
              <p className="text-sm text-slate-600 font-semibold">{requestsError}</p>
              <button
                onClick={() => loadMatchedRequests(session.user.id)}
                className="mt-3 text-xs text-rose-600 font-bold hover:underline"
              >
                Try Again
              </button>
            </div>
          ) : matchedRequests.length === 0 ? (
            <div className="text-center py-14 bg-slate-50/60 rounded-2xl border border-slate-100 p-6">
              <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
              <p className="text-base font-bold text-slate-800">You're all caught up!</p>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                No active blood requests currently match your blood group ({session.donorProfile.bloodGroup}) and preferred radius.
              </p>
              <button
                onClick={() => loadMatchedRequests(session.user.id)}
                className="mt-4 text-xs font-bold text-slate-600 hover:text-rose-600 bg-white border border-slate-200 px-4 py-2 rounded-xl inline-flex items-center gap-2 shadow-xs transition-all"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Check Again
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {matchedRequests.map(item => (
                <RequestCard
                  key={item.request.id}
                  item={item}
                  onView={r => setSelectedRequest(r)}
                  donorHasActiveDonation={donorHasActiveDonation}
                  onStartJourney={handleStartJourney}
                  onReached={handleDonorReached}
                  onCompleteDonation={handleCompleteDonation}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Request Detail Modal (Donor view) ── */}
      {selectedRequest && (
        <RequestDetailModal
          rankedItem={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onAccept={handleAcceptRequest}
          onDecline={handleDeclineRequest}
          onReport={(id, name, reqId) => handleOpenReport(id, name, reqId)}
          onBlock={(id, name) => handleBlockUser(id, name)}
        />
      )}

      {/* ── Donor Match Modal (Receiver view) ── */}
      {selectedDonorMatch && (
        <DonorMatchModal
          match={selectedDonorMatch}
          onClose={() => setSelectedDonorMatch(null)}
          onReport={(id, name) => handleOpenReport(id, name)}
          onBlock={(id, name) => handleBlockUser(id, name)}
        />
      )}

      {/* ── Report Modal (Safety & Trust Step 8) ── */}
      {reportModalData.isOpen && (
        <ReportModal
          reportedUserId={reportModalData.reportedUserId}
          reportedUserName={reportModalData.reportedUserName}
          requestId={reportModalData.requestId}
          onClose={handleCloseReport}
          onSubmitReport={handleSubmitReport}
        />
      )}
    </DashboardLayout>
  );
};


// ─────────────────────────────────────────────────────────
// 2. LEGACY REDIRECT WRAPPERS
// ─────────────────────────────────────────────────────────
export const DonorDashboard: React.FC = () => {
  const navigate = useNavigate();
  useEffect(() => { navigate('/dashboard', { replace: true }); }, [navigate]);
  return null;
};

export const ReceiverDashboard: React.FC = () => {
  const navigate = useNavigate();
  useEffect(() => { navigate('/dashboard', { replace: true }); }, [navigate]);
  return null;
};


// ─────────────────────────────────────────────────────────
// 3. HOSPITAL DASHBOARD
// ─────────────────────────────────────────────────────────
export const HospitalDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<CurrentSession | null>(null);

  useEffect(() => {
    const active = authService.getCurrentSession();
    if (active) setSession(active);
  }, []);

  const handleLogout = () => { authService.logout(); navigate('/login'); };
  if (!session?.hospitalProfile) return null;

  const isVerified = session.hospitalProfile.verificationStatus === 'VERIFIED';

  return (
    <DashboardLayout session={session} title="Hospital Dashboard" onLogout={handleLogout}>
      <div className={`p-4 rounded-2xl border mb-8 flex items-start gap-3.5 ${isVerified ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-amber-50 border-amber-100 text-amber-800'}`}>
        {isVerified ? <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" /> : <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />}
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider">Verification Status: {session.hospitalProfile.verificationStatus}</h4>
          <p className="text-xs mt-1 opacity-90 leading-relaxed font-semibold">
            {isVerified ? 'Authorized. Your facility can now manage donor pools.' : 'Our administration team is auditing your details. Verification takes up to 24 hours.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm md:col-span-2 space-y-4">
          <h3 className="text-base font-bold text-slate-800 pb-3 border-b border-slate-100 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-slate-400" />
            Hospital Facility Metadata
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
            <div><p className="text-slate-400 font-semibold text-xs uppercase">Facility Name</p><p className="font-bold text-slate-800 mt-1">{session.hospitalProfile.hospitalName}</p></div>
            <div><p className="text-slate-400 font-semibold text-xs uppercase">Reg. Number</p><p className="font-bold text-slate-800 mt-1 font-mono text-xs">{session.hospitalProfile.registrationNumber}</p></div>
            <div><p className="text-slate-400 font-semibold text-xs uppercase">Direct Line</p><p className="font-bold text-slate-800 mt-1">{session.hospitalProfile.contactNumber}</p></div>
            <div><p className="text-slate-400 font-semibold text-xs uppercase">Full Address</p><p className="font-bold text-slate-800 mt-1">{session.hospitalProfile.hospitalAddress}</p></div>
          </div>
        </div>
        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-md flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-100 mb-2 flex items-center gap-2">
              <Activity className="h-5 w-5 text-rose-500" />Blood Bank Audits
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">Track emergency inventory. Disabled in current MVP stage.</p>
          </div>
          <button disabled className="w-full bg-slate-800 text-slate-400 font-semibold py-3 px-4 rounded-xl border border-slate-700 text-sm opacity-60">Management Disabled</button>
        </div>
      </div>
    </DashboardLayout>
  );
};


// ─────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────
// 4. ADMIN DASHBOARD (Step 9: Admin Dashboard & Platform Analytics)
// ─────────────────────────────────────────────────────────
export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<CurrentSession | null>(null);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'requests' | 'matches' | 'reports' | 'analytics'>('overview');

  // Real Database entities
  const [users, setUsers] = useState<User[]>([]);
  const [donors, setDonors] = useState<DonorProfile[]>([]);
  const [receivers, setReceivers] = useState<ReceiverProfile[]>([]);
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [reports, setReports] = useState<UserReport[]>([]);
  const [blocks, setBlocks] = useState<UserBlock[]>([]);

  // Search & Filter controls
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState<'ALL' | 'DONORS' | 'RECEIVERS' | 'TWOWAY' | 'BLOCKED'>('ALL');
  const [requestFilter, setRequestFilter] = useState<'ALL' | 'ACTIVE' | 'RESOLVED' | 'CANCELLED' | 'CRITICAL'>('ALL');
  const [reportFilter, setReportFilter] = useState<'ALL' | 'OPEN' | 'REVIEWED' | 'RESOLVED'>('ALL');

  // Load all real database records
  const loadAdminData = useCallback(() => {
    const active = authService.getCurrentSession();
    if (active) {
      // Security: Check role authorization
      if (active.user.role !== 'ADMIN') {
        navigate('/unauthorized', { replace: true });
        return;
      }
      setSession(active);
    } else {
      navigate('/login', { replace: true });
      return;
    }

    setUsers(db.getAllUsers());
    setDonors(db.getAllDonors());
    setReceivers(db.getAllReceivers());
    setRequests(db.getAllBloodRequests());
    setMatches(db.getAllMatches());
    setReports(db.getAllReports());
    setBlocks(db.getAllBlocks());
  }, [navigate]);

  useEffect(() => {
    loadAdminData();
    const handleSync = () => loadAdminData();
    window.addEventListener('raktsetu_storage_sync', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('raktsetu_storage_sync', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [loadAdminData]);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const handleVerifyHospital = (userId: string) => {
    db.updateHospitalVerification(userId, 'VERIFIED');
    loadAdminData();
  };

  const handleAdminBlockUser = (userId: string, name?: string) => {
    if (!session) return;
    if (window.confirm(`Are you sure you want to block ${name || 'this user'}?`)) {
      db.blockUser(session.user.id, userId);
      loadAdminData();
    }
  };

  const handleAdminUnblockUser = (userId: string) => {
    if (!session) return;
    db.unblockUser(session.user.id, userId);
    loadAdminData();
  };

  const handleUpdateReportStatus = (reportId: string, status: 'REVIEWED' | 'RESOLVED') => {
    db.updateReportStatus(reportId, status);
    loadAdminData();
  };

  if (!session || session.user.role !== 'ADMIN') return null;

  // ══════════════════════════════════════════════════════════
  // REAL DATABASE AGGREGATIONS & METRICS (NO FAKE / MOCK DATA)
  // ══════════════════════════════════════════════════════════
  const totalUsersCount = users.length;
  const totalDonorsCount = donors.length;
  const availableDonorsCount = donors.filter(d => d.availabilityStatus === 'AVAILABLE').length;
  const unavailableDonorsCount = donors.filter(d => d.availabilityStatus !== 'AVAILABLE').length;
  const totalReceiversCount = receivers.length;

  // Two-Way Users: Users who hold BOTH a donor profile and a receiver profile
  const twoWayUsersCount = users.filter(
    u => donors.some(d => d.userId === u.id) && receivers.some(r => r.userId === u.id)
  ).length;

  const totalRequestsCount = requests.length;
  const activeRequestsCount = requests.filter(r => r.status === 'ACTIVE').length;
  const resolvedRequestsCount = requests.filter(r => r.status === 'RESOLVED').length;
  const cancelledRequestsCount = requests.filter(r => r.status === 'CANCELLED').length;
  const criticalRequestsCount = requests.filter(r => r.urgency === 'CRITICAL').length;
  const urgentRequestsCount = requests.filter(r => r.urgency === 'URGENT').length;
  const normalRequestsCount = requests.filter(r => r.urgency === 'NORMAL').length;

  const totalMatchesCount = matches.length;
  const acceptedMatchesCount = matches.filter(m =>
    ['ACCEPTED', 'CONFIRMED', 'ON_THE_WAY', 'ARRIVED', 'COMPLETED'].includes(m.status)
  ).length;
  const completedMatchesCount = matches.filter(m => m.status === 'COMPLETED').length;
  const declinedMatchesCount = matches.filter(m => m.status === 'DECLINED').length;
  const pendingMatchesCount = matches.filter(m => m.status === 'PENDING').length;

  // Match Success Rate = (completed matches / accepted matches) * 100
  const matchSuccessRate = acceptedMatchesCount > 0
    ? ((completedMatchesCount / acceptedMatchesCount) * 100).toFixed(1)
    : '0.0';

  const openReportsCount = reports.filter(r => r.status === 'OPEN').length;
  const reviewedReportsCount = reports.filter(r => r.status === 'REVIEWED').length;
  const resolvedReportsCount = reports.filter(r => r.status === 'RESOLVED').length;

  // Blood group distribution calculations
  const bloodGroupsList = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const bloodGroupStats = bloodGroupsList.map(bg => {
    const reqCount = requests.filter(r => r.bloodGroup === bg).length;
    const donorCount = donors.filter(d => d.bloodGroup === bg).length;
    const reqPct = requests.length > 0 ? Math.round((reqCount / requests.length) * 100) : 0;
    return { bg, reqCount, donorCount, reqPct };
  });

  // Top request locations
  const locationFrequency: Record<string, number> = {};
  requests.forEach(r => {
    const loc = r.location?.trim();
    if (loc) {
      locationFrequency[loc] = (locationFrequency[loc] || 0) + 1;
    }
  });
  const topLocations = Object.entries(locationFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Recent Activity Feed aggregated from real DB events
  interface ActivityItem {
    id: string;
    type: 'REQUEST' | 'MATCH' | 'REPORT' | 'USER';
    title: string;
    description: string;
    time: string;
    tag: string;
    tagColor: string;
  }

  const activityFeed: ActivityItem[] = [
    ...requests.map(r => ({
      id: `req-${r.id}`,
      type: 'REQUEST' as const,
      title: `Blood Request Created: ${r.bloodGroup} (${r.units} unit)`,
      description: `Hospital: ${r.hospital} · ${r.location}`,
      time: r.createdAt,
      tag: r.urgency,
      tagColor: r.urgency === 'CRITICAL' ? 'bg-rose-100 text-rose-800 border-rose-200' : r.urgency === 'URGENT' ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-emerald-100 text-emerald-800 border-emerald-200'
    })),
    ...matches.filter(m => m.status === 'COMPLETED' || m.status === 'ACCEPTED' || m.status === 'ON_THE_WAY' || m.status === 'ARRIVED').map(m => ({
      id: `match-${m.id}`,
      type: 'MATCH' as const,
      title: m.status === 'COMPLETED' ? 'Donation Completed' : m.status === 'ARRIVED' ? 'Donor Arrived at Destination' : m.status === 'ON_THE_WAY' ? 'Donor on the Way' : 'Donor Accepted Blood Request',
      description: `Match status updated to ${m.status}`,
      time: m.completedAt || m.arrivedAt || m.onTheWayAt || m.acceptedAt || m.updatedAt || m.createdAt,
      tag: m.status,
      tagColor: m.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-indigo-100 text-indigo-800 border-indigo-200'
    })),
    ...reports.map(rep => ({
      id: `rep-${rep.id}`,
      type: 'REPORT' as const,
      title: `Safety Report Filed`,
      description: `Reason: ${rep.reason} · Status: ${rep.status}`,
      time: rep.createdAt,
      tag: rep.status,
      tagColor: rep.status === 'OPEN' ? 'bg-rose-100 text-rose-800 border-rose-200' : 'bg-slate-100 text-slate-700 border-slate-200'
    })),
    ...users.map(u => ({
      id: `user-${u.id}`,
      type: 'USER' as const,
      title: `New Account Registered`,
      description: `${u.name} joined Raktsetu`,
      time: u.createdAt,
      tag: u.role,
      tagColor: 'bg-slate-100 text-slate-700 border-slate-200'
    }))
  ]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 10);

  // Filtered Users List
  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.phone.includes(userSearch);
    if (!matchesSearch) return false;

    const isDonor = donors.some(d => d.userId === u.id);
    const isReceiver = receivers.some(r => r.userId === u.id);
    const isBlocked = blocks.some(b => b.blockedUserId === u.id || b.blockerId === u.id);

    if (userFilter === 'DONORS') return isDonor;
    if (userFilter === 'RECEIVERS') return isReceiver;
    if (userFilter === 'TWOWAY') return isDonor && isReceiver;
    if (userFilter === 'BLOCKED') return isBlocked;
    return true;
  });

  // Filtered Requests List
  const filteredRequests = requests.filter(r => {
    if (requestFilter === 'ACTIVE') return r.status === 'ACTIVE';
    if (requestFilter === 'RESOLVED') return r.status === 'RESOLVED';
    if (requestFilter === 'CANCELLED') return r.status === 'CANCELLED';
    if (requestFilter === 'CRITICAL') return r.urgency === 'CRITICAL';
    return true;
  });

  // Filtered Reports List
  const filteredReports = reports.filter(rep => {
    if (reportFilter === 'OPEN') return rep.status === 'OPEN';
    if (reportFilter === 'REVIEWED') return rep.status === 'REVIEWED';
    if (reportFilter === 'RESOLVED') return rep.status === 'RESOLVED';
    return true;
  });

  return (
    <DashboardLayout session={session} title="Admin Portal" onLogout={handleLogout}>
      {/* ── ADMIN HEADER & NAVIGATION ── */}
      <div className="mb-6 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900">Raktsetu Admin Portal</h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Platform Operations, Emergency Coordination & Real-Time Analytics
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Live DB Sync Active
            </span>
            <button
              onClick={loadAdminData}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-rose-600 bg-white border border-slate-200 px-3.5 py-1.5 rounded-xl shadow-xs transition-all"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 pt-4">
          {[
            { id: 'overview', label: '📊 Overview', icon: Layers },
            { id: 'users', label: `👥 Users (${totalUsersCount})`, icon: Users2 },
            { id: 'requests', label: `🩸 Blood Requests (${totalRequestsCount})`, icon: Droplets },
            { id: 'matches', label: `🤝 Matches (${totalMatchesCount})`, icon: Activity },
            { id: 'reports', label: `🚩 Reports (${openReportsCount} open)`, icon: Flag },
            { id: 'analytics', label: '📈 Analytics & Demand', icon: BarChart3 },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          TAB 1: OVERVIEW
         ══════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top 4 Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider">Total Users</span>
                <Users2 className="h-4 w-4 text-slate-400" />
              </div>
              <p className="text-3xl font-black text-slate-900">{totalUsersCount}</p>
              <div className="flex items-center gap-2 mt-2 text-[11px] font-semibold text-slate-500">
                <span>{twoWayUsersCount} Two-Way</span> · <span>{totalDonorsCount} Donors</span> · <span>{totalReceiversCount} Receivers</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider">Active Donors</span>
                <Heart className="h-4 w-4 text-rose-500" />
              </div>
              <p className="text-3xl font-black text-rose-600">{availableDonorsCount}</p>
              <div className="flex items-center gap-2 mt-2 text-[11px] font-semibold text-slate-500">
                <span>{unavailableDonorsCount} currently unavailable</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider">Active Requests</span>
                <Droplets className="h-4 w-4 text-indigo-500" />
              </div>
              <p className="text-3xl font-black text-indigo-600">{activeRequestsCount}</p>
              <div className="flex items-center gap-2 mt-2 text-[11px] font-semibold text-slate-500">
                <span className="text-rose-600 font-bold">{criticalRequestsCount} Critical</span> · <span>{urgentRequestsCount} Urgent</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider">Completed Donations</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-3xl font-black text-emerald-600">{completedMatchesCount}</p>
              <div className="flex items-center gap-2 mt-2 text-[11px] font-semibold text-slate-500">
                <span>Success Rate: <strong className="text-emerald-700">{matchSuccessRate}%</strong></span>
              </div>
            </div>
          </div>

          {/* Secondary Metric Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-rose-50/70 border border-rose-100 rounded-2xl p-4 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-rose-700">🔴 Critical Requests</p>
              <p className="text-2xl font-black text-rose-800 mt-1">{criticalRequestsCount}</p>
            </div>
            <div className="bg-amber-50/70 border border-amber-100 rounded-2xl p-4 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">🟡 Urgent Requests</p>
              <p className="text-2xl font-black text-amber-800 mt-1">{urgentRequestsCount}</p>
            </div>
            <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-4 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">🟢 Accepted Matches</p>
              <p className="text-2xl font-black text-emerald-800 mt-1">{acceptedMatchesCount}</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">⚠️ Open Reports</p>
              <p className="text-2xl font-black text-slate-800 mt-1">{openReportsCount}</p>
            </div>
          </div>

          {/* Main Grid: Active Requests Table + Activity Feed */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Active Requests Table (8 Cols) */}
            <div className="lg:col-span-8 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-rose-600" />
                  Active Blood Requests
                </h3>
                <button
                  onClick={() => setActiveTab('requests')}
                  className="text-xs font-bold text-rose-600 hover:underline"
                >
                  View All ({totalRequestsCount})
                </button>
              </div>

              {requests.filter(r => r.status === 'ACTIVE').length === 0 ? (
                <div className="text-center py-12 bg-slate-50/60 rounded-2xl border border-slate-100">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">No active blood requests.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">All requests are currently resolved or cancelled.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                        <th className="px-4 py-2.5">Blood Group</th>
                        <th className="px-4 py-2.5">Units</th>
                        <th className="px-4 py-2.5">Urgency</th>
                        <th className="px-4 py-2.5">Hospital & Location</th>
                        <th className="px-4 py-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {requests.filter(r => r.status === 'ACTIVE').slice(0, 5).map(req => (
                        <tr key={req.id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 font-extrabold text-rose-600 text-sm">{req.bloodGroup}</td>
                          <td className="px-4 py-3 font-bold text-slate-800">{req.units}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${
                              req.urgency === 'CRITICAL' ? 'bg-rose-100 text-rose-800 border-rose-200' :
                              req.urgency === 'URGENT' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                              'bg-emerald-100 text-emerald-800 border-emerald-200'
                            }`}>
                              {req.urgency}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-slate-800 truncate max-w-[200px]">{req.hospital}</p>
                            <p className="text-[10px] text-slate-400 truncate max-w-[200px]">{req.location}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase">
                              Active
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Recent Activity Feed (4 Cols) */}
            <div className="lg:col-span-4 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <Activity className="h-4 w-4 text-slate-400" />
                  Recent Platform Activity
                </h3>
              </div>

              {activityFeed.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">No recent activity.</p>
              ) : (
                <div className="space-y-3.5">
                  {activityFeed.map(act => (
                    <div key={act.id} className="text-xs pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-bold text-slate-800 leading-tight">{act.title}</p>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase shrink-0 ${act.tagColor}`}>
                          {act.tag}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{act.description}</p>
                      <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(act.time).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB 2: USERS DIRECTORY & MANAGEMENT
         ══════════════════════════════════════════════════════ */}
      {activeTab === 'users' && (
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Users2 className="h-5 w-5 text-indigo-600" />
                User Directory & Capability Management
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {users.length} registered accounts · {twoWayUsersCount} two-way capability users
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search user..."
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>
              <select
                value={userFilter}
                onChange={e => setUserFilter(e.target.value as any)}
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-rose-400"
              >
                <option value="ALL">All Users</option>
                <option value="DONORS">Donors</option>
                <option value="RECEIVERS">Receivers</option>
                <option value="TWOWAY">Two-Way Users</option>
                <option value="BLOCKED">Blocked</option>
              </select>
            </div>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="text-center py-14 bg-slate-50/60 rounded-2xl border border-slate-100">
              <Users2 className="h-9 w-9 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No users found.</p>
              <p className="text-xs text-slate-400 mt-0.5">Try adjusting your search or filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Capabilities</th>
                    <th className="px-4 py-3">Blood Group</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">Availability</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredUsers.map(user => {
                    const isHosp = user.role === 'HOSPITAL';
                    const donorProfile = donors.find(d => d.userId === user.id);
                    const receiverProfile = receivers.find(r => r.userId === user.id);
                    const isTwoWay = !!donorProfile && !!receiverProfile;
                    const hospProfile = isHosp ? db.findHospitalProfileByUserId(user.id) : null;
                    const isUserBlocked = blocks.some(b => b.blockedUserId === user.id);

                    return (
                      <tr key={user.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3.5">
                          <p className="font-bold text-slate-900">{user.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{user.id.substring(0, 8)}...</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <p>{user.email}</p>
                          <p className="font-mono text-[10px] text-slate-400">{user.phone}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex flex-wrap gap-1">
                            {user.role === 'ADMIN' && (
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold border bg-slate-100 text-slate-700 border-slate-200 uppercase">
                                Admin
                              </span>
                            )}
                            {isTwoWay ? (
                              <span className="px-2 py-0.5 rounded text-[9px] font-extrabold border bg-indigo-50 text-indigo-700 border-indigo-200 uppercase">
                                🔄 Two-Way (Donor + Receiver)
                              </span>
                            ) : (
                              <>
                                {donorProfile && (
                                  <span className="px-2 py-0.5 rounded text-[9px] font-bold border bg-rose-50 text-rose-700 border-rose-200 uppercase">
                                    🩸 Donor
                                  </span>
                                )}
                                {receiverProfile && (
                                  <span className="px-2 py-0.5 rounded text-[9px] font-bold border bg-indigo-50 text-indigo-700 border-indigo-200 uppercase">
                                    🆘 Receiver
                                  </span>
                                )}
                              </>
                            )}
                            {isHosp && (
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-200 uppercase">
                                Hospital
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          {donorProfile ? (
                            <span className="font-black text-rose-600 text-sm">{donorProfile.bloodGroup}</span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-slate-600">
                          {donorProfile?.location || receiverProfile?.location || '—'}
                        </td>
                        <td className="px-4 py-3.5">
                          {donorProfile ? (
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase ${
                              donorProfile.availabilityStatus === 'AVAILABLE'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}>
                              {donorProfile.availabilityStatus}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-slate-400 text-[11px]">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isHosp && hospProfile?.verificationStatus === 'PENDING' && (
                              <button
                                onClick={() => handleVerifyHospital(user.id)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 rounded-lg text-[10px]"
                              >
                                Approve
                              </button>
                            )}
                            {isUserBlocked ? (
                              <button
                                onClick={() => handleAdminUnblockUser(user.id)}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-2.5 py-1 rounded-lg text-[10px]"
                              >
                                Unblock
                              </button>
                            ) : user.role !== 'ADMIN' ? (
                              <button
                                onClick={() => handleAdminBlockUser(user.id, user.name)}
                                className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold px-2.5 py-1 rounded-lg text-[10px] border border-rose-200"
                              >
                                Block
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB 3: BLOOD REQUESTS DIRECTORY
         ══════════════════════════════════════════════════════ */}
      {activeTab === 'requests' && (
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Droplets className="h-5 w-5 text-rose-600" />
                All Blood Requests Directory
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {requests.length} total requests · {activeRequestsCount} active · {resolvedRequestsCount} resolved
              </p>
            </div>

            <select
              value={requestFilter}
              onChange={e => setRequestFilter(e.target.value as any)}
              className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-rose-400"
            >
              <option value="ALL">All Requests ({requests.length})</option>
              <option value="ACTIVE">Active Only ({activeRequestsCount})</option>
              <option value="RESOLVED">Resolved Only ({resolvedRequestsCount})</option>
              <option value="CANCELLED">Cancelled Only ({cancelledRequestsCount})</option>
              <option value="CRITICAL">Critical Urgency ({criticalRequestsCount})</option>
            </select>
          </div>

          {filteredRequests.length === 0 ? (
            <div className="text-center py-14 bg-slate-50/60 rounded-2xl border border-slate-100">
              <Droplets className="h-9 w-9 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No blood requests match this filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <th className="px-4 py-3">Req ID</th>
                    <th className="px-4 py-3">Blood Group</th>
                    <th className="px-4 py-3">Units</th>
                    <th className="px-4 py-3">Urgency</th>
                    <th className="px-4 py-3">Hospital & City</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Posted Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredRequests.map(req => (
                    <tr key={req.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3.5 font-mono text-[10px] text-slate-400">{req.id.substring(0, 8)}...</td>
                      <td className="px-4 py-3.5 font-black text-rose-600 text-sm">{req.bloodGroup}</td>
                      <td className="px-4 py-3.5 font-bold text-slate-800">{req.units}</td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${
                          req.urgency === 'CRITICAL' ? 'bg-rose-100 text-rose-800 border-rose-200' :
                          req.urgency === 'URGENT' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                          'bg-emerald-100 text-emerald-800 border-emerald-200'
                        }`}>
                          {req.urgency}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-slate-800">{req.hospital}</p>
                        <p className="text-[10px] text-slate-400">{req.location}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${
                          req.status === 'ACTIVE' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          req.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          'bg-slate-100 text-slate-500 border-slate-200'
                        }`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-400 text-[11px]">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB 4: MATCHES & DONATION JOURNEYS
         ══════════════════════════════════════════════════════ */}
      {activeTab === 'matches' && (
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-5">
          <div className="pb-4 border-b border-slate-100">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Activity className="h-5 w-5 text-emerald-600" />
              Real-Time Matches & Donation Journeys
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {matches.length} total matches recorded · {acceptedMatchesCount} accepted · {completedMatchesCount} completed ({matchSuccessRate}% success) · {pendingMatchesCount} pending · {declinedMatchesCount} declined
            </p>
          </div>

          {matches.length === 0 ? (
            <div className="text-center py-14 bg-slate-50/60 rounded-2xl border border-slate-100">
              <Activity className="h-9 w-9 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No matching activity yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <th className="px-4 py-3">Match ID</th>
                    <th className="px-4 py-3">Donor</th>
                    <th className="px-4 py-3">Match Score</th>
                    <th className="px-4 py-3">Journey Stage</th>
                    <th className="px-4 py-3">Timestamps</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {matches.map(m => {
                    const donorUser = users.find(u => u.id === m.donorId);
                    return (
                      <tr key={m.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3.5 font-mono text-[10px] text-slate-400">{m.id.substring(0, 8)}...</td>
                        <td className="px-4 py-3.5">
                          <p className="font-bold text-slate-800">{donorUser?.name || 'Anonymous Donor'}</p>
                          <p className="text-[10px] text-slate-400">{donorUser?.email}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[10px]">
                            {m.matchScore}%
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${
                            m.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-900 border-emerald-300' :
                            m.status === 'ARRIVED' ? 'bg-indigo-100 text-indigo-900 border-indigo-300' :
                            m.status === 'ON_THE_WAY' ? 'bg-amber-100 text-amber-900 border-amber-300' :
                            m.status === 'ACCEPTED' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                            m.status === 'DECLINED' ? 'bg-slate-100 text-slate-600 border-slate-300' :
                            'bg-slate-50 text-slate-500 border-slate-200'
                          }`}>
                            {m.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-[11px] text-slate-400">
                          {m.completedAt ? `Completed: ${new Date(m.completedAt).toLocaleTimeString()}` :
                           m.arrivedAt ? `Arrived: ${new Date(m.arrivedAt).toLocaleTimeString()}` :
                           m.onTheWayAt ? `On Way: ${new Date(m.onTheWayAt).toLocaleTimeString()}` :
                           m.acceptedAt ? `Accepted: ${new Date(m.acceptedAt).toLocaleTimeString()}` :
                           new Date(m.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB 5: SAFETY REPORTS MANAGEMENT
         ══════════════════════════════════════════════════════ */}
      {activeTab === 'reports' && (
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Flag className="h-5 w-5 text-rose-600" />
                Safety Concerns & User Reports
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {reports.length} total reports · {openReportsCount} open · {resolvedReportsCount} resolved
              </p>
            </div>

            <select
              value={reportFilter}
              onChange={e => setReportFilter(e.target.value as any)}
              className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-rose-400"
            >
              <option value="ALL">All Reports ({reports.length})</option>
              <option value="OPEN">Open Only ({openReportsCount})</option>
              <option value="REVIEWED">Reviewed Only ({reviewedReportsCount})</option>
              <option value="RESOLVED">Resolved Only ({resolvedReportsCount})</option>
            </select>
          </div>

          {filteredReports.length === 0 ? (
            <div className="text-center py-14 bg-slate-50/60 rounded-2xl border border-slate-100">
              <CheckCircle2 className="h-9 w-9 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No reports found.</p>
              <p className="text-xs text-slate-400 mt-0.5">Platform is operating cleanly with 0 pending complaints.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <th className="px-4 py-3">Report ID</th>
                    <th className="px-4 py-3">Reporter</th>
                    <th className="px-4 py-3">Reported User</th>
                    <th className="px-4 py-3">Reason</th>
                    <th className="px-4 py-3">Details</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredReports.map(rep => {
                    const reporter = users.find(u => u.id === rep.reporterId);
                    const reportedUser = users.find(u => u.id === rep.reportedUserId);
                    return (
                      <tr key={rep.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3.5 font-mono text-[10px] text-slate-400">{rep.id.substring(0, 8)}...</td>
                        <td className="px-4 py-3.5 font-semibold text-slate-800">{reporter?.name || rep.reporterId.substring(0, 6)}</td>
                        <td className="px-4 py-3.5 font-bold text-slate-900">{reportedUser?.name || rep.reportedUserId.substring(0, 6)}</td>
                        <td className="px-4 py-3.5">
                          <span className="font-semibold text-rose-700 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded text-[10px]">
                            {rep.reason}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 max-w-[200px] truncate">
                          {rep.description || '—'}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${
                            rep.status === 'OPEN' ? 'bg-rose-100 text-rose-800 border-rose-200' :
                            rep.status === 'REVIEWED' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                            'bg-emerald-100 text-emerald-800 border-emerald-200'
                          }`}>
                            {rep.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-[11px] text-slate-400">
                          {new Date(rep.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {rep.status === 'OPEN' && (
                              <button
                                onClick={() => handleUpdateReportStatus(rep.id, 'REVIEWED')}
                                className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-2.5 py-1 rounded-lg text-[10px]"
                              >
                                Review
                              </button>
                            )}
                            {rep.status !== 'RESOLVED' && (
                              <button
                                onClick={() => handleUpdateReportStatus(rep.id, 'RESOLVED')}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 rounded-lg text-[10px]"
                              >
                                Resolve
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB 6: ANALYTICS & DEMAND DISTRIBUTION
         ══════════════════════════════════════════════════════ */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Blood Group Request Demand (6 Cols) */}
            <div className="lg:col-span-6 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-rose-600" />
                  Blood Group Demand Distribution
                </h3>
                <span className="text-[11px] text-slate-400 font-semibold">{totalRequestsCount} total requests</span>
              </div>

              {requests.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">No blood request data available.</p>
              ) : (
                <div className="space-y-3">
                  {bloodGroupStats.map(({ bg, reqCount, reqPct }) => (
                    <div key={bg} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-800">{bg}</span>
                        <span className="text-slate-500 font-mono">{reqCount} requests ({reqPct}%)</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-rose-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(reqPct, 2)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Urgency & Request Status Distribution (6 Cols) */}
            <div className="lg:col-span-6 space-y-6">
              {/* Urgency Breakdown */}
              <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2 pb-3 border-b border-slate-100">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Request Urgency Breakdown
                </h3>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3">
                    <p className="text-[10px] font-bold uppercase text-rose-700">🔴 Critical</p>
                    <p className="text-2xl font-black text-rose-900 mt-1">{criticalRequestsCount}</p>
                    <p className="text-[10px] text-rose-600 mt-0.5">{totalRequestsCount > 0 ? Math.round((criticalRequestsCount / totalRequestsCount) * 100) : 0}%</p>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3">
                    <p className="text-[10px] font-bold uppercase text-amber-700">🟡 Urgent</p>
                    <p className="text-2xl font-black text-amber-900 mt-1">{urgentRequestsCount}</p>
                    <p className="text-[10px] text-amber-600 mt-0.5">{totalRequestsCount > 0 ? Math.round((urgentRequestsCount / totalRequestsCount) * 100) : 0}%</p>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3">
                    <p className="text-[10px] font-bold uppercase text-emerald-700">🟢 Normal</p>
                    <p className="text-2xl font-black text-emerald-900 mt-1">{normalRequestsCount}</p>
                    <p className="text-[10px] text-emerald-600 mt-0.5">{totalRequestsCount > 0 ? Math.round((normalRequestsCount / totalRequestsCount) * 100) : 0}%</p>
                  </div>
                </div>
              </div>

              {/* Top Request Locations */}
              <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2 pb-3 border-b border-slate-100">
                  <MapPin className="h-4 w-4 text-indigo-500" />
                  Top Blood Request Locations
                </h3>
                {topLocations.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">Location data unavailable</p>
                ) : (
                  <div className="space-y-2">
                    {topLocations.map(([loc, count], idx) => (
                      <div key={loc} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 last:border-0">
                        <span className="font-semibold text-slate-700 flex items-center gap-2">
                          <span className="h-5 w-5 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-[10px]">
                            {idx + 1}
                          </span>
                          {loc}
                        </span>
                        <span className="font-mono font-bold text-slate-900">{count} request{count > 1 ? 's' : ''}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
