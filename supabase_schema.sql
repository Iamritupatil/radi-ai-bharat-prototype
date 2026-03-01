-- =============================================
-- RadiAI Bharat: Role-Based Auth Schema
-- Run this in Supabase SQL Editor (supabase.com → SQL Editor)
-- =============================================

-- 1. PROFILES TABLE (extends auth.users with role info)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL DEFAULT '',
    role TEXT CHECK (role IN ('individual', 'doctor', 'authority')),
    verified BOOLEAN DEFAULT FALSE,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read/update their own profile
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
-- Doctors can view all profiles (to see patient names)
CREATE POLICY "Doctors can view profiles" ON profiles FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'doctor' AND verified = true)
);


-- 2. DOCTOR VERIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS doctor_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    full_name TEXT NOT NULL,
    qualification TEXT NOT NULL,
    registration_number TEXT NOT NULL,
    council_type TEXT CHECK (council_type IN ('NMC', 'SMC')) NOT NULL,
    state_council TEXT,
    hospital_name TEXT NOT NULL,
    licence_url TEXT,
    signature_url TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE doctor_verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert own verification" ON doctor_verifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own verification" ON doctor_verifications FOR SELECT USING (auth.uid() = user_id);


-- 3. AUTHORITY VERIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS authority_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    org_name TEXT NOT NULL,
    registration_number TEXT NOT NULL,
    certificate_url TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE authority_verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert own auth verification" ON authority_verifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own auth verification" ON authority_verifications FOR SELECT USING (auth.uid() = user_id);


-- 4. X-RAY SUBMISSIONS TABLE
CREATE TABLE IF NOT EXISTS xray_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    patient_name TEXT NOT NULL,
    xray_url TEXT NOT NULL,
    xray_type TEXT,
    notes TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'completed')),
    assigned_doctor_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE xray_submissions ENABLE ROW LEVEL SECURITY;
-- Patients can manage their own submissions
CREATE POLICY "Patients can insert submissions" ON xray_submissions FOR INSERT WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Patients can view own submissions" ON xray_submissions FOR SELECT USING (auth.uid() = patient_id);
-- Verified doctors can view/update all submissions
CREATE POLICY "Doctors can view all submissions" ON xray_submissions FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'doctor' AND verified = true)
);
CREATE POLICY "Doctors can update submissions" ON xray_submissions FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'doctor' AND verified = true)
);


-- 5. REPORTS TABLE
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID REFERENCES xray_submissions(id) ON DELETE CASCADE NOT NULL,
    doctor_id UUID REFERENCES auth.users(id) NOT NULL,
    prediction TEXT,
    confidence REAL,
    cam_image_url TEXT,
    findings TEXT,
    impression TEXT,
    doctor_signature_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
-- Doctors can insert reports
CREATE POLICY "Doctors can insert reports" ON reports FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'doctor' AND verified = true)
);
-- Doctors and patients can view reports
CREATE POLICY "Doctors can view reports" ON reports FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'doctor' AND verified = true)
);
CREATE POLICY "Patients can view own reports" ON reports FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM xray_submissions
        WHERE xray_submissions.id = reports.submission_id
        AND xray_submissions.patient_id = auth.uid()
    )
);


-- =============================================
-- STORAGE BUCKETS
-- Create these in Supabase Dashboard → Storage:
--   1. "xrays" (public)
--   2. "licences" (public)
--   3. "signatures" (public)
--   4. "certificates" (public)
-- =============================================
