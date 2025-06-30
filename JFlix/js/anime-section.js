document.addEventListener('DOMContentLoaded', () => {
    const combinedAnimeGrid = document.getElementById('combined-anime-grid');
    const apiKey = '84549ba3644ea15176802ec153bd9442';

    if (combinedAnimeGrid) {
        fetchAndDisplayCombinedAnime(combinedAnimeGrid);
    }

    async function fetchTrendingAnime() {
        const url = `https://api.themoviedb.org/3/trending/tv/week?api_key=${apiKey}&language=en-US`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return data.results.filter(item => item.genre_ids.includes(16));
    }

    async function fetchAiringAnime() {
        const today = new Date();
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(today.getMonth() - 1);
        const formatDate = (date) => date.toISOString().split('T')[0];
        const url = `https://api.themoviedb.org/3/discover/tv?api_key=${apiKey}&with_genres=16&language=en-US&sort_by=popularity.desc&page=1&air_date.gte=${formatDate(oneMonthAgo)}&air_date.lte=${formatDate(today)}&with_original_language=ja`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return data.results;
    }

    async function fetchAndDisplayCombinedAnime(gridElement) {
        try {
            const [trending, airing] = await Promise.all([
                fetchTrendingAnime(),
                fetchAiringAnime()
            ]);

            const combined = new Map();
            [...trending, ...airing].forEach(anime => {
                combined.set(anime.id, anime);
            });

            const sortedAnime = Array.from(combined.values()).sort((a, b) => b.popularity - a.popularity);

            displayAnime(sortedAnime, gridElement);
        } catch (error) {
            handleFetchError(error, gridElement, 'combined anime');
        }
    }

    function displayAnime(animeList, gridElement) {
        gridElement.innerHTML = ''; // Clear loading indicator
        if (animeList.length === 0) {
            gridElement.innerHTML = '<p>No anime content found.</p>';
            return;
        }
        animeList.forEach(anime => {
            const animeItem = document.createElement('div');
            animeItem.className = 'trending-item';

            const posterPath = anime.poster_path ? `https://image.tmdb.org/t/p/w500${anime.poster_path}` : 'images/default-poster.png';

            animeItem.innerHTML = `
                <div class="trending-poster-container">
                    <img class="trending-poster" src="${posterPath}" alt="${anime.name}">
                    <div class="trending-overlay">
                        <div class="trending-buttons">
                            <button class="btn watch-btn" onclick="location.href='player.html?id=${anime.id}&type=tv'"><i class="fas fa-play"></i> Watch</button>
                            <button class="btn details-btn" onclick="location.href='details.html?id=${anime.id}&type=tv'"><i class="fas fa-info-circle"></i> Details</button>
                        </div>
                    </div>
                    <div class="trending-badge anime">Anime</div>
                </div>
                <div class="trending-info">
                    <h3 class="trending-title">${anime.name}</h3>
                    <div class="trending-meta">
                        <span class="trending-year">${anime.first_air_date ? anime.first_air_date.substring(0, 4) : 'N/A'}</span>
                        <span class="trending-rating">${anime.vote_average ? anime.vote_average.toFixed(1) : 'N/A'}/10</span>
                    </div>
                </div>
            `;
            gridElement.appendChild(animeItem);
        });
    }

    function handleFetchError(error, gridElement, type) {
        console.error(`Failed to fetch ${type}. Error:`, error);
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
            console.error('This looks like a network error. Please check your internet connection and if the API endpoint is accessible.');
            gridElement.innerHTML = `<p>Could not connect to the server to load ${type}. Please check your network connection.</p>`;
        } else {
            console.error('An unexpected error occurred:', error.message);
            gridElement.innerHTML = `<p>Could not load ${type} due to an unexpected error.</p>`;
        }
    }
});
