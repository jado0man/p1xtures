const { createClient } = supabase;

const SUPABASE_URL = "https://uahuzgmrgblwebexpfhu.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhaHV6Z21yZ2Jsd2ViZXhwZmh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYwMDg4NTQsImV4cCI6MjA1MTU4NDg1NH0.fbnkRTaIXfO7m14P5bpBNUXt_OxseiP3y3EhWGABwBw";

const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Check if the user is logged in when the home page loads
window.onload = async function () {
    const {
      data: { session },
      error,
    } = await _supabase.auth.getSession();
  
    if (!session) {
        window.location.href = "pages/auth.html"; // Update this path if needed
    }
  };