import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://zpthhzhxqmffpfubojri.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwdGhoemh4cW1mZnBmdWJvanJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyNTY2OTAsImV4cCI6MjA2MTgzMjY5MH0.ICIAD3-dhRFV29vJeN8E4E8Lu8r5Bfd7YYFUR17zxIY";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
