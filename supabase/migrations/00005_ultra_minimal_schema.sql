-- Ultra Minimal Schema Migration
-- This ensures the tables exist and are compatible with the new newsletter system

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE,
    username TEXT UNIQUE,
    profile_data JSONB DEFAULT '{
        "display_name": null,
        "avatar_url": null,
        "bio": null,
        "is_creator": false,
        "is_anonymous": true,
        "stripe_customer_id": null,
        "preferences": {},
        "stats": {"sessions": 0, "donations_given": 0}
    }',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_documents table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    document_type TEXT CHECK (document_type IN (
        'tool_session',
        'creative_work',
        'preference',
        'bookmark',
        'interaction',
        'transaction'
    )),
    document_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_documents_user_id ON public.user_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_documents_type ON public.user_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_user_documents_preferences ON public.user_documents((document_data->>'preference_type')) WHERE document_type = 'preference';
CREATE INDEX IF NOT EXISTS idx_user_documents_interactions ON public.user_documents((document_data->>'interaction_type')) WHERE document_type = 'interaction';

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own documents" ON public.user_documents;
DROP POLICY IF EXISTS "Users can insert own documents" ON public.user_documents;
DROP POLICY IF EXISTS "Users can update own documents" ON public.user_documents;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (true);

-- User documents policies
CREATE POLICY "Users can view own documents" ON public.user_documents
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own documents" ON public.user_documents
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own documents" ON public.user_documents
    FOR UPDATE USING (user_id = auth.uid());

-- Allow anonymous inserts for newsletter subscriptions
CREATE POLICY "Allow anonymous newsletter subscriptions" ON public.profiles
    FOR INSERT TO anon
    WITH CHECK (true);

CREATE POLICY "Allow anonymous preference documents" ON public.user_documents
    FOR INSERT TO anon
    WITH CHECK (document_type = 'preference');

-- Updated at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_user_documents_updated_at ON public.user_documents;

-- Create triggers
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_documents_updated_at
    BEFORE UPDATE ON public.user_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();