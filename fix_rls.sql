-- STEP 1: Kill ALL stuck/active queries (run this FIRST)
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE state = 'active' 
  AND pid != pg_backend_pid()
  AND query NOT LIKE '%pg_terminate%';

-- STEP 2: Disable RLS on all tables (run this AFTER step 1 succeeds)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_verifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE authority_verifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE xray_submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE reports DISABLE ROW LEVEL SECURITY;
