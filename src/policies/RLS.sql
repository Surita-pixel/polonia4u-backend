-- ==========================================================
-- 1. FUNCIÓN DE SEGURIDAD (SECURITY DEFINER)
-- Evita recursión infinita al no disparar RLS sobre sí misma
-- ==========================================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT (role = 'admin') 
    FROM public.profiles 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================================
-- 2. HABILITACIÓN DE RLS
-- ==========================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dependents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

-- ==========================================================
-- 3. POLÍTICAS PARA PROFILES
-- ==========================================================
CREATE POLICY "Admin full access profiles" ON profiles 
  FOR ALL TO authenticated USING (is_admin());

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ==========================================================
-- 4. POLÍTICAS PARA LEADS
-- ==========================================================
CREATE POLICY "Admin manage leads" ON leads 
  FOR ALL TO authenticated USING (is_admin());

-- Un usuario solo ve el lead si está vinculado a su perfil [cite: 27, 28]
CREATE POLICY "Users can view linked lead" ON leads
  FOR SELECT TO authenticated
  USING (id IN (SELECT lead_id FROM profiles WHERE id = auth.uid()));

-- ==========================================================
-- 5. POLÍTICAS PARA CONTRACTS (Satellite Architecture)
-- ==========================================================
CREATE POLICY "Admin manage contracts" ON contracts 
  FOR ALL TO authenticated USING (is_admin());

-- Independencia financiera pero visibilidad de grupo familiar [cite: 35, 53]
CREATE POLICY "Users view family group contracts" ON contracts
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR 
    family_group_id IN (
      SELECT family_group_id FROM contracts WHERE user_id = auth.uid()
    )
  );

-- ==========================================================
-- 6. POLÍTICAS PARA DOCUMENTS (Vault & Hard Lock)
-- ==========================================================
CREATE POLICY "Admin manage documents" ON documents 
  FOR ALL TO authenticated USING (is_admin());

-- Hard Lock: Revoca acceso si el estado es 'suspended' (>30 días deuda) [cite: 64, 65]
CREATE POLICY "Users access own documents" ON documents
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND payment_status != 'suspended'
    )
  );

CREATE POLICY "Users can upload documents" ON documents
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- ==========================================================
-- 7. POLÍTICAS PARA PAYMENTS
-- ==========================================================
CREATE POLICY "Admin manage payments" ON payments 
  FOR ALL TO authenticated USING (is_admin());

CREATE POLICY "Users view own payments" ON payments
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- ==========================================================
-- 8. POLÍTICAS PARA PROCESSES (Visual Timeline)
-- ==========================================================
CREATE POLICY "Admin manage processes" ON processes 
  FOR ALL TO authenticated USING (is_admin());

-- Los usuarios ven su progreso (BR Documents, Translations, etc.) [cite: 79]
CREATE POLICY "Users view own process timeline" ON processes
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- ==========================================================
-- 9. POLÍTICAS PARA DEPENDENTS & PROPOSALS
-- ==========================================================
CREATE POLICY "Admin manage dependents" ON dependents FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Admin manage proposals" ON proposals FOR ALL TO authenticated USING (is_admin());

CREATE POLICY "Users view own dependents" ON dependents
  FOR SELECT TO authenticated USING (parent_user_id = auth.uid());

-- Las propuestas son visibles si no han expirado (uuid público) [cite: 38]
CREATE POLICY "View valid proposals" ON proposals
  FOR SELECT USING (expiration_date > now());