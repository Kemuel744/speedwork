-- Allow authenticated users to view admin profiles (needed for messaging)
CREATE POLICY "Users can view admin profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = profiles.user_id
    AND user_roles.role = 'admin'
  )
);
