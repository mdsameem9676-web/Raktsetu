# 🩸 Raktsetu — Intelligent Emergency Blood Coordination Platform

> **Connecting Verified Blood Requesters with Compatible Nearby Donors in Real-Time.**

[![Live Demo](https://img.shields.io/badge/Live_Demo-raktsetu--gray.vercel.app-E11D48?style=for-the-badge&logo=vercel)](https://raktsetu-gray.vercel.app/)
[![React 19](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Vite 8](https://img.shields.io/badge/Vite-8.0-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![Tailwind CSS 4](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL_%2B_Realtime-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)

---

## 🌟 Key Features

* **🌐 Cross-Device Real-Time Cloud Sync:** Built with Supabase PostgreSQL and Realtime WebSocket subscriptions. Actions taken on Device A (e.g. mobile) instantly reflect on Device B (e.g. laptop) without manual page refreshes.
* **🧠 Intelligent RBC Blood Compatibility Algorithm:** Automated medical-grade matching rules across all 8 major blood groups (A+, A-, B+, B-, AB+, AB-, O+, O-), scoring matches based on blood compatibility, proximity radius, donor availability, and emergency urgency.
* **🔄 Two-Way Unified Capabilities:** A single user account can simultaneously act as a registered **Blood Donor** and an emergency **Blood Receiver** with dedicated independent capability toggles.
* **⏱️ Live Synchronized Journey Tracker:** Real-time 5-stage donation lifecycle tracking (`Request Created` ➔ `Donor Accepted` ➔ `On The Way` ➔ `Reached Receiver` ➔ `Donation Completed`).
* **🔔 In-App Real-Time Push Notifications:** Immediate contextual alert feed with unread badges, timestamping, and quick actions.
* **🛡️ Trust & Safety Layer:** Built-in requester reporting, donor blocking, self-declared medical eligibility checklists, and anonymized public profile protections.

---

## 📱 End-to-End Multi-Device Workflow & Verification Showcase

The following 12 verified screenshots demonstrate an end-to-end live emergency scenario tested across two independent devices:
- **Device A (Laptop):** Receiver account (`rakesh`) posting a Critical **A+** blood request at Yashoda Hospital.
- **Device B (Mobile):** Donor account (`Tawfiq`) with **O+** blood group matching, receiving the alert, and accepting the request.

---

### 1. Landing Page & Intelligent Matching Engine
The platform homepage showcasing the live matching engine architecture, compatibility coverage for all 8 blood groups, and quick-action access for donors and requesters.

![Landing Page](./screenshots/01-landing-page.png)

---

### 2. Donor Profile & Capability Setup (Device B — Mobile)
The donor sets up their medical profile with blood group (`O+`), location (`Uttar Pradesh`), donation radius (`50 km`), and eligibility.

![Donor Profile Setup](./screenshots/02-donor-profile-setup.png)

---

### 3. Receiver Emergency Request Creation (Device A — Laptop)
The receiver (`rakesh`) enables Receiver Capability and publishes a Critical `A+` emergency blood request for Yashoda Hospital.

![Receiver Emergency Request](./screenshots/03-receiver-emergency-request.png)

---

### 4. Real-Time Incoming Request Feed (Device B — Mobile)
Within seconds, Device B receives the compatible emergency request with a 100% Match Score and proximity calculation.

![Donor Incoming Blood Request](./screenshots/04-donor-incoming-blood-request.png)

---

### 5. Detailed Compatibility Modal & Action (Device B — Mobile)
The donor opens the request details to verify compatibility factors, hospital location, and deadline before confirming acceptance.

![Donor Request Detail Modal](./screenshots/05-donor-request-detail-modal.png)

---

### 6. Active Donation State & Live Journey Tracker (Device B — Mobile)
Upon accepting, the donor's dashboard enters the active donation state with real-time progression tracking and milestone logging.

![Donor Active Donation Journey](./screenshots/06-donor-active-donation-journey.png)

---

### 7. Real-Time Donor Notification Alert (Device B — Mobile)
The donor receives instant confirmation in their notification center.

![Donor Notification Alert](./screenshots/07-donor-realtime-notification.png)

---

### 8. Receiver Dashboard Matched Donor Card (Device A — Laptop)
Instantly on the receiver's laptop, the matching candidate card updates to reflect that donor Tawfiq (`O+`) has accepted.

![Receiver Matching Donors Card](./screenshots/08-receiver-matching-donors-card.png)

---

### 9. Receiver Matched Donor Profile Modal (Device A — Laptop)
The receiver inspects the full credentials, match breakdown, and verification details of the accepted donor.

![Receiver Matched Donor Modal](./screenshots/09-receiver-matching-donor-modal.png)

---

### 10. Synchronized Receiver Live Journey Tracker (Device A — Laptop)
Both requester and donor dashboards stay in sync in real-time as the donation progresses through each stage.

![Receiver Live Journey Tracker](./screenshots/10-receiver-live-journey-tracker.png)

---

### 11. Receiver Real-Time Notification Center (Device A — Laptop)
The receiver receives contextual notifications for all critical match events (`Donor Accepted Your Request`).

![Receiver Real-Time Notifications](./screenshots/11-receiver-realtime-notifications.png)

---

### 12. Full End-to-End Dual Device Coordination Overview
High-level overview demonstrating the complete round-trip flow between multiple concurrent users on different devices.

![Dual Device Coordination](./screenshots/12-receiver-dual-device-coordination.png)

---

## 🏗️ Technical Architecture & Stack

```text
┌────────────────────────────────────────────────────────┐
│                   Raktsetu Frontend                    │
│        React 19 • TypeScript • Vite 8 • Tailwind 4     │
└───────────────────────────┬────────────────────────────┘
                            │
              Dual Layer Database Service
                            │
       ┌────────────────────┴────────────────────┐
       ▼                                         ▼
┌───────────────────────────┐       ┌───────────────────────────┐
│     Supabase Cloud DB     │       │    Local Storage Cache    │
│  PostgreSQL + RLS + Realtime │       │ (Instant offline fallback)│
└───────────────────────────┘       └───────────────────────────┘
```

* **Frontend:** React 19, TypeScript, Vite 8, TailwindCSS 4, Lucide React Icons
* **Cloud Database:** Supabase PostgreSQL with 9 core relational tables:
  - `users` & `users_public` (Secure SHA-256 credentials with protected hash view)
  - `donor_profiles` (Blood group, location, radius, eligibility, availability)
  - `receiver_profiles` (Emergency contact lines, delivery addresses)
  - `hospital_profiles` (Verified healthcare centers)
  - `blood_requests` (Units, urgency level, patient notes, active status)
  - `matches` (Match score, compatibility factors, acceptance status, timestamps)
  - `notifications` (Realtime user alert feed)
  - `user_blocks` & `user_reports` (Trust and safety records)
* **Realtime Communication:** Supabase Realtime Channels (`postgres_changes` websocket listeners) with cross-tab BroadcastChannel fallback.

---

## 🚀 Getting Started Locally

### 1. Clone the repository
```bash
git clone https://github.com/mdsameem9676-web/Raktsetu.git
cd Raktsetu
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env.local` file in the root directory:
```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-publishable-key
```

### 4. Run the development server
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
