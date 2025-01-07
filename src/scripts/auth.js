const { createClient } = supabase;

const SUPABASE_URL = "https://uahuzgmrgblwebexpfhu.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhaHV6Z21yZ2Jsd2ViZXhwZmh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYwMDg4NTQsImV4cCI6MjA1MTU4NDg1NH0.fbnkRTaIXfO7m14P5bpBNUXt_OxseiP3y3EhWGABwBw";

const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Check if the user is already signed in when the page loads
window.onload = async function () {
  const {
    data: { session },
    error,
  } = await _supabase.auth.getSession();

  if (session) {
    // If user is already logged in, redirect to home page (index.html)
    window.location.href = "../index.html";
  } else {
    console.log("No active session");
  }
};

//signup user
async function signup() {
  const email = document.getElementById("signup-email").value;
  const password = document.getElementById("signup-password").value;

  const { data, error } = await _supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    document.getElementById(
      "message"
    ).textContent = `Signup Error: ${error.message}`;
  } else {
    // Make sure the data contains user information
    if (data && data.user) {
      // await createDefaultLists(data.user.id);
      document.getElementById(
        "message"
      ).textContent = `Signup Success: Welcome ${data.user.email}`;
      // Redirect to the home page after successful signup
      window.location.href = "../index.html";
    } else {
      document.getElementById("message").textContent =
        "Signup Success, but no user data returned";
    }
  }
}

//login user
async function login() {
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  const { data, error } = await _supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    document.getElementById(
      "message"
    ).textContent = `Login Error: ${error.message}`;
  } else {
    // Make sure the data contains user information
    if (data && data.user) {
      // await createDefaultLists(data.user.id);
      document.getElementById(
        "message"
      ).textContent = `Login Success: Welcome back ${data.user.email}`;
      console.log('User ID:', data.user.id); // Debug log

      // Redirect to the home page after successful login
      window.location.href = "../index.html";
    } else {
      document.getElementById("message").textContent =
        "Login Success, but no user data returned";
    }
  }
}

//create user lists
async function createDefaultLists(userId) {
  console.log('Creating default lists for user ID:', userId);  // Debug log

  const { data, error } = await _supabase.from('user_lists').upsert([
      { user_id: userId, list_name: 'Watched' },
      { user_id: userId, list_name: 'Watchlist' }
  ], { onConflict: ['user_id', 'list_name'] });  // Specify conflict resolution keys

  if (error) {
      console.error('Error creating default lists:', error.message);
  } else {
      console.log('Default lists created:', data);  // Debug log
  }
}


// Attach event listeners
document.getElementById("signup-btn").addEventListener("click", signup);
document.getElementById("login-btn").addEventListener("click", login);
