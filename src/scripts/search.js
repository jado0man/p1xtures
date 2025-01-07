const { createClient } = supabase;

const SUPABASE_URL = "https://uahuzgmrgblwebexpfhu.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhaHV6Z21yZ2Jsd2ViZXhwZmh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYwMDg4NTQsImV4cCI6MjA1MTU4NDg1NH0.fbnkRTaIXfO7m14P5bpBNUXt_OxseiP3y3EhWGABwBw";

// Initialize the Supabase client
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Fetch movie data from OMDB API
async function searchMovies(movieTitle) {
  const apiKey = "ac825a7";
  const url = `https://www.omdbapi.com/?s=${encodeURIComponent(
    movieTitle
  )}&apikey=${apiKey}`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.Response === "True") {
    // Return an array of movies
    return data.Search.map((movie) => ({
      title: movie.Title,
      year: movie.Year,
      poster: movie.Poster !== "N/A" ? movie.Poster : "",
      omdb_id: movie.imdbID,
      type: movie.Type,
    }));
  } else {
    console.error("No movies found:", data.Error);
    return [];
  }
}

// Fetch detailed movie data from OMDB by title
async function fetchMovieDetails(movieTitle) {
  const apiKey = "ac825a7"; // Replace with your OMDB API key
  const url = `https://www.omdbapi.com/?t=${encodeURIComponent(movieTitle)}&plot=full&apikey=${apiKey}`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.Response === "True") {
    return data;
  } else {
    console.error("Error fetching movie details:", data.Error);
    return null;
  }
}

