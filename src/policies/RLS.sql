-- Row Level Security (RLS) Policies for Citizenship Platform
-- These are placeholder policies. In production, enable RLS on tables and apply these.

-- Enable RLS on tables (run these in Supabase SQL Editor)
-- ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Leads: Users can only see their own leads
CREATE POLICY "Users can view own leads" ON leads
  FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "Users can insert own leads" ON leads
  FOR INSERT WITH CHECK (auth.uid()::text = id);

-- Contracts: Users can only access contracts related to their profiles
CREATE POLICY "Users can view own contracts" ON contracts
  FOR SELECT USING (
    user_id = auth.uid()::text OR
    family_group_id IN (
      SELECT family_group_id FROM contracts WHERE user_id = auth.uid()::text
    )
  );

-- Payments: Users can only see payments for their contracts
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (
    user_id = auth.uid()::text OR
    contract_id IN (
      SELECT id FROM contracts WHERE user_id = auth.uid()::text
    )
  );

-- Profiles: Users can only access their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (id = auth.uid()::text);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (id = auth.uid()::text);

-- Admin override: Admins can access everything
CREATE POLICY "Admins can access all" ON leads
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()::text AND role = 'admin'
    )
  );

-- Similar admin policies for other tables...