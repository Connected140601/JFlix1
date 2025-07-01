document.addEventListener('DOMContentLoaded', () => {
    const combinedAnimeGrid = document.getElementById('combined-anime-grid');
    const apiKey = '84549ba3644ea15176802ec153bd9442';
    const updateInterval = 30 * 60 * 1000; // 30 minutes in milliseconds

    if (combinedAnimeGrid) {
        // Initial fetch on page load
        fetchAndDisplayAiringAnimeByLastEpisode(combinedAnimeGrid);

        // Set up periodic updates to refresh the list
        setInterval(() => {
            console.log('Checking for new anime episode releases...');
            fetchAndDisplayAiringAnimeByLastEpisode(combinedAnimeGrid);
        }, updateInterval);
    }

    async function fetchAiringAnimeCandidates() {
        const today = new Date();
        const twoMonthsAgo = new Date();
        twoMonthsAgo.setMonth(today.getMonth() - 2);
        const formatDate = (date) => date.toISOString().split('T')[0];
        
        const url1 = `https://api.themoviedb.org/3/discover/tv?api_key=${apiKey}&with_genres=16&language=en-US&sort_by=popularity.desc&page=1&air_date.gte=${formatDate(twoMonthsAgo)}&air_date.lte=${formatDate(today)}&with_original_language=ja`;
        const url2 = `https://api.themoviedb.org/3/discover/tv?api_key=${apiKey}&with_genres=16&language=en-US&sort_by=popularity.desc&page=2&air_date.gte=${formatDate(twoMonthsAgo)}&air_date.lte=${formatDate(today)}&with_original_language=ja`;

        const [response1, response2] = await Promise.all([fetch(url1), fetch(url2)]);

        if (!response1.ok) throw new Error(`HTTP error! status: ${response1.status}`);
        if (!response2.ok) throw new Error(`HTTP error! status: ${response2.status}`);

        const data1 = await response1.json();
        const data2 = await response2.json();
        
        const combined = new Map();
        [...data1.results, ...data2.results].forEach(anime => {
            combined.set(anime.id, anime);
        });

        return Array.from(combined.values());
    }

    async function fetchAnimeDetails(animeId) {
        const url = `https://api.themoviedb.org/3/tv/${animeId}?api_key=${apiKey}&language=en-US`;
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`Failed to fetch details for anime ID ${animeId}`);
            return null;
        }
        return response.json();
    }

    async function fetchAndDisplayAiringAnimeByLastEpisode(gridElement) {
        try {
            const candidates = await fetchAiringAnimeCandidates();
            
            const detailedAnimePromises = candidates.map(anime => fetchAnimeDetails(anime.id));
            const detailedAnimeList = (await Promise.all(detailedAnimePromises)).filter(Boolean);

            const today = new Date().toISOString().split('T')[0];

            const sortedAnime = detailedAnimeList
                .filter(anime => 
                    anime.last_episode_to_air && 
                    anime.last_episode_to_air.air_date &&
                    anime.last_episode_to_air.air_date <= today
                )
                .sort((a, b) => {
                    return new Date(b.last_episode_to_air.air_date) - new Date(a.last_episode_to_air.air_date);
                });

            displayAnime(sortedAnime, gridElement);
        } catch (error) {
            handleFetchError(error, gridElement, 'airing anime');
        }
    }

    function displayAnime(animeList, gridElement) {
        gridElement.innerHTML = '';
        if (animeList.length === 0) {
            gridElement.innerHTML = '<p>No currently airing anime found.</p>';
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
