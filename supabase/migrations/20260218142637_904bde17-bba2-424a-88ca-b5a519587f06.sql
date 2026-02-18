
-- Add 'enterprise' to the subscription_plan enum
ALTER TYPE public.subscription_plan ADD VALUE IF NOT EXISTS 'enterprise';

-- Organizations table
CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_id uuid NOT NULL,
  max_members integer NOT NULL DEFAULT 3,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Organization members table
CREATE TABLE public.organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member',
  position text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Helper function: get user's organization id
CREATE OR REPLACE FUNCTION public.get_user_org_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.organization_members
  WHERE user_id = _user_id LIMIT 1
$$;

-- Helper function: check if user is org admin (owner)
CREATE OR REPLACE FUNCTION public.is_org_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organizations
    WHERE owner_id = _user_id
  )
$$;

-- Helper: check if two users are in the same org
CREATE OR REPLACE FUNCTION public.same_org(_user1 uuid, _user2 uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members m1
    JOIN public.organization_members m2 ON m1.organization_id = m2.organization_id
    WHERE m1.user_id = _user1 AND m2.user_id = _user2
  )
$$;

-- RLS for organizations
CREATE POLICY "Members can view their org"
ON public.organizations FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = id AND user_id = auth.uid())
);

CREATE POLICY "Org owner can update"
ON public.organizations FOR UPDATE TO authenticated
USING (owner_id = auth.uid());

CREATE POLICY "Authenticated users can create orgs"
ON public.organizations FOR INSERT TO authenticated
WITH CHECK (owner_id = auth.uid());

-- RLS for organization_members
CREATE POLICY "Members can view org members"
ON public.organization_members FOR SELECT TO authenticated
USING (
  public.get_user_org_id(auth.uid()) = organization_id
);

CREATE POLICY "Org admin can add members"
ON public.organization_members FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.organizations WHERE id = organization_id AND owner_id = auth.uid())
);

CREATE POLICY "Org admin can remove members"
ON public.organization_members FOR DELETE TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.organizations WHERE id = organization_id AND owner_id = auth.uid())
);

CREATE POLICY "Org admin can update members"
ON public.organization_members FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.organizations WHERE id = organization_id AND owner_id = auth.uid())
);

-- Update profiles RLS: members of same org can view each other's profiles
CREATE POLICY "Org members can view each other profiles"
ON public.profiles FOR SELECT TO authenticated
USING (
  public.same_org(auth.uid(), user_id)
);

-- Update messages RLS: allow messaging within same org
-- (existing policies already allow sender/receiver, but contacts need to be visible)

-- Allow documents to be viewed by org members
CREATE POLICY "Org members can view org documents"
ON public.documents FOR SELECT TO authenticated
USING (
  public.same_org(auth.uid(), user_id)
);

-- Trigger for updated_at on organizations
CREATE TRIGGER update_organizations_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
