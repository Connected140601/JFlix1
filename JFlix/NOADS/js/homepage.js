// API Configuration
const API_KEY = '84549ba3644ea15176802ec153bd9442';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';
const BACKDROP_SIZE = '/original';
const POSTER_SIZE = '/w500';

// Global variables
let currentMediaType = '';
let currentMediaId = null;
let searchTimeout = null;

// Global variables for banner rotation
let bannerItems = [];
let currentBannerIndex = 0;
let bannerIntervalId = null;
const BANNER_ROTATION_INTERVAL = 7000; // 7 seconds

// DOM Elements
const searchInput = document.getElementById('search-input');
const navbarSearch = document.getElementById('navbar-search');
const searchResults = document.getElementById('search-results');
const searchModal = document.getElementById('search-modal');
const modal = document.getElementById('modal');
// Featured slider has been removed
const featuredSlider = null; // Set to null instead of trying to find the element
const trendingGrid = document.getElementById('trending-grid');

// Homepage Banner Elements
const homepageBanner = document.getElementById('homepage-banner');
const homepageBannerTitle = document.getElementById('homepage-banner-title');
const homepageBannerOverview = document.getElementById('homepage-banner-overview');

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
  initializePage();
  initializeFilterButtons();
});

// Initialize the page with content
async function initializePage() {
  try {
    // Featured content section has been removed
    
    // Load trending content
    await loadTrendingContent();
    
    // Load homepage banner content
    await loadHomepageBannerContent();

    // Add event listeners
    addEventListeners();
  } catch (error) {
    console.error('Error initializing page:', error);
  }
}

// Initialize filter buttons for search
function initializeFilterButtons() {
  const filterButtons = document.querySelectorAll('.search-filters .filter-btn');
  
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all buttons
      filterButtons.forEach(btn => btn.classList.remove('active'));
      
      // Add active class to clicked button
      button.classList.add('active');
      
      // If there's a search query, re-run the search
      if (searchInput.value.trim().length >= 2) {
        searchTMDB();
      }
    });
  });
}

// Load trending content
async function loadTrendingContent() {
  try {
    trendingGrid.innerHTML = '<div class="loading-indicator"><div class="spinner"></div><p>Loading trending content...</p></div>';
    
    // Get trending content
    const trendingData = await fetchFromTMDB('trending/all/week');
    
    // Clear loading indicator
    trendingGrid.innerHTML = '';
    
    // Display trending items
    if (trendingData.results && trendingData.results.length > 0) {
      // Take top 12 items
      trendingData.results.slice(0, 12).forEach(item => {
        if (item.poster_path) {
          const trendingItem = createTrendingItem(item);
          trendingGrid.appendChild(trendingItem);
        }
      });
    } else {
      trendingGrid.innerHTML = '<div class="no-content">No trending content available</div>';
    }
  } catch (error) {
    console.error('Error loading trending content:', error);
    trendingGrid.innerHTML = '<div class="error-message">Failed to load trending content. Please try again later.</div>';
  }
}

// Create a trending item
function createTrendingItem(item) {
  // Clone the template
  const template = document.getElementById('trending-item-template');
  const trendingItem = template.content.cloneNode(true);
  
  // Determine type and title
  const type = item.media_type || (item.first_air_date ? 'tv' : 'movie');
  const title = type === 'movie' ? item.title : item.name;
  
  // Set poster image
  const posterUrl = `${IMAGE_BASE_URL}${POSTER_SIZE}${item.poster_path}`;
  trendingItem.querySelector('.trending-poster').src = posterUrl;
  trendingItem.querySelector('.trending-poster').alt = title;
  
  // Set badge
  const badge = trendingItem.querySelector('.trending-badge');
  let badgeText = '';
  
  if (type === 'movie') {
    badgeText = 'Movie';
    badge.classList.add('movies');
  } else if (type === 'tv') {
    // Check if it's anime or Korean
    if (item.original_language === 'ja') {
      badgeText = 'Anime';
      badge.classList.add('anime');
    } else if (item.original_language === 'ko') {
      badgeText = 'K-Drama';
      badge.classList.add('korean');
    } else {
      badgeText = 'TV';
      badge.classList.add('tvshows');
    }
  }
  
  badge.textContent = badgeText;
  
  // Set title
  trendingItem.querySelector('.trending-title').textContent = title;
  
  // Set year
  const releaseDate = type === 'movie' ? item.release_date : item.first_air_date;
  if (releaseDate) {
    const year = new Date(releaseDate).getFullYear();
    trendingItem.querySelector('.trending-year').textContent = year;
  } else {
    trendingItem.querySelector('.trending-year').textContent = 'Unknown';
  }
  
  // Set rating
  const rating = Math.round(item.vote_average * 10) / 10;
  trendingItem.querySelector('.trending-rating').textContent = `${rating}/10`;
  
  // Add event listeners
  const watchBtn = trendingItem.querySelector('.watch-btn');
  watchBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const badgeText = badge.textContent;
    const actualType = getActualMediaType(type, badgeText);
    window.location.href = `player.html?id=${item.id}&type=${actualType}&source=homepage`;
  });
  
  const detailsBtn = trendingItem.querySelector('.details-btn');
  detailsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const badgeText = badge.textContent;
    const actualType = getActualMediaType(type, badgeText);
    window.location.href = `details.html?id=${item.id}&type=${actualType}&source=homepage`;
  });
  
  // Make the entire item clickable to show quick view
  const trendingElement = trendingItem.querySelector('.trending-item');
  trendingElement.addEventListener('click', () => {
    const badgeText = badge.textContent;
    const actualType = getActualMediaType(type, badgeText);
    showQuickView(item.id, actualType);
  });
  
  return trendingItem;
}

// Get badge class based on type and badge text
function getBadgeClass(type, badge) {
  if (type === 'movie') return 'movies';
  if (badge === 'TV Shows') return 'tvshows';
  if (badge === 'Anime') return 'anime';
  if (badge === 'Korean TV') return 'korean';
  return '';
}

// Get actual media type for API calls
function getActualMediaType(type, badge) {
  if (type === 'movie') return 'movie';
  if (badge === 'Anime') return 'anime';
  if (badge === 'Korean TV') return 'korean';
  return 'tv';
}

// Get genre name from genre ID
function getGenreName(genreId, type) {
  const movieGenres = {
    28: 'Action',
    12: 'Adventure',
    16: 'Animation',
    35: 'Comedy',
    80: 'Crime',
    99: 'Documentary',
    18: 'Drama',
    10751: 'Family',
    14: 'Fantasy',
    36: 'History',
    27: 'Horror',
    10402: 'Music',
    9648: 'Mystery',
    10749: 'Romance',
    878: 'Science Fiction',
    10770: 'TV Movie',
    53: 'Thriller',
    10752: 'War',
    37: 'Western'
  };
  
  const tvGenres = {
    10759: 'Action & Adventure',
    16: 'Animation',
    35: 'Comedy',
    80: 'Crime',
    99: 'Documentary',
    18: 'Drama',
    10751: 'Family',
    10762: 'Kids',
    9648: 'Mystery',
    10763: 'News',
    10764: 'Reality',
    10765: 'Sci-Fi & Fantasy',
    10766: 'Soap',
    10767: 'Talk',
    10768: 'War & Politics',
    37: 'Western'
  };
  
  const genres = type === 'movie' ? movieGenres : tvGenres;
  return genres[genreId] || 'Unknown';
}

// Add event listeners
function addEventListeners() {
  // Newsletter form submission
  const newsletterForm = document.querySelector('.newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const emailInput = newsletterForm.querySelector('input[type="email"]');
      if (emailInput && emailInput.value) {
        alert(`Thank you for subscribing with ${emailInput.value}!`);
        emailInput.value = '';
      }
    });
  }
  
  // Handle URL parameters for quick access links
  window.addEventListener('load', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category');
    
    if (category) {
      // Redirect to movies page with category parameter
      window.location.href = `movies.html?category=${category}`;
    }
  });
  
  document.querySelectorAll('.quick-access-item').forEach(item => {
    item.addEventListener('click', function(event) {
      event.preventDefault(); // Prevent default link behavior
      const category = this.href.split('category=')[1] || 'all'; // Extract category or default to 'all'
      // Redirect to movies page with category query parameter
      window.location.href = `movies.html?category=${category}`;
    });
  });

}

// Fetch data from TMDB API
async function fetchFromTMDB(endpoint, params = {}) {
  const queryParams = new URLSearchParams({
    api_key: API_KEY,
    ...params
  }).toString();
  
  try {
    const response = await fetch(`${BASE_URL}/${endpoint}?${queryParams}`);
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching data:', error);
    return { results: [] };
  }
}

// Show quick view modal
async function showQuickView(id, type) {
  try {
    currentMediaId = id;
    currentMediaType = type;
    
    // Show loading state
    modal.classList.add('show');
    document.getElementById('modal-image').src = '';
    document.getElementById('modal-title').textContent = 'Loading...';
    document.getElementById('modal-year').textContent = '';
    document.getElementById('modal-runtime').textContent = '';
    document.getElementById('modal-rating').innerHTML = '';
    document.getElementById('modal-genres').innerHTML = '';
    document.getElementById('modal-description').textContent = 'Loading details...';
    
    // Fetch media details
    let media;
    if (type === 'movie') {
      media = await fetchFromTMDB(`movie/${id}`);
    } else {
      media = await fetchFromTMDB(`tv/${id}`);
    }
    
    // Set modal content
    document.getElementById('modal-image').src = `${IMAGE_BASE_URL}${POSTER_SIZE}${media.poster_path}`;
    document.getElementById('modal-title').textContent = type === 'movie' ? media.title : media.name;
    
    // Set year
    const releaseDate = type === 'movie' ? media.release_date : media.first_air_date;
    if (releaseDate) {
      const year = new Date(releaseDate).getFullYear();
      document.getElementById('modal-year').textContent = year;
    } else {
      document.getElementById('modal-year').textContent = 'Unknown';
    }
    
    // Set runtime
    if (type === 'movie') {
      if (media.runtime) {
        document.getElementById('modal-runtime').textContent = `${media.runtime} min`;
      } else {
        document.getElementById('modal-runtime').textContent = 'Unknown';
      }
    } else {
      if (media.episode_run_time && media.episode_run_time.length > 0) {
        document.getElementById('modal-runtime').textContent = `${media.episode_run_time[0]} min/ep`;
      } else {
        document.getElementById('modal-runtime').textContent = 'Unknown';
      }
    }
    
    // Set rating
    const rating = Math.round(media.vote_average * 10) / 10;
    const ratingElement = document.getElementById('modal-rating');
    if (rating > 0) {
      const stars = Math.round(rating / 2);
      ratingElement.innerHTML = '';
      for (let i = 0; i < 5; i++) {
        const starIcon = document.createElement('i');
        if (i < stars) {
          starIcon.className = 'fas fa-star';
        } else {
          starIcon.className = 'far fa-star';
        }
        ratingElement.appendChild(starIcon);
      }
      ratingElement.innerHTML += ` <span class="rating-number">${rating}</span>`;
    } else {
      ratingElement.innerHTML = '<span class="no-rating">Not rated</span>';
    }
    
    // Set genres
    const genresElement = document.getElementById('modal-genres');
    genresElement.innerHTML = '';
    if (media.genres && media.genres.length > 0) {
      media.genres.forEach(genre => {
        const genreTag = document.createElement('span');
        genreTag.className = 'genre-tag';
        genreTag.textContent = genre.name;
        genresElement.appendChild(genreTag);
      });
    } else {
      genresElement.innerHTML = '<span class="no-genres">No genres available</span>';
    }
    
    // Set description
    document.getElementById('modal-description').textContent = media.overview || 'No description available';
  } catch (error) {
    console.error('Error showing quick view:', error);
    document.getElementById('modal-description').textContent = 'Failed to load details. Please try again later.';
  }
}

// Close modal
function closeModal() {
  modal.classList.remove('show');
}

// Watch media from modal
function watchMedia() {
  if (currentMediaId && currentMediaType) {
    window.location.href = `player.html?id=${currentMediaId}&type=${currentMediaType}&source=homepage`;
  }
}

// View media details from modal
function viewDetails() {
  if (currentMediaId && currentMediaType) {
    window.location.href = `details.html?id=${currentMediaId}&type=${currentMediaType}&source=homepage`;
  }
}




// Utility function to shuffle an array
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Close modals when clicking outside
window.addEventListener('click', (e) => {
  if (e.target === modal) {
    closeModal();
  }
});

// Close modals when pressing Escape
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal();
  }
});

// Add navbar scroll effect
window.addEventListener('scroll', () => {
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }
});

// New function to load content for the homepage banner
async function loadHomepageBannerContent() {
  if (!homepageBanner || !homepageBannerTitle || !homepageBannerOverview) {
    console.log('Homepage banner elements not found, skipping banner load.');
    return;
  }
  console.log('Attempting to load homepage banner content for rotation...');

  try {
    const endpoints = [
      { name: 'Trending Movies', url: 'trending/movie/week', type: 'movie' },
      { name: 'Top Rated TV', url: 'tv/top_rated', type: 'tv' },
      { name: 'Korean TV', url: 'discover/tv?with_origin_country=KR&sort_by=vote_average.desc&vote_count.gte=100', type: 'tv' },
      { name: 'Anime Series', url: 'discover/tv?with_genres=16&with_original_language=ja&sort_by=vote_average.desc&vote_count.gte=100', type: 'tv' },
      { name: 'Cartoon Movies', url: 'discover/movie?with_genres=16&sort_by=vote_average.desc&vote_count.gte=100&without_original_language=ja', type: 'movie' }
    ];

    console.log('Fetching data from endpoints for banner rotation:', endpoints.map(ep => ep.name));

    const allPromises = endpoints.map(ep =>
      fetchFromTMDB(ep.url)
        .then(data => {
          if (!data || !Array.isArray(data.results)) {
            console.error(`Invalid data structure from ${ep.name} (${ep.url}):`, data);
            return [];
          }
          console.log(`Fetched ${data.results.length} items from ${ep.name}`);
          return data.results.map(item => ({ ...item, media_type_for_banner: ep.type }));
        })
        .catch(error => {
            console.error(`Error fetching or processing data from ${ep.name} (${ep.url}):`, error);
            return [];
        })
    );
    const resultsArrays = await Promise.all(allPromises);
    console.log('Raw results arrays from all endpoints for banner:', resultsArrays);

    let allItemsUnfiltered = resultsArrays.flat();
    console.log(`Total items after flattening for banner: ${allItemsUnfiltered.length}`);

    bannerItems = allItemsUnfiltered.filter(item => item && item.backdrop_path);
    console.log(`Total items after filtering for backdrop_path for banner: ${bannerItems.length}`);

    if (bannerItems.length === 0) {
      homepageBanner.style.display = 'none';
      console.warn('No suitable items found for homepage banner rotation. Banner will be hidden.');
      return;
    }

    currentBannerIndex = 0;
    updateBannerDisplay(bannerItems[currentBannerIndex]);

    // Clear any existing interval before starting a new one
    if (bannerIntervalId) {
      clearInterval(bannerIntervalId);
    }
    if (bannerItems.length > 1) { // Only rotate if there's more than one item
        bannerIntervalId = setInterval(rotateHomepageBanner, BANNER_ROTATION_INTERVAL);
        console.log(`Started banner rotation with interval ID: ${bannerIntervalId}`);
    }

  } catch (error) {
    console.error('Critical error in loadHomepageBannerContent:', error);
    if (homepageBanner) {
        homepageBanner.style.display = 'none';
        console.log('Homepage banner hidden due to critical error.');
    }
  }
}

function updateBannerDisplay(item) {
  if (!item || !homepageBanner || !homepageBannerTitle || !homepageBannerOverview) {
    console.error('Cannot update banner display: Invalid item or banner elements missing.');
    return;
  }

  const itemTitle = item.title || item.name;
  const itemOverview = item.overview;
  const backdropUrl = `${IMAGE_BASE_URL}${BACKDROP_SIZE}${item.backdrop_path}`;
  const itemType = item.media_type_for_banner || (item.title ? 'movie' : 'tv');

  console.log(`Updating banner display: Title='${itemTitle}', Type='${itemType}', ID='${item.id}'`);

  homepageBanner.style.backgroundImage = `url('${backdropUrl}')`;
  homepageBanner.dataset.id = item.id;
  homepageBanner.dataset.type = itemType;

  homepageBannerTitle.textContent = itemTitle;
  // Truncate overview if it's too long
  homepageBannerOverview.textContent = itemOverview.length > 200 ? itemOverview.substring(0, 200) + '...' : itemOverview;
  homepageBanner.style.display = 'flex';
}

function rotateHomepageBanner() {
  if (!bannerItems || bannerItems.length === 0) {
    console.log('No items to rotate in banner.');
    if (bannerIntervalId) clearInterval(bannerIntervalId); // Stop interval if no items
    return;
  }
  currentBannerIndex = (currentBannerIndex + 1) % bannerItems.length;
  console.log(`Rotating banner to index: ${currentBannerIndex}`);
  updateBannerDisplay(bannerItems[currentBannerIndex]);
}

// Watch button handler for homepage banner
function watchHomepageBannerItem() {
  if (homepageBanner && homepageBanner.dataset.id && homepageBanner.dataset.type) {
    const id = homepageBanner.dataset.id;
    const type = homepageBanner.dataset.type;
    window.location.href = `player.html?id=${id}&type=${type}&source=homepage_banner`;
  }
}

// Details button handler for homepage banner
function showHomepageBannerItemDetails() {
  if (homepageBanner && homepageBanner.dataset.id && homepageBanner.dataset.type) {
    const id = homepageBanner.dataset.id;
    const type = homepageBanner.dataset.type;
    window.location.href = `details.html?id=${id}&type=${type}&source=homepage_banner`;
  }
}
