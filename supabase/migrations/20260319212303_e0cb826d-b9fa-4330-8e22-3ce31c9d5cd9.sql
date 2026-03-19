ALTER TABLE paid_users DISABLE ROW LEVEL SECURITY;

GRANT INSERT, SELECT ON TABLE paid_users TO anon, authenticated, service_role;