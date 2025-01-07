const { createClient } = supabase;

const SUPABASE_URL = "https://uahuzgmrgblwebexpfhu.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhaHV6Z21yZ2Jsd2ViZXhwZmh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYwMDg4NTQsImV4cCI6MjA1MTU4NDg1NH0.fbnkRTaIXfO7m14P5bpBNUXt_OxseiP3y3EhWGABwBw";

const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Fetch and display user lists
async function loadUserLists() {
  const user = await _supabase.auth.getUser();
  const userId = user.data.user.id; // Ensure this is correct
  console.log("Logged-in User ID:", userId);

  const { data, error } = await _supabase
    .from("user_lists")
    .select(
      `
            list_name,
            movie_id,
            movies (
                title,
                year,
                poster,
                omdb_id
            )
        `
    )
    .eq("user_id", userId) // This expects a valid UUID string
    .not("movie_id", "is", null); // Only include rows with valid movie_id

  if (error) {
    console.error("Error fetching lists:", error.message);
    return;
  }

  displayLists(data); // Call displayLists to render the data
}

// Display the user's lists and movies
function displayLists(lists) {
  const watchlistContainer = document.getElementById("watchlist-container");
  const watchedContainer = document.getElementById("watched-container");

  watchlistContainer.innerHTML = ""; // Clear previous content
  watchedContainer.innerHTML = ""; // Clear previous content

  const groupedLists = lists.reduce((acc, item) => {
    const { list_name, movie_id, movies } = item;

    if (movie_id && movies) {
      if (!acc[list_name]) acc[list_name] = [];
      acc[list_name].push(movies);
    }

    return acc;
  }, {});

  //movie counts
  let totalWatchlist = 0;
  let totalWatched = 0;

  // Populate watchlist tab
  if (groupedLists["Watchlist"]) {
    totalWatchlist = groupedLists["Watchlist"].length;
    groupedLists["Watchlist"].forEach((movie) => {
      const movieElement = document.createElement("div");
      movieElement.classList.add("movie", "my-3", "col");
      movieElement.innerHTML = `
        <div class="justify-content-center my-2" style="width: 250px">
          <img class="rounded movie-poster" src="${movie.poster}" alt="${movie.title}"  width="250" height="350" />
            <div class="mt-2" role="button">
              <p id="movieName" class="text-truncate fs-6 fw-semibold mb-1 movie-title" data-bs-toggle="tooltip" title="${movie.title}">${movie.title}</p>
              <div class="d-flex justify-content-between">
                <p class="text-secondary fw-semibold lh-1 mb-1">${movie.year}</p>
              </div>
            </div>
            <div class="d-flex justify-content-between mt-2">
              <button class="btn btn-outline-success btn-sm fw-semibold rounded-0" onclick="moveMovie('${movie.omdb_id}', 'Watchlist', 'Watched')">
                <i class="bi-check-circle-fill me-2"></i>Mark as Watched
              </button>  
              <button class="btn btn-outline-danger btn-sm fw-semibold rounded-0" onclick="removeMovie('${movie.omdb_id}', 'Watchlist')">
                <i class="bi-x-circle-fill me-2"></i>Remove
              </button>
            </div>
        </div>
      `;
      watchlistContainer.appendChild(movieElement);
    });
  } else {
    watchlistContainer.innerHTML = "<p>No movies in your Watchlist.</p>";
  }

  // Populate watched tab
  if (groupedLists["Watched"]) {
    totalWatched = groupedLists["Watched"].length;
    groupedLists["Watched"].forEach((movie) => {
      const movieElement = document.createElement("div");
      movieElement.classList.add("movie", "my-3");
      movieElement.innerHTML = `
        <div class="justify-content-center my-2" style="width: 250px">
          <img class="rounded movie-poster" src="${movie.poster}" alt="${movie.title}"  width="250" height="350" />
            <div class="mt-2" role="button">
              <p id="movieName" class="text-truncate fs-6 fw-semibold mb-1 movie-title" data-bs-toggle="tooltip" title="${movie.title}">${movie.title}</p>
              <div class="d-flex justify-content-between">
                <p class="text-secondary fw-semibold lh-1 mb-1">${movie.year}</p>
              </div>
            </div>
            <div class="d-flex justify-content-between mt-2">
              <button class="btn btn-outline-warning btn-sm rounded-0" onclick="moveMovie('${movie.omdb_id}', 'Watched', 'Watchlist')">
                <i class="bi-arrow-counterclockwise me-2"></i>Move to Watchlist
              </button>
              <button class="btn btn-outline-danger btn-sm rounded-0" onclick="removeMovie('${movie.omdb_id}', 'Watched')">
                <i class="bi-x-circle-fill me-2"></i>Remove
              </button>
            </div>  
          </div>
      `;
      watchedContainer.appendChild(movieElement);
    });
  } else {
    watchedContainer.innerHTML = "<p>No movies in your Watched list.</p>";
  }
  
  //display movie totals
  const totalMovies = totalWatchlist + totalWatched;
  const movieCount = document.getElementById("movies-count");
  movieCount.innerHTML = `${totalMovies} Titles`
  const watchlistCount = document.getElementById("watchlist-count");
  watchlistCount.innerHTML = ` ( ${totalWatchlist} )`
  const watchedCount = document.getElementById("watched-count");
  watchedCount.innerHTML = ` ( ${totalWatched} )`

  //tooltip config
  const tooltipTriggerList = [].slice.call(
    document.querySelectorAll('[data-bs-toggle="tooltip"]')
  );
  tooltipTriggerList.forEach((tooltipTriggerEl) => {
    new bootstrap.Tooltip(tooltipTriggerEl);
  });
}

// Remove a movie from a list
async function removeMovie(omdbId, listName) {
  const user = (await _supabase.auth.getUser()).data.user;
  if (!user) {
    alert("Please log in.");
    return;
  }

  const userId = user.id;

  // Fetch movie ID from `movies` table using OMDB ID
  const { data: movie, error: movieError } = await _supabase
    .from("movies")
    .select("id")
    .eq("omdb_id", omdbId)
    .single();

  if (movieError) {
    console.error("Error fetching movie:", movieError.message);
    return;
  }

  // Remove the movie from the user's list
  const { error: removeError } = await _supabase
    .from("user_lists")
    .delete()
    .eq("user_id", userId)
    .eq("movie_id", movie.id)
    .eq("list_name", listName);

  if (removeError) {
    console.error("Error removing movie:", removeError.message);
  } else {
    showAlert(`Movie removed from "${listName}"`, "danger");
    loadUserLists(); // Reload lists
  }
}

async function moveMovie(omdbId, currentList, targetList) {
  const user = (await _supabase.auth.getUser()).data.user;
  if (!user) {
    alert("Please log in.");
    return;
  }

  const userId = user.id;

  // Fetch movie ID from `movies` table using OMDB ID
  const { data: movie, error: movieError } = await _supabase
    .from("movies")
    .select("id")
    .eq("omdb_id", omdbId)
    .single();

  if (movieError) {
    console.error("Error fetching movie:", movieError.message);
    return;
  }

  // Update the list_name for the movie in the `user_lists` table
  const { error: moveError } = await _supabase
    .from("user_lists")
    .update({ list_name: targetList })
    .eq("user_id", userId)
    .eq("movie_id", movie.id)
    .eq("list_name", currentList);

  if (moveError) {
    console.error("Error moving movie:", moveError.message);
  } else {
    showAlert(`Movie moved to "${targetList}"`, "success");
    loadUserLists(); // Reload lists
  }
}

// Helper function to show alerts
function showAlert(message, type) {
  const alert = document.getElementById("alerts");
  alert.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
  `;
}

// Load lists when the page loads
window.onload = loadUserLists;
