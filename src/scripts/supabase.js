const { createClient } = supabase;

const SUPABASE_URL = "https://uahuzgmrgblwebexpfhu.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhaHV6Z21yZ2Jsd2ViZXhwZmh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYwMDg4NTQsImV4cCI6MjA1MTU4NDg1NH0.fbnkRTaIXfO7m14P5bpBNUXt_OxseiP3y3EhWGABwBw";

// Initialize the Supabase client
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default _supabase;
