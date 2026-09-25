-- KOLABA CLOUD AI - Engineering Colleges Survey Schema
-- Run this SQL in your Supabase SQL Editor to set up the database

CREATE TABLE IF NOT EXISTS public.survey_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    respondent_type TEXT NOT NULL CHECK (respondent_type IN ('student', 'faculty', 'tpo', 'admin')),
    respondent_type_label TEXT NOT NULL,
    respondent_name TEXT NOT NULL,
    college TEXT NOT NULL,
    department TEXT,
    role TEXT,
    email TEXT NOT NULL,
    phone TEXT,
    answers JSONB NOT NULL DEFAULT '{}'::jsonb,
    survey_path JSONB NOT NULL DEFAULT '[]'::jsonb,
    pilot_interest TEXT,
    consent BOOLEAN NOT NULL DEFAULT true,
    time_spent_seconds INTEGER,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexing for fast search and aggregation
CREATE INDEX IF NOT EXISTS idx_survey_responses_type ON public.survey_responses (respondent_type);
CREATE INDEX IF NOT EXISTS idx_survey_responses_created_at ON public.survey_responses (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_survey_responses_college ON public.survey_responses (college);
CREATE INDEX IF NOT EXISTS idx_survey_responses_email ON public.survey_responses (email);

-- Enable Row Level Security (RLS)
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;

-- Allow public anonymous insert for survey submissions
CREATE POLICY "Allow public survey submissions" 
ON public.survey_responses
FOR INSERT 
WITH CHECK (true);

-- Allow authenticated admins to view and read all responses
CREATE POLICY "Allow authenticated admins to read responses" 
ON public.survey_responses 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Allow authenticated admins to delete responses if needed
CREATE POLICY "Allow authenticated admins to delete responses" 
ON public.survey_responses 
FOR DELETE 
USING (auth.role() = 'authenticated');
