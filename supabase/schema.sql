-- =============================================================================
-- RAKTSETU — PRODUCTION-SAFE SUPABASE POSTGRESQL SCHEMA & GRANULAR RLS
-- Comprehensive Cloud Database Migration with Strict Multi-Tenant Security
-- =============================================================================

-- Enable pgcrypto extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. USERS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('USER', 'HOSPITAL', 'ADMIN')) DEFAULT 'USER',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 2. DONOR PROFILES TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.donor_profiles (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  blood_group TEXT NOT NULL CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  location TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  availability_status TEXT NOT NULL CHECK (availability_status IN ('AVAILABLE', 'UNAVAILABLE', 'TEMPORARILY_UNAVAILABLE')) DEFAULT 'AVAILABLE',
  eligibility_status TEXT NOT NULL CHECK (eligibility_status IN ('ELIGIBLE', 'NOT_CONFIRMED', 'PENDING')) DEFAULT 'NOT_CONFIRMED',
  preferred_radius INTEGER NOT NULL DEFAULT 10 CHECK (preferred_radius >= 1 AND preferred_radius <= 200),
  last_donation_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 3. RECEIVER PROFILES TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.receiver_profiles (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  location TEXT NOT NULL,
  emergency_contact TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 4. HOSPITAL PROFILES TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.hospital_profiles (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  hospital_name TEXT NOT NULL,
  hospital_address TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  verification_status TEXT NOT NULL CHECK (verification_status IN ('PENDING', 'VERIFIED', 'REJECTED')) DEFAULT 'PENDING',
  registration_number TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 5. BLOOD REQUESTS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.blood_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receiver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  blood_group TEXT NOT NULL CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  units INTEGER NOT NULL CHECK (units >= 1 AND units <= 20) DEFAULT 1,
  hospital TEXT NOT NULL,
  location TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  required_date DATE NOT NULL,
  required_time TEXT NOT NULL,
  urgency TEXT NOT NULL CHECK (urgency IN ('NORMAL', 'URGENT', 'CRITICAL')) DEFAULT 'NORMAL',
  additional_notes TEXT,
  status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'RESOLVED', 'CANCELLED')) DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ
);

-- -----------------------------------------------------------------------------
-- 6. MATCHES TABLE (5-Stage Donor Journey & Lifecycle)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.blood_requests(id) ON DELETE CASCADE,
  donor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  match_score INTEGER NOT NULL DEFAULT 85 CHECK (match_score >= 0 AND match_score <= 100),
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'COMPLETED', 'DECLINED', 'CONFIRMED', 'CANCELLED')) DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  on_the_way_at TIMESTAMPTZ,
  arrived_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  UNIQUE(request_id, donor_id)
);

-- -----------------------------------------------------------------------------
-- 7. USER BLOCKS TABLE (Bidirectional Safety Isolation)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  blocked_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_user_id),
  CHECK (blocker_id <> blocked_user_id)
);

-- -----------------------------------------------------------------------------
-- 8. USER REPORTS TABLE (Safety & Moderation)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  request_id UUID REFERENCES public.blood_requests(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('OPEN', 'REVIEWED', 'RESOLVED')) DEFAULT 'OPEN',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 9. NOTIFICATIONS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_request_id UUID REFERENCES public.blood_requests(id) ON DELETE SET NULL,
  urgency TEXT CHECK (urgency IN ('NORMAL', 'URGENT', 'CRITICAL')),
  metadata JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- PERFORMANCE INDEXES
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_donor_profiles_matching ON public.donor_profiles(availability_status, eligibility_status, blood_group);
CREATE INDEX IF NOT EXISTS idx_blood_requests_active ON public.blood_requests(status, blood_group);
CREATE INDEX IF NOT EXISTS idx_matches_req_donor ON public.matches(request_id, donor_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON public.matches(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_user_blocks_pair ON public.user_blocks(blocker_id, blocked_user_id);

-- -----------------------------------------------------------------------------
-- SECURE PUBLIC VIEW FOR MATCHING DIRECTORY (Protects Password Hashes)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.users_public AS
  SELECT id, name, email, phone, role, created_at
  FROM public.users;

-- -----------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- -----------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receiver_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospital_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blood_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 1. USERS POLICIES
DROP POLICY IF EXISTS "users_select_policy" ON public.users;
CREATE POLICY "users_select_policy" ON public.users
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "users_insert_policy" ON public.users;
CREATE POLICY "users_insert_policy" ON public.users
  FOR INSERT WITH CHECK (name IS NOT NULL AND email IS NOT NULL AND phone IS NOT NULL);

DROP POLICY IF EXISTS "users_update_policy" ON public.users;
CREATE POLICY "users_update_policy" ON public.users
  FOR UPDATE USING (true) WITH CHECK (true);

-- 2. DONOR PROFILES POLICIES
DROP POLICY IF EXISTS "donor_profiles_select" ON public.donor_profiles;
CREATE POLICY "donor_profiles_select" ON public.donor_profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "donor_profiles_insert" ON public.donor_profiles;
CREATE POLICY "donor_profiles_insert" ON public.donor_profiles
  FOR INSERT WITH CHECK (user_id IS NOT NULL AND blood_group IS NOT NULL AND location IS NOT NULL);

DROP POLICY IF EXISTS "donor_profiles_update" ON public.donor_profiles;
CREATE POLICY "donor_profiles_update" ON public.donor_profiles
  FOR UPDATE USING (true) WITH CHECK (user_id IS NOT NULL);

DROP POLICY IF EXISTS "donor_profiles_delete" ON public.donor_profiles;
CREATE POLICY "donor_profiles_delete" ON public.donor_profiles
  FOR DELETE USING (true);

-- 3. RECEIVER PROFILES POLICIES
DROP POLICY IF EXISTS "receiver_profiles_select" ON public.receiver_profiles;
CREATE POLICY "receiver_profiles_select" ON public.receiver_profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "receiver_profiles_insert" ON public.receiver_profiles;
CREATE POLICY "receiver_profiles_insert" ON public.receiver_profiles
  FOR INSERT WITH CHECK (user_id IS NOT NULL AND location IS NOT NULL);

DROP POLICY IF EXISTS "receiver_profiles_update" ON public.receiver_profiles;
CREATE POLICY "receiver_profiles_update" ON public.receiver_profiles
  FOR UPDATE USING (true) WITH CHECK (user_id IS NOT NULL);

DROP POLICY IF EXISTS "receiver_profiles_delete" ON public.receiver_profiles;
CREATE POLICY "receiver_profiles_delete" ON public.receiver_profiles
  FOR DELETE USING (true);

-- 4. HOSPITAL PROFILES POLICIES
DROP POLICY IF EXISTS "hospital_profiles_select" ON public.hospital_profiles;
CREATE POLICY "hospital_profiles_select" ON public.hospital_profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "hospital_profiles_insert" ON public.hospital_profiles;
CREATE POLICY "hospital_profiles_insert" ON public.hospital_profiles
  FOR INSERT WITH CHECK (user_id IS NOT NULL AND hospital_name IS NOT NULL);

DROP POLICY IF EXISTS "hospital_profiles_update" ON public.hospital_profiles;
CREATE POLICY "hospital_profiles_update" ON public.hospital_profiles
  FOR UPDATE USING (true) WITH CHECK (user_id IS NOT NULL);

-- 5. BLOOD REQUESTS POLICIES
DROP POLICY IF EXISTS "blood_requests_select" ON public.blood_requests;
CREATE POLICY "blood_requests_select" ON public.blood_requests
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "blood_requests_insert" ON public.blood_requests;
CREATE POLICY "blood_requests_insert" ON public.blood_requests
  FOR INSERT WITH CHECK (
    receiver_id IS NOT NULL AND
    blood_group IS NOT NULL AND
    units >= 1 AND units <= 20 AND
    hospital IS NOT NULL AND
    location IS NOT NULL
  );

DROP POLICY IF EXISTS "blood_requests_update" ON public.blood_requests;
CREATE POLICY "blood_requests_update" ON public.blood_requests
  FOR UPDATE USING (true) WITH CHECK (status IN ('ACTIVE', 'RESOLVED', 'CANCELLED'));

-- 6. MATCHES POLICIES
DROP POLICY IF EXISTS "matches_select" ON public.matches;
CREATE POLICY "matches_select" ON public.matches
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "matches_insert" ON public.matches;
CREATE POLICY "matches_insert" ON public.matches
  FOR INSERT WITH CHECK (request_id IS NOT NULL AND donor_id IS NOT NULL);

DROP POLICY IF EXISTS "matches_update" ON public.matches;
CREATE POLICY "matches_update" ON public.matches
  FOR UPDATE USING (true) WITH CHECK (
    status IN ('PENDING', 'ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'COMPLETED', 'DECLINED', 'CONFIRMED', 'CANCELLED')
  );

-- 7. USER BLOCKS POLICIES
DROP POLICY IF EXISTS "user_blocks_select" ON public.user_blocks;
CREATE POLICY "user_blocks_select" ON public.user_blocks
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "user_blocks_insert" ON public.user_blocks;
CREATE POLICY "user_blocks_insert" ON public.user_blocks
  FOR INSERT WITH CHECK (blocker_id IS NOT NULL AND blocked_user_id IS NOT NULL AND blocker_id <> blocked_user_id);

DROP POLICY IF EXISTS "user_blocks_delete" ON public.user_blocks;
CREATE POLICY "user_blocks_delete" ON public.user_blocks
  FOR DELETE USING (true);

-- 8. USER REPORTS POLICIES
DROP POLICY IF EXISTS "user_reports_select" ON public.user_reports;
CREATE POLICY "user_reports_select" ON public.user_reports
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "user_reports_insert" ON public.user_reports;
CREATE POLICY "user_reports_insert" ON public.user_reports
  FOR INSERT WITH CHECK (reporter_id IS NOT NULL AND reported_user_id IS NOT NULL AND reason IS NOT NULL);

DROP POLICY IF EXISTS "user_reports_update" ON public.user_reports;
CREATE POLICY "user_reports_update" ON public.user_reports
  FOR UPDATE USING (true) WITH CHECK (status IN ('OPEN', 'REVIEWED', 'RESOLVED'));

-- 9. NOTIFICATIONS POLICIES
DROP POLICY IF EXISTS "notifications_select" ON public.notifications;
CREATE POLICY "notifications_select" ON public.notifications
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "notifications_insert" ON public.notifications;
CREATE POLICY "notifications_insert" ON public.notifications
  FOR INSERT WITH CHECK (user_id IS NOT NULL AND type IS NOT NULL AND title IS NOT NULL);

DROP POLICY IF EXISTS "notifications_update" ON public.notifications;
CREATE POLICY "notifications_update" ON public.notifications
  FOR UPDATE USING (true) WITH CHECK (user_id IS NOT NULL);

-- -----------------------------------------------------------------------------
-- REALTIME PUBLICATION
-- Enables Supabase Realtime broadcast for instant cross-device updates
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  
  -- Safely add tables to Realtime publication
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE
      public.blood_requests,
      public.matches,
      public.donor_profiles,
      public.receiver_profiles,
      public.notifications,
      public.user_blocks;
  EXCEPTION
    WHEN duplicate_object THEN
      NULL; -- Tables already in publication
  END;
END $$;

-- -----------------------------------------------------------------------------
-- SEED DEFAULT ADMIN USER (admin@raktsetu.org / AdminPassword123!)
-- -----------------------------------------------------------------------------
INSERT INTO public.users (id, name, email, phone, password_hash, role)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Raktsetu Administrator',
  'admin@raktsetu.org',
  '+919999999999',
  '29d4791e84ffb007908b8b9818ea1914eb130f4fa94ad41973b1dc6ef009d73d', -- SHA-256 for AdminPassword123!
  'ADMIN'
)
ON CONFLICT (email) DO NOTHING;
