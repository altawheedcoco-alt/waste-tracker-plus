-- Harden organization_auto_actions access check to handle active organization + member access reliably
create or replace function public.can_access_organization_auto_actions(_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and (
        p.organization_id = _organization_id
        or p.active_organization_id = _organization_id
      )
  )
  or exists (
    select 1
    from public.organization_members m
    where m.user_id = auth.uid()
      and m.organization_id = _organization_id
      and coalesce(m.status, 'active') in ('active', 'approved', 'pending_invitation')
  )
  or public.has_role(auth.uid(), 'admin'::public.app_role);
$$;

-- Recreate policies using the security-definer helper (avoids dependency on profiles RLS visibility)
drop policy if exists "Org members can read auto actions" on public.organization_auto_actions;
drop policy if exists "Org members can update auto actions" on public.organization_auto_actions;
drop policy if exists "Org members can insert auto actions" on public.organization_auto_actions;

create policy "Org members can read auto actions"
on public.organization_auto_actions
for select
to authenticated
using (public.can_access_organization_auto_actions(organization_id));

create policy "Org members can update auto actions"
on public.organization_auto_actions
for update
to authenticated
using (public.can_access_organization_auto_actions(organization_id))
with check (public.can_access_organization_auto_actions(organization_id));

create policy "Org members can insert auto actions"
on public.organization_auto_actions
for insert
to authenticated
with check (public.can_access_organization_auto_actions(organization_id));