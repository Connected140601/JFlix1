// API Configuration
const API_KEY = '84549ba3644ea15176802ec153bd9442';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';
const BACKDROP_SIZE = '/original';
const POSTER_SIZE = '/w500';

// Global variables
let bannerAnime = []; // Changed from topRatedBannerAnime
let currentBannerAnimeIndex = 0;
let bannerRotationIntervalIdAnime;
const BANNER_ROTATION_DELAY_ANIME = 7000; // 7 seconds
let currentMediaType = 'tv';
let currentMediaId = null;
let searchTimeout = null;

// DOM Elements
const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
  initializePage();
});

// Initialize the page with Anime content
async function initializePage() {
  try {
    // Show loading indicators
    document.querySelectorAll('.list').forEach(list => {
      list.innerHTML = '<div class="loading-indicator"><div class="spinner"></div><p>Loading content...</p></div>';
    });
    
    // Initialize banner with a featured anime
    await initializeBanner();
    
    // Load Anime lists
    await Promise.all([
      loadAnimeMovies(),
      loadTopRatedAnime(),
      loadAiringAnime()
    ]);
  } catch (error) {
    console.error('Error initializing page:', error);
    document.querySelectorAll('.list').forEach(list => {
      list.innerHTML = '<div class="error-message">Failed to load content. Please try again later.</div>';
    });
  }
}

// Function to display a specific anime in the banner
function displayBannerAnime(animeIndex) {
  if (!bannerAnime || bannerAnime.length === 0) return;

  const anime = bannerAnime[animeIndex];
  const bannerElement = document.getElementById('banner');
  
  if (anime && anime.backdrop_path) {
    bannerElement.style.backgroundImage = `url('${IMAGE_BASE_URL}${BACKDROP_SIZE}${anime.backdrop_path}')`;
  } else {
    bannerElement.style.backgroundImage = 'linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6))'; 
  }
  bannerElement.dataset.id = anime.id;
  bannerElement.dataset.type = 'tv'; // Anime series are 'tv' type
  
  document.getElementById('banner-title').textContent = anime.name || 'Anime Title Unavailable';
  document.getElementById('banner-overview').textContent = anime.overview ? (anime.overview.length > 200 ? anime.overview.substring(0, 200) + '...' : anime.overview) : 'Overview not available.';
}

// Function to rotate to the next banner anime
function rotateBannerAnime() {
  currentBannerAnimeIndex++;
  if (currentBannerAnimeIndex >= bannerAnime.length) {
    currentBannerAnimeIndex = 0;
  }
  displayBannerAnime(currentBannerAnimeIndex);
}

// Initialize the banner with a rotating display of currently airing anime series
async function initializeBanner() {
  try {
    let airingAnime = [];
    let page = 1;
    const maxPages = 5; // Limit to prevent infinite loops

    while (airingAnime.length < 10 && page <= maxPages) {
        const data = await fetchFromTMDB('tv/on_the_air', { page });
        
        if (!data.results || data.results.length === 0) {
            break; // No more results
        }

                const animeInPage = data.results.filter(show => show.genre_ids.includes(16) && show.original_language === 'ja');
        airingAnime.push(...animeInPage);
        
        page++;
    }

    // Sort by popularity
    airingAnime.sort((a, b) => b.popularity - a.popularity);

    if (airingAnime.length === 0) {
      console.error('No currently airing anime series found for banner');
      // Fallback display
      const bannerElement = document.getElementById('banner');
      bannerElement.style.backgroundImage = 'linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6))';
      document.getElementById('banner-title').textContent = 'Welcome to JFlix Anime';
      document.getElementById('banner-overview').textContent = 'Explore the best anime from Japan and around the world.';
      return;
    }

    bannerAnime = airingAnime.slice(0, 10); // Take top 10 for rotation

    if (bannerAnime.length > 0) {
      currentBannerAnimeIndex = 0;
      displayBannerAnime(currentBannerAnimeIndex);
      
      if (bannerRotationIntervalIdAnime) {
        clearInterval(bannerRotationIntervalIdAnime);
      }
      bannerRotationIntervalIdAnime = setInterval(rotateBannerAnime, BANNER_ROTATION_DELAY_ANIME);
    } else {
      // Fallback if, after slicing, no anime are available
      const bannerElement = document.getElementById('banner');
      bannerElement.style.backgroundImage = 'linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6))';
      document.getElementById('banner-title').textContent = 'Welcome to JFlix Anime';
      document.getElementById('banner-overview').textContent = 'Explore the best anime from Japan and around the world.';
    }
  } catch (error) {
    console.error('Error initializing banner:', error);
    const bannerElement = document.getElementById('banner');
    bannerElement.style.backgroundImage = 'linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6))';
    document.getElementById('banner-title').textContent = 'Welcome to JFlix Anime';
    document.getElementById('banner-overview').textContent = 'Explore the best anime from Japan and around the world.';
  }
}

// Load anime movies
async function loadAnimeMovies() {
  try {
    const data = await fetchFromTMDB('discover/movie', { 
      with_genres: 16,
      with_original_language: 'ja', // Japanese language
      sort_by: 'popularity.desc',
      page: 1,
      'vote_count.gte': 50 // Ensure we get movies with a significant number of votes
    });
    // Clearly mark these as movies for display purposes
    displayList(data.results.map(item => ({ ...item, mediaType: 'movie', isAnimeMovie: true })), 'anime-movies-list');
  } catch (error) {
    console.error('Error loading anime movies:', error);
    document.getElementById('anime-movies-list').innerHTML = '<div class="error-message">Failed to load anime movies.</div>';
  }
}

// Load top rated anime
async function loadTopRatedAnime() {
  try {
    // Fetch top-rated anime series from TMDB
    const data = await fetchFromTMDB('discover/tv', {
      with_genres: 16, // Animation genre
      with_original_language: 'ja', // Japanese language
      sort_by: 'vote_average.desc',
      'vote_count.gte': 1000, // High vote count for quality
      page: 1
    });

    // Filter out any results that are not anime (e.g., if API returns other genres)
    const animeResults = data.results.filter(item => item.genre_ids.includes(16));

    // Sort by rating in descending order
    const sortedResults = animeResults.sort((a, b) => b.vote_average - a.vote_average);

    // Take the top 10
    const top10 = sortedResults.slice(0, 10);

    displayList(top10, 'top-rated-list');
  } catch (error) {
    console.error('Error loading top rated anime:', error);
    document.getElementById('top-rated-list').innerHTML = '<div class="error-message">Failed to load top rated anime.</div>';
  }
}

// Load airing anime
async function loadAiringAnime() {
  try {
    const today = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(today.getFullYear() - 1);

    const formatDate = (date) => date.toISOString().split('T')[0];

    const data = await fetchFromTMDB('discover/tv', {
      with_genres: 16, // Animation
      with_original_language: 'ja',
      'first_air_date.gte': formatDate(oneYearAgo),
      'first_air_date.lte': formatDate(today),
      sort_by: 'popularity.desc',
    });

    displayList(data.results, 'airing-list');
  } catch (error) {
    console.error('Error loading airing anime:', error);
    document.getElementById('airing-list').innerHTML = '<div class="error-message">Failed to load airing anime.</div>';
  }
}

// Fetch data from TMDB API
async function fetchFromTMDB(endpoint, params = {}) {
  const url = new URL(`${BASE_URL}/${endpoint}`);
  url.searchParams.append('api_key', API_KEY);
  Object.entries(params).forEach(([key, value]) => {
    if (value) { // Ensure value is not null or undefined
      url.searchParams.append(key, value);
    }
  });

  try {
    const response = await fetch(url);
    if (!response.ok) {
      let errorBody;
      try {
        errorBody = await response.json();
      } catch (e) {
        errorBody = { status_message: await response.text() };
      }
      const errorMessage = `API request to ${endpoint} failed with status ${response.status}: ${errorBody.status_message || 'No error message from API.'}`;
      throw new Error(errorMessage);
    }
    return await response.json();
  } catch (error) {
    // Re-throw the error to be caught by the calling function, which will now have more details.
    throw error;
  }
}

// Display a list of media items
function displayList(items, containerId) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn(`Container with ID '${containerId}' not found.`);
    return;
  }

  if (items.length === 0) {
    container.innerHTML = '<p>No items to display.</p>';
    return;
  }

  container.innerHTML = ''; // Clear previous content
  items.forEach(item => {
    const card = createMediaCard(item);
    container.appendChild(card);
  });
}

// Create a media card
function createMediaCard(item) {
  const isAnimeMovie = item.isAnimeMovie || false;
  const title = isAnimeMovie ? item.title : item.name;
  const year = isAnimeMovie 
    ? (item.release_date ? item.release_date.substring(0, 4) : 'N/A') 
    : (item.first_air_date ? item.first_air_date.substring(0, 4) : 'N/A');
  const rating = item.vote_average ? (item.vote_average / 2).toFixed(1) : 'N/A'; // Convert to 5-star rating
  const posterPath = item.poster_path ? `${IMAGE_BASE_URL}${POSTER_SIZE}${item.poster_path}` : 'images/poster-placeholder.png';
  const mediaType = isAnimeMovie ? 'movie' : 'tv';

  const card = document.createElement('div');
  card.className = 'media-card';
  card.innerHTML = `
    <div class="card-poster-container">
      <img class="card-poster" src="${posterPath}" alt="${title}">
      <div class="card-overlay">
        <div class="card-buttons">
          <button class="btn watch-btn" onclick="watchMedia(${item.id}, '${mediaType}')"><i class="fas fa-play"></i> Watch</button>
          <button class="btn details-btn" onclick="viewMediaDetails(${item.id}, '${mediaType}')"><i class="fas fa-info-circle"></i> Details</button>
        </div>
      </div>
    </div>
    <div class="card-info">
      <h3 class="card-title">${title}</h3>
      <div class="card-rating">${'★'.repeat(Math.round(rating / 2))}${'☆'.repeat(5 - Math.round(rating / 2))}</div>
      <p class="card-year">${year}</p>
      ${isAnimeMovie 
        ? '<span class="series-badge anime-badge">ANIME MOVIE</span>' 
        : '<span class="series-badge anime-badge">ANIME SERIES</span>'}
    </div>
  `;

  return card;
}

// Watch an anime
function watchMedia(id, type) {
  window.location.href = `player.html?id=${id}&type=${type}`;
}

// View anime details
function viewMediaDetails(id, type) {
  window.location.href = `details.html?id=${id}&type=${type}`;
}

// Watch featured anime
function watchFeatured() {
  const bannerElement = document.getElementById('banner');
  const id = bannerElement.dataset.id;
  const type = bannerElement.dataset.type;
  if (id && type) {
    watchMedia(id, type);
  }
}

// Show featured anime details
function showFeaturedDetails() {
  const bannerElement = document.getElementById('banner');
  const id = bannerElement.dataset.id;
  const type = bannerElement.dataset.type;
  if (id && type) {
    viewMediaDetails(id, type);
  }
}