async function addMovieToUserList(listName, movieData) {
  const user = await _supabase.auth.getUser();
  const userId = user.data?.user?.id;

  if (!userId) {
    showAlert("Error: User not logged in.", "danger");
    return;
  }

  // Prepare movie data for insertion
  const movieDataForDB = {
    title: movieData.title,
    year: movieData.year,
    poster: movieData.poster,
    omdb_id: movieData.omdb_id,
  };

  // Check if the movie exists in the 'movies' table
  const { data: existingMovies, error: movieCheckError } = await _supabase
    .from("movies")
    .select("id")
    .eq("omdb_id", movieData.omdb_id);

  if (movieCheckError) {
    showAlert(
      "Error checking movie existence: " + movieCheckError.message,
      "danger"
    );
    return;
  }

  let movieId;
  if (existingMovies && existingMovies.length > 0) {
    movieId = existingMovies[0].id;
  } else {
    // Insert the movie if it doesn't exist
    const { data: insertedMovie, error: insertError } = await _supabase
      .from("movies")
      .insert([movieDataForDB])
      .select();

    if (insertError) {
      showAlert("Error inserting movie: " + insertError.message, "danger");
      return;
    }

    movieId = insertedMovie[0].id;
  }

  // Check if the movie is already added to the user's list (To Watch or Watched)
  const { data: userLists, error: listCheckError } = await _supabase
    .from("user_lists")
    .select("id, list_name")
    .eq("user_id", userId)
    .eq("movie_id", movieId); // Check by movie_id, not omdb_id

  if (listCheckError) {
    showAlert(
      "Error checking movie in user list: " + listCheckError.message,
      "danger"
    );
    return;
  }

  if (userLists && userLists.length > 0) {
    const alreadyInList = userLists.map((item) => item.list_name).join(", ");
    showAlert(`Movie already in list(s): ${alreadyInList}`, "warning");
    return; // Don't add it again
  }

  // Add the movie to the user's list
  const { data, error } = await _supabase
    .from("user_lists")
    .upsert([{ user_id: userId, list_name: listName, movie_id: movieId }], {
      onConflict: ["user_id", "list_name", "movie_id"],
    });

  if (error) {
    showAlert(`Error adding movie to ${listName}: ${error.message}`, "danger");
  } else {
    showAlert(`Movie added to ${listName}!`, "success");
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

// Display search results
function displaySearchResults(movies) {
  const resultsContainer = document.getElementById("search-results");
  resultsContainer.innerHTML = ""; // Clear previous results

  if (movies.length === 0) {
    resultsContainer.innerHTML = `<p>No results found.</p>`;
    return;
  }

  movies.forEach((movie) => {
    const movieElement = document.createElement("div");
    movieElement.classList.add("movie", "col");
    movieElement.innerHTML = `
        <div class="justify-content-center my-2" style="width: 250px">
          <div role="button">
            <img class="rounded movie-poster" src="${movie.poster}" alt="${movie.title}" width="250" height="350"/>
            <div class="my-1">
              <p id="movieName" class="text-truncate fs-6 fw-semibold mb-1 movie-title">${movie.title}</p>
              <div class="d-flex justify-content-between">
                <p class="text-secondary fw-semibold lh-1 mb-1">${movie.year}</p>
                <p class="lh-1 mb-1 badge text-bg-dark">${movie.type}</p>
              </div>
            </div>
          </div>
            <button id="to-watch-btn-${movie.omdb_id}" class="btn btn-outline-warning rounded-0 mb-2" style="width: 250px">Add to To Watchlist</button>
            <button id="watched-btn-${movie.omdb_id}" class="btn btn-outline-success rounded-0" style="width: 250px">Add to Watched</button>
        </div>
    `;
    resultsContainer.appendChild(movieElement);

    // Add event listeners to buttons
    document
      .getElementById(`watched-btn-${movie.omdb_id}`)
      .addEventListener("click", async () => {
        await addMovieToUserList("Watched", movie);
      });

    document
      .getElementById(`to-watch-btn-${movie.omdb_id}`)
      .addEventListener("click", async () => {
        await addMovieToUserList("Watchlist", movie);
      });

    // Add event listener for image click (poster) to show movie details in modal
    movieElement.querySelector(".movie-poster").addEventListener("click", () => {
      displayMovieDetails(movie.title);
    });

    // Add event listener for title click to show movie details in modal
    movieElement.querySelector(".movie-title").addEventListener("click", () => {
      displayMovieDetails(movie.title);
    });
      
  });
}

// Show the movie details in the modal
function displayMovieDetails(movieTitle) {
  fetchMovieDetails(movieTitle).then((movie) => {
    if (movie) {
      // Populate the modal with movie details
      document.getElementById("modal-movie-poster").src = movie.Poster;
      document.getElementById("modal-movie-title").textContent = movie.Title;
      document.getElementById("modal-movie-year").textContent = `${movie.Year}`;
      document.getElementById("modal-movie-genre").textContent = `${movie.Genre}`;
      document.getElementById("modal-movie-plot").textContent = `${movie.Plot}`;
      document.getElementById("modal-movie-director").textContent = ` ${movie.Director}`;
      document.getElementById("modal-movie-actors").textContent = `${movie.Actors}`;
      document.getElementById("modal-movie-imdbRating").textContent = `${movie.imdbRating}`;
      document.getElementById("modal-movie-metascore").textContent = `${movie.Metascore}`;
      document.getElementById("modal-movie-rated").textContent = `${movie.Rated}`;
      document.getElementById("modal-movie-country").textContent = `${movie.Country}`;
      document.getElementById("modal-movie-released").textContent = `${movie.Released}`;
      document.getElementById("modal-movie-language").textContent = `${movie.Language}`;
      document.getElementById("modal-movie-runtime").textContent = `${movie.Runtime}`;

      // Show the modal
      const modal = new bootstrap.Modal(document.getElementById("movieModal"));
      modal.show();
    }
  });
}

// Search button click event
document.getElementById("search-btn").addEventListener("click", async () => {
  const movieTitle = document.getElementById("movie-title").value.trim();
  if (movieTitle) {
    const movies = await searchMovies(movieTitle);
    displaySearchResults(movies); // Display multiple results
  } else {
    alert("Please enter a movie title.");
  }
});
