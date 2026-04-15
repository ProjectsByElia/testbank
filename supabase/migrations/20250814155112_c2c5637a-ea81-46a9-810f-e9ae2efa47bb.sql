-- Update the handle_new_user function to generate USER001, USER002, etc.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  next_user_number integer;
  new_user_id text;
BEGIN
  -- Get the next user number by finding the highest existing user ID number
  SELECT COALESCE(
    MAX(CAST(SUBSTRING(user_id_display FROM 5) AS integer)), 0
  ) + 1 
  INTO next_user_number
  FROM public.profiles 
  WHERE user_id_display ~ '^USER[0-9]+$';
  
  -- Generate the new user ID in format USER001, USER002, etc.
  new_user_id := 'USER' || LPAD(next_user_number::text, 3, '0');
  
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

-- Update existing user_id_display values from client format to USER format
UPDATE public.profiles 
SET user_id_display = 'USER' || LPAD(
  CAST(SUBSTRING(user_id_display FROM 7) AS text), 3, '0'
)
WHERE user_id_display ~ '^client[0-9]+$';