import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const NetflixClone = () => {
  const [heroMovie, setHeroMovie] = useState(null);
  const [movieCategories, setMovieCategories] = useState({});
  const [showTrailer, setShowTrailer] = useState(false);
  const [selectedTrailer, setSelectedTrailer] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const scrollRefs = useRef({});

  const TMDB_API_KEY = 'c8dea14dc917687ac631a52620e4f7ad';
  const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
  const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
  const TMDB_BACKDROP_BASE_URL = 'https://image.tmdb.org/t/p/original';

  // Mock Netflix-style categories
  const categories = [
    { name: 'Trending Now', endpoint: 'trending/movie/week' },
    { name: 'Popular Movies', endpoint: 'movie/popular' },
    { name: 'Top Rated', endpoint: 'movie/top_rated' },
    { name: 'Action Movies', endpoint: 'discover/movie', params: '&with_genres=28' },
    { name: 'Comedy Movies', endpoint: 'discover/movie', params: '&with_genres=35' },
    { name: 'Horror Movies', endpoint: 'discover/movie', params: '&with_genres=27' },
    { name: 'Romance Movies', endpoint: 'discover/movie', params: '&with_genres=10749' },
    { name: 'Documentaries', endpoint: 'discover/movie', params: '&with_genres=99' },
  ];

  const fallbackImages = [
    'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzF8MHwxfHNlYXJjaHwxfHxtb3ZpZSUyMHBvc3RlcnxlbnwwfHx8YmxhY2t8MTc1NDU0MzI4MHww&ixlib=rb-4.1.0&q=85',
    'https://images.unsplash.com/photo-1590179068383-b9c69aacebd3?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzF8MHwxfHNlYXJjaHwyfHxtb3ZpZSUyMHBvc3RlcnxlbnwwfHx8YmxhY2t8MTc1NDU0MzI4MHww&ixlib=rb-4.1.0&q=85',
    'https://images.unsplash.com/photo-1641549058491-8a3442385da0?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzF8MHwxfHNlYXJjaHwzfHxtb3ZpZSUyMHBvc3RlcnxlbnwwfHx8YmxhY2t8MTc1NDU0MzI4MHww&ixlib=rb-4.1.0&q=85',
    'https://images.unsplash.com/photo-1613386932982-58fcdbaa5a4d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzF8MHwxfHNlYXJjaHw0fHxtb3ZpZSUyMHBvc3RlcnxlbnwwfHx8YmxhY2t8MTc1NDU0MzI4MHww&ixlib=rb-4.1.0&q=85',
  ];

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      // Fetch hero movie (popular movie for hero banner)
      const heroResponse = await axios.get(`${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&page=1`);
      const heroMovieData = heroResponse.data.results[0];
      
      // Get hero movie trailer
      const heroTrailerResponse = await axios.get(`${TMDB_BASE_URL}/movie/${heroMovieData.id}/videos?api_key=${TMDB_API_KEY}`);
      const heroTrailer = heroTrailerResponse.data.results.find(video => 
        video.type === 'Trailer' && video.site === 'YouTube'
      );
      
      setHeroMovie({
        ...heroMovieData,
        trailerKey: heroTrailer?.key || null
      });

      // Fetch movies for each category
      const categoryData = {};
      for (const category of categories) {
        const params = category.params || '';
        const response = await axios.get(
          `${TMDB_BASE_URL}/${category.endpoint}?api_key=${TMDB_API_KEY}${params}&page=1`
        );
        
        // Get trailer for each movie
        const moviesWithTrailers = await Promise.all(
          response.data.results.slice(0, 20).map(async (movie) => {
            try {
              const trailerResponse = await axios.get(
                `${TMDB_BASE_URL}/movie/${movie.id}/videos?api_key=${TMDB_API_KEY}`
              );
              const trailer = trailerResponse.data.results.find(video => 
                video.type === 'Trailer' && video.site === 'YouTube'
              );
              return {
                ...movie,
                trailerKey: trailer?.key || null
              };
            } catch (error) {
              return { ...movie, trailerKey: null };
            }
          })
        );
        
        categoryData[category.name] = moviesWithTrailers;
      }
      
      setMovieCategories(categoryData);
    } catch (error) {
      console.error('Error fetching movies:', error);
      // Use fallback data if API fails
      setHeroMovie({
        title: 'Popular Movie',
        overview: 'An exciting blockbuster movie that will keep you on the edge of your seat.',
        backdrop_path: null,
        trailerKey: 'dQw4w9WgXcQ' // Rick Roll as fallback
      });
    }
  };

  const searchMovies = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await axios.get(
        `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`
      );
      setSearchResults(response.data.results.slice(0, 20));
    } catch (error) {
      console.error('Error searching movies:', error);
      setSearchResults([]);
    }
    setIsSearching(false);
  };

  const playTrailer = (movie) => {
    if (movie.trailerKey) {
      setSelectedTrailer(movie);
      setShowTrailer(true);
    }
  };

  const closeTrailer = () => {
    setShowTrailer(false);
    setSelectedTrailer(null);
  };

  const scrollMovies = (categoryName, direction) => {
    const container = scrollRefs.current[categoryName];
    if (container) {
      const scrollAmount = 400;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const getImageUrl = (path, isBackdrop = false) => {
    if (!path) {
      const randomIndex = Math.floor(Math.random() * fallbackImages.length);
      return fallbackImages[randomIndex];
    }
    return isBackdrop ? `${TMDB_BACKDROP_BASE_URL}${path}` : `${TMDB_IMAGE_BASE_URL}${path}`;
  };

  const truncateText = (text, maxLength) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <div className="netflix-clone">
      {/* Navigation */}
      <nav className="netflix-nav">
        <div className="nav-content">
          <div className="nav-left">
            <div className="netflix-logo">NETFLIX</div>
            <div className="nav-links">
              <a href="#" className="nav-link active">Home</a>
              <a href="#" className="nav-link">TV Shows</a>
              <a href="#" className="nav-link">Movies</a>
              <a href="#" className="nav-link">New & Popular</a>
              <a href="#" className="nav-link">My List</a>
            </div>
          </div>
          <div className="nav-right">
            <div className="search-container">
              <input
                type="text"
                placeholder="Search movies..."
                className="search-input"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  searchMovies(e.target.value);
                }}
              />
              <svg className="search-icon" viewBox="0 0 24 24">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
            </div>
            <div className="profile-menu">
              <div className="profile-avatar"></div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Banner */}
      {heroMovie && !isSearching && (
        <div className="hero-banner" style={{
          backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.8) 100%), url(${getImageUrl(heroMovie.backdrop_path, true)})`
        }}>
          <div className="hero-content">
            <h1 className="hero-title">{heroMovie.title}</h1>
            <p className="hero-overview">{truncateText(heroMovie.overview, 200)}</p>
            <div className="hero-buttons">
              <button 
                className="hero-btn play-btn"
                onClick={() => playTrailer(heroMovie)}
              >
                <svg viewBox="0 0 24 24" className="play-icon">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                Play
              </button>
              <button className="hero-btn info-btn">
                <svg viewBox="0 0 24 24" className="info-icon">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                </svg>
                More Info
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search Results */}
      {isSearching && searchResults.length > 0 && (
        <div className="search-results">
          <h2 className="category-title">Search Results</h2>
          <div className="movies-grid">
            {searchResults.map((movie) => (
              <div key={movie.id} className="movie-card search-card" onClick={() => playTrailer(movie)}>
                <img
                  src={getImageUrl(movie.poster_path)}
                  alt={movie.title}
                  className="movie-poster"
                />
                <div className="movie-info">
                  <h3 className="movie-title">{truncateText(movie.title, 25)}</h3>
                  <p className="movie-year">{new Date(movie.release_date).getFullYear()}</p>
                </div>
                {movie.trailerKey && (
                  <div className="play-overlay">
                    <svg viewBox="0 0 24 24" className="play-icon-overlay">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Movie Categories */}
      {!isSearching && (
        <div className="movie-sections">
          {Object.entries(movieCategories).map(([categoryName, movies]) => (
            <div key={categoryName} className="movie-category">
              <h2 className="category-title">{categoryName}</h2>
              <div className="movie-row-container">
                <button 
                  className="scroll-btn scroll-left"
                  onClick={() => scrollMovies(categoryName, 'left')}
                >
                  <svg viewBox="0 0 24 24">
                    <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                  </svg>
                </button>
                <div 
                  className="movie-row"
                  ref={(el) => scrollRefs.current[categoryName] = el}
                >
                  {movies.map((movie) => (
                    <div 
                      key={movie.id} 
                      className="movie-card"
                      onClick={() => playTrailer(movie)}
                    >
                      <img
                        src={getImageUrl(movie.poster_path)}
                        alt={movie.title}
                        className="movie-poster"
                      />
                      <div className="movie-hover-info">
                        <h3 className="movie-title">{truncateText(movie.title, 20)}</h3>
                        <div className="movie-actions">
                          <button className="action-btn play-action">
                            <svg viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                          </button>
                          <button className="action-btn">
                            <svg viewBox="0 0 24 24">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                          </button>
                          <button className="action-btn">
                            <svg viewBox="0 0 24 24">
                              <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                            </svg>
                          </button>
                        </div>
                        <div className="movie-meta">
                          <span className="movie-year">{new Date(movie.release_date).getFullYear()}</span>
                          <span className="movie-rating">★ {movie.vote_average.toFixed(1)}</span>
                        </div>
                        <p className="movie-description">{truncateText(movie.overview, 100)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button 
                  className="scroll-btn scroll-right"
                  onClick={() => scrollMovies(categoryName, 'right')}
                >
                  <svg viewBox="0 0 24 24">
                    <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Trailer Modal */}
      {showTrailer && selectedTrailer && (
        <div className="trailer-modal" onClick={closeTrailer}>
          <div className="trailer-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={closeTrailer}>
              <svg viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
            <div className="trailer-wrapper">
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${selectedTrailer.trailerKey}?autoplay=1`}
                title="Movie Trailer"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            <div className="trailer-info">
              <h2>{selectedTrailer.title}</h2>
              <p>{selectedTrailer.overview}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NetflixClone;