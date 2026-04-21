-- Update handle_new_user to also assign role from signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  _role app_role;
begin
  insert into public.profiles (id, full_name, phone, firm_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.phone,
    new.raw_user_meta_data->>'firm_name'
  )
  on conflict (id) do nothing;

  -- Assign role from signup metadata; default to 'individual'
  _role := coalesce((new.raw_user_meta_data->>'role')::app_role, 'individual'::app_role);
  insert into public.user_roles (user_id, role)
  values (new.id, _role)
  on conflict do nothing;

  return new;
end;
$function$;

-- Attach the trigger on auth.users (Supabase allows this specific pattern)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill: ensure the existing CA signup gets the 'ca' role
INSERT INTO public.user_roles (user_id, role)
SELECT '73c71fbb-b420-49c8-8a52-c9bfb4490d9e'::uuid, 'ca'::app_role
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles
  WHERE user_id = '73c71fbb-b420-49c8-8a52-c9bfb4490d9e'::uuid AND role = 'ca'::app_role
);