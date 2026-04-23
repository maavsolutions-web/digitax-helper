-- 1. Profiles: referral slug + referred_by_ca
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_slug text UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by_ca uuid;

CREATE INDEX IF NOT EXISTS idx_profiles_referral_slug ON public.profiles(referral_slug);
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by_ca ON public.profiles(referred_by_ca);

-- Allow public read by referral slug (for landing page) — only exposes name/firm
CREATE POLICY "Public can view profile by referral slug"
ON public.profiles
FOR SELECT
USING (referral_slug IS NOT NULL);

-- 2. Communications log
CREATE TYPE public.communication_type AS ENUM (
  'document_request',
  'reminder',
  'status_update',
  'invite',
  'custom'
);

CREATE TABLE public.communications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_id uuid NOT NULL,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  message_type public.communication_type NOT NULL DEFAULT 'custom',
  message_content text NOT NULL,
  delivered boolean NOT NULL DEFAULT false,
  delivery_meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  sent_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_communications_client_sent ON public.communications(client_id, sent_at DESC);
CREATE INDEX idx_communications_ca ON public.communications(ca_id);

ALTER TABLE public.communications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CAs view own communications"
ON public.communications FOR SELECT
USING (auth.uid() = ca_id);

CREATE POLICY "CAs insert own communications"
ON public.communications FOR INSERT
WITH CHECK (auth.uid() = ca_id);

-- 3. Firm members (multi-staff)
CREATE TYPE public.firm_role AS ENUM ('owner', 'senior', 'junior');

CREATE TABLE public.firm_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id uuid NOT NULL,
  member_user_id uuid,
  invited_phone text,
  invited_email text,
  role public.firm_role NOT NULL DEFAULT 'junior',
  invited_at timestamp with time zone NOT NULL DEFAULT now(),
  accepted_at timestamp with time zone,
  invited_by uuid NOT NULL,
  CONSTRAINT firm_members_invite_target_chk
    CHECK (member_user_id IS NOT NULL OR invited_phone IS NOT NULL OR invited_email IS NOT NULL)
);

CREATE INDEX idx_firm_members_firm ON public.firm_members(firm_id);
CREATE INDEX idx_firm_members_member ON public.firm_members(member_user_id);
CREATE UNIQUE INDEX idx_firm_members_unique_member ON public.firm_members(firm_id, member_user_id) WHERE member_user_id IS NOT NULL;

ALTER TABLE public.firm_members ENABLE ROW LEVEL SECURITY;

-- Helper: get firm role for a user (security definer to avoid recursion)
CREATE OR REPLACE FUNCTION public.firm_role_for(_firm_id uuid, _user_id uuid)
RETURNS public.firm_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.firm_members
  WHERE firm_id = _firm_id AND member_user_id = _user_id AND accepted_at IS NOT NULL
  LIMIT 1
$$;

-- Helper: is the user the firm owner (i.e. firm_id = their own user id)?
CREATE OR REPLACE FUNCTION public.is_firm_owner(_firm_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _firm_id = _user_id
$$;

-- Owner can view all members of their firm; members can view their own row
CREATE POLICY "Firm owner views members"
ON public.firm_members FOR SELECT
USING (auth.uid() = firm_id);

CREATE POLICY "Member views own firm row"
ON public.firm_members FOR SELECT
USING (auth.uid() = member_user_id);

-- Owner inserts members for their firm
CREATE POLICY "Firm owner inserts members"
ON public.firm_members FOR INSERT
WITH CHECK (auth.uid() = firm_id AND auth.uid() = invited_by);

-- Owner updates / removes members of their firm
CREATE POLICY "Firm owner updates members"
ON public.firm_members FOR UPDATE
USING (auth.uid() = firm_id);

CREATE POLICY "Firm owner deletes members"
ON public.firm_members FOR DELETE
USING (auth.uid() = firm_id);

-- Member can mark their own invite accepted
CREATE POLICY "Member accepts own invite"
ON public.firm_members FOR UPDATE
USING (auth.uid() = member_user_id);
