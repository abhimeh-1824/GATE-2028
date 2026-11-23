-- ============================================================================
-- Non-Destructive Migration: Competitive Coin System & Leaderboard
-- Safe to run multiple times (idempotent). Does NOT alter or drop existing data.
-- ============================================================================

-- 1. Add coin_balance column to public.profiles (defaults to 0)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS coin_balance integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_profiles_coin_balance
  ON public.profiles (coin_balance DESC, updated_at ASC);

-- 2. Create coin_transactions ledger table
CREATE TABLE IF NOT EXISTS public.coin_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount integer NOT NULL CHECK (amount > 0),
  category text NOT NULL CHECK (
    category IN ('test_created', 'test_attempted', 'accuracy_bonus', 'improvement_bonus')
  ),
  reason text NOT NULL,
  reference_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coin_transactions_user_created
  ON public.coin_transactions (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_coin_transactions_category
  ON public.coin_transactions (category);

-- 3. Trigger function to atomically increment profiles.coin_balance on insert
CREATE OR REPLACE FUNCTION public.apply_coin_transaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET
    coin_balance = COALESCE(coin_balance, 0) + NEW.amount,
    updated_at = now()
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_apply_coin_transaction ON public.coin_transactions;
CREATE TRIGGER trg_apply_coin_transaction
  AFTER INSERT ON public.coin_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.apply_coin_transaction();

-- 4. Row Level Security for coin_transactions & leaderboard visibility
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS coin_transactions_select_own ON public.coin_transactions;
CREATE POLICY coin_transactions_select_own
  ON public.coin_transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS coin_transactions_insert_own ON public.coin_transactions;
CREATE POLICY coin_transactions_insert_own
  ON public.coin_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to read profiles for the competitive leaderboard
-- (safe: profiles only contains id, full_name, role, coin_balance, timestamps)
DROP POLICY IF EXISTS profiles_select_leaderboard ON public.profiles;
CREATE POLICY profiles_select_leaderboard
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

GRANT SELECT, INSERT ON public.coin_transactions TO authenticated;

-- 5. Backfill any auth.users that do not yet have a row in public.profiles
INSERT INTO public.profiles (id, full_name, role)
SELECT
  u.id,
  COALESCE(NULLIF(u.raw_user_meta_data ->> 'full_name', ''), split_part(u.email, '@', 1), 'GATE Aspirant'),
  'student'
FROM auth.users u
ON CONFLICT (id) DO NOTHING;
