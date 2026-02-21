-- Create User Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    google_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    access_token TEXT,
    refresh_token TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Index for Users
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create Calendar Extraction Table
CREATE TABLE IF NOT EXISTS calendar_extractions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    year INTEGER NOT NULL CHECK (year >= 2020),
    extracted_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Index for Calendar Extractions
CREATE INDEX IF NOT EXISTS idx_calendar_extractions_user_id ON calendar_extractions(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_extractions_month_year ON calendar_extractions(month, year);

-- Create Authentication Sessions Table
CREATE TABLE IF NOT EXISTS auth_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Index for Auth Sessions
CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON auth_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_session_token ON auth_sessions(session_token);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_sessions ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT SELECT ON users TO anon;
GRANT ALL ON users TO authenticated;
GRANT SELECT ON calendar_extractions TO anon;
GRANT ALL ON calendar_extractions TO authenticated;
GRANT SELECT ON auth_sessions TO anon;
GRANT ALL ON auth_sessions TO authenticated;

-- Create policies (Note: strict RLS might need adjustment depending on how we handle auth server-side, 
-- but for now we follow the design. Since we are using custom auth flow with google tokens stored in DB, 
-- we might access DB with service role key in API routes mostly).

-- For now, allow service role full access (implicit) and basic policies.
-- We will refine these if we use Supabase Auth UI, but the PRD suggests custom Google OAuth flow storing tokens.
