-- Update profiles table to include firstName, lastName and userID
ALTER TABLE public.profiles ADD COLUMN first_name text;
ALTER TABLE public.profiles ADD COLUMN last_name text;
ALTER TABLE public.profiles ADD COLUMN user_id_display text UNIQUE;

-- Update the handle_new_user function to generate unique user IDs
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  next_user_number integer;
  new_user_id text;
BEGIN
  -- Get the next user number by finding the highest existing user ID number
  SELECT COALESCE(
    MAX(CAST(SUBSTRING(user_id_display FROM 7) AS integer)), 0
  ) + 1 
  INTO next_user_number
  FROM public.profiles 
  WHERE user_id_display ~ '^client[0-9]+$';
  
  -- Generate the new user ID in format client1, client2, etc.
  new_user_id := 'client' || next_user_number;
  
  INSERT INTO public.profiles (
    user_id, 
    full_name, 
    first_name,
    last_name,
    phone_number, 
    country_code, 
    withdrawal_password_hash,
    user_id_display
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'phone_number', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'country_code', '+1'),
    NULLIF(NEW.raw_user_meta_data ->> 'withdrawal_password_hash', ''),
    new_user_id
  );
  RETURN NEW;
END;
$function$;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();