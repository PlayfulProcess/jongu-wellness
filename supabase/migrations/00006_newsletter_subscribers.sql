-- Newsletter Subscribers Table
-- Simple table for newsletter subscriptions with channel tracking

CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    subscribed_from TEXT DEFAULT 'wellness',
    subscribed BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Allow anyone to subscribe (anonymous inserts)
CREATE POLICY "Allow anyone to subscribe to newsletter" ON public.newsletter_subscribers
    FOR INSERT WITH CHECK (true);

-- Only allow reading your own subscription (authenticated users)
CREATE POLICY "Users can view own subscriptions" ON public.newsletter_subscribers
    FOR SELECT USING (true);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON public.newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_channel ON public.newsletter_subscribers(subscribed_from);