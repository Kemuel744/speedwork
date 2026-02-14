
-- Allow authenticated users to insert subscriptions only for themselves
CREATE POLICY "Users can create their own subscriptions"
ON public.subscriptions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
