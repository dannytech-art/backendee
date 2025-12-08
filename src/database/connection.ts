import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://pwcmyidxdyetvyiuosnm.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3Y215aWR4ZHlldHZ5aXVvc25tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwMjkxOTMsImV4cCI6MjA4MDYwNTE5M30.-_DpZ1DVKjakar7wqFrE4LqcIXleU5jNY0RJdXthuW4';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️  Supabase environment variables not fully set. Using defaults.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// For admin operations, use service role key if available
export const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(
      supabaseUrl,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )
  : supabase;
