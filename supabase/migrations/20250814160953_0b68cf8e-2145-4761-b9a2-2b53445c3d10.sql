-- Populate user_id_display for existing users based on created_at order
WITH numbered_users AS (
  SELECT 
    user_id,
    ROW_NUMBER() OVER (ORDER BY created_at ASC) as user_number
  FROM public.profiles 
  WHERE user_id_display IS NULL OR user_id_display = ''
)
UPDATE public.profiles 
SET user_id_display = 'USER' || LPAD(numbered_users.user_number::text, 3, '0')
FROM numbered_users 
WHERE profiles.user_id = numbered_users.user_id;