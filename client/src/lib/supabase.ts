import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ayvifxoevtshlqzdnvaj.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5dmlmeG9ldnRzaGxxemRudmFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0NjU1MjIsImV4cCI6MjEwNzA0MTUyMn0.EPqVjJ2zorZcWprYJwDZpF-0XMy29jjhwXxeULQVd58';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
