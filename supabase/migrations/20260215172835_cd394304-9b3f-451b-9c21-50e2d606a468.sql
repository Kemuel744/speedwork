
-- Fix overly permissive INSERT policy: only allow users to insert their own notifications
DROP POLICY "Service can insert notifications" ON public.notifications;

CREATE POLICY "Users can insert own notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
