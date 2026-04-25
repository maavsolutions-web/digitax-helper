ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS membership_number text;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  _role app_role;
begin
  insert into public.profiles (id, full_name, phone, firm_name, membership_number)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.phone,
    new.raw_user_meta_data->>'firm_name',
    new.raw_user_meta_data->>'membership_number'
  )
  on conflict (id) do nothing;

  _role := coalesce((new.raw_user_meta_data->>'role')::app_role, 'individual'::app_role);
  insert into public.user_roles (user_id, role)
  values (new.id, _role)
  on conflict do nothing;

  return new;
end;
$function$;