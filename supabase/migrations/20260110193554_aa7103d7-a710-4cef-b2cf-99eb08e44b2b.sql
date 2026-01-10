-- =============================================
-- FASE 1: Sistema de Planos e Gestão de Créditos
-- =============================================

-- 1. Criar tabela de planos
CREATE TABLE public.plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  credits_per_month INTEGER NOT NULL,
  features JSONB DEFAULT '{}',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- Planos são públicos para leitura (todos podem ver)
CREATE POLICY "Anyone can view active plans"
ON public.plans
FOR SELECT
USING (active = true);

-- Apenas admin global pode gerenciar planos
CREATE POLICY "Admin global can manage plans"
ON public.plans
FOR ALL
USING (is_admin_global(auth.uid()));

-- Inserir planos iniciais
INSERT INTO public.plans (id, name, price, credits_per_month, features) VALUES
('trial', 'Trial Grátis', 0, 50, '{"duration_days": 14}'),
('starter', 'Starter', 127, 100, '{"whatsapp": true}'),
('growth', 'Growth', 247, 300, '{"whatsapp": true, "priority_support": true}'),
('pro', 'Pro', 497, 800, '{"whatsapp": true, "priority_support": true, "custom_branding": true}');

-- 2. Atualizar tabela stores com novos campos
-- Renomear campos existentes e adicionar novos
ALTER TABLE public.stores 
  ADD COLUMN IF NOT EXISTS plan_credits INTEGER DEFAULT 50,
  ADD COLUMN IF NOT EXISTS extra_credits INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS plan_started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ADD COLUMN IF NOT EXISTS plan_renews_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT true;

-- Atualizar lojas existentes: migrar tryons_limit para plan_credits
UPDATE public.stores 
SET 
  plan_credits = COALESCE(tryons_limit, 50),
  plan = CASE WHEN plan = 'free' THEN 'trial' ELSE plan END,
  trial_ends_at = now() + INTERVAL '14 days',
  plan_renews_at = now() + INTERVAL '14 days'
WHERE plan_credits IS NULL OR plan_credits = 50;

-- 3. Criar tabela de transações de créditos
CREATE TABLE public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  credits_before INTEGER NOT NULL,
  credits_change INTEGER NOT NULL,
  credits_after INTEGER NOT NULL,
  credit_type TEXT NOT NULL DEFAULT 'plan', -- 'plan' ou 'extra'
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_credit_transactions_store ON public.credit_transactions(store_id);
CREATE INDEX idx_credit_transactions_created ON public.credit_transactions(created_at DESC);
CREATE INDEX idx_credit_transactions_type ON public.credit_transactions(type);

-- Habilitar RLS
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver transações da própria loja
CREATE POLICY "Users can view their store transactions"
ON public.credit_transactions
FOR SELECT
USING (
  is_admin_global(auth.uid()) OR 
  store_id = get_user_store_id(auth.uid())
);

-- Sistema pode inserir transações (via service role)
CREATE POLICY "System can insert transactions"
ON public.credit_transactions
FOR INSERT
WITH CHECK (store_id = get_user_store_id(auth.uid()));

-- 4. Atualizar função handle_new_user para configurar trial
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public 
AS $$
DECLARE
  new_store_id UUID;
  trial_end TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Calcular fim do trial (14 dias)
  trial_end := now() + INTERVAL '14 days';
  
  -- Create a new store for the user with trial setup
  INSERT INTO public.stores (name, slug, plan, plan_credits, extra_credits, trial_ends_at, plan_renews_at, plan_started_at)
  VALUES (
    COALESCE(NEW.raw_user_meta_data ->> 'store_name', 'Minha Loja'),
    COALESCE(NEW.raw_user_meta_data ->> 'store_slug', 'loja-' || LEFT(NEW.id::text, 8)),
    'trial',
    50,
    0,
    trial_end,
    trial_end,
    now()
  )
  RETURNING id INTO new_store_id;

  -- Create profile with all required fields
  INSERT INTO public.profiles (id, store_id, full_name, cpf, cnpj, phone)
  VALUES (
    NEW.id,
    new_store_id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'cpf', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'cnpj', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'phone', '')
  );

  -- Assign default 'admin' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'admin');
  
  -- Registrar transação inicial de créditos
  INSERT INTO public.credit_transactions (store_id, type, credits_before, credits_change, credits_after, credit_type, description)
  VALUES (new_store_id, 'trial_started', 0, 50, 50, 'plan', 'Trial iniciado - 50 créditos grátis');

  RETURN NEW;
END;
$$;

-- 5. Criar função para verificar se pode gerar try-on
CREATE OR REPLACE FUNCTION public.can_generate_tryon(p_store_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_store RECORD;
  v_total_credits INTEGER;
BEGIN
  -- Buscar dados da loja
  SELECT plan, plan_credits, extra_credits, trial_ends_at, plan_renews_at
  INTO v_store
  FROM public.stores
  WHERE id = p_store_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'STORE_NOT_FOUND');
  END IF;
  
  -- Verificar trial expirado
  IF v_store.plan = 'trial' AND v_store.trial_ends_at < now() THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'TRIAL_EXPIRED', 'trial_ends_at', v_store.trial_ends_at);
  END IF;
  
  -- Verificar créditos
  v_total_credits := COALESCE(v_store.extra_credits, 0) + COALESCE(v_store.plan_credits, 0);
  
  IF v_total_credits <= 0 THEN
    RETURN jsonb_build_object(
      'allowed', false, 
      'reason', 'NO_CREDITS',
      'plan_renews_at', v_store.plan_renews_at
    );
  END IF;
  
  RETURN jsonb_build_object(
    'allowed', true,
    'total_credits', v_total_credits,
    'plan_credits', v_store.plan_credits,
    'extra_credits', v_store.extra_credits
  );
END;
$$;

-- 6. Criar função para consumir crédito
CREATE OR REPLACE FUNCTION public.consume_credit(p_store_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_store RECORD;
  v_new_extra INTEGER;
  v_new_plan INTEGER;
  v_credit_type TEXT;
  v_total_before INTEGER;
  v_total_after INTEGER;
BEGIN
  -- Buscar dados da loja com lock para evitar race condition
  SELECT plan_credits, extra_credits
  INTO v_store
  FROM public.stores
  WHERE id = p_store_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'STORE_NOT_FOUND');
  END IF;
  
  v_total_before := COALESCE(v_store.extra_credits, 0) + COALESCE(v_store.plan_credits, 0);
  
  IF v_total_before <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'NO_CREDITS');
  END IF;
  
  -- Consumir extras primeiro, depois mensais
  v_new_extra := COALESCE(v_store.extra_credits, 0);
  v_new_plan := COALESCE(v_store.plan_credits, 0);
  
  IF v_store.extra_credits > 0 THEN
    v_new_extra := v_store.extra_credits - 1;
    v_credit_type := 'extra';
  ELSE
    v_new_plan := v_store.plan_credits - 1;
    v_credit_type := 'plan';
  END IF;
  
  v_total_after := v_new_extra + v_new_plan;
  
  -- Atualizar loja
  UPDATE public.stores
  SET 
    extra_credits = v_new_extra,
    plan_credits = v_new_plan,
    tryons_used = COALESCE(tryons_used, 0) + 1
  WHERE id = p_store_id;
  
  -- Registrar transação
  INSERT INTO public.credit_transactions (store_id, type, credits_before, credits_change, credits_after, credit_type, description)
  VALUES (p_store_id, 'tryon_used', v_total_before, -1, v_total_after, v_credit_type, 'Try-on realizado');
  
  RETURN jsonb_build_object(
    'success', true,
    'credits_remaining', v_total_after,
    'plan_credits', v_new_plan,
    'extra_credits', v_new_extra,
    'consumed_from', v_credit_type
  );
END;
$$;