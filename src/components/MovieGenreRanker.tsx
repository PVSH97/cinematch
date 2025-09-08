import { useState, useEffect } from 'react';
import { Film, Star, Trophy, Users, Check, Save, ChevronRight, Award, Loader2, AlertCircle, UserPlus } from 'lucide-react';
import { initializeMovieApi, getMovieApi } from '../services/movieApi';
import { getGenreIds } from '../constants/genreMapping';
import type { Movie } from '../types/movie';
import type { GenreRatings, GenreScores, MovieWatchStatus, SavedMovie, GenreDescriptions, VoterInfo } from '../types/MovieGenreRanker';

const MovieGenreRanker = () => {
  // Debug: Add console log to confirm component is mounting
  console.log('MovieGenreRanker component mounted');
  
  const genreDescriptions: GenreDescriptions = {
    'Action': 'High-energy films with fights, chases, explosions, and physical stunts. Think James Bond, Marvel movies, or Mission Impossible.',
    'Adventure': 'Exciting journeys and quests, often in exotic locations. Examples: Indiana Jones, Pirates of the Caribbean, Jumanji.',
    'Animation': 'Animated films using various techniques (2D, 3D, stop-motion). Includes both kids\' movies and adult animation.',
    'Biography': 'True stories about real people\'s lives. Examples: The Social Network, Bohemian Rhapsody, The Theory of Everything.',
    'Comedy': 'Films designed to make you laugh. Ranges from slapstick to romantic comedies to dark humor.',
    'Crime': 'Stories involving criminals, heists, or law enforcement. Think The Godfather, Goodfellas, or Heat.',
    'Documentary': 'Non-fiction films exploring real events, people, or topics. Educational and informative content.',
    'Drama': 'Serious, plot-driven stories with realistic characters and emotional themes. Often focuses on character development.',
    'Family': 'Films suitable for all ages, often with positive messages. Disney movies, wholesome adventures.',
    'Fantasy': 'Magical worlds with supernatural elements. Lord of the Rings, Harry Potter, Game of Thrones.',
    'Film-Noir': 'Dark, stylized crime dramas typically from the 1940s-50s. Features cynical heroes and femme fatales.',
    'Game-Show': 'Televised competition programs where contestants play games for prizes.',
    'History': 'Period pieces set in the past, often depicting historical events. Examples: Gladiator, Braveheart, 1917.',
    'Horror': 'Scary movies designed to frighten and create suspense. Includes slashers, supernatural, and psychological horror.',
    'Music': 'Films where music is central to the story, including concert films and music documentaries.',
    'Musical': 'Movies where characters sing and dance to advance the plot. La La Land, The Greatest Showman, West Side Story.',
    'Mystery': 'Puzzle-solving films with secrets to uncover. Detective stories, whodunits, and suspenseful investigations.',
    'News': 'Broadcast journalism and news programs. Current events and reporting.',
    'Reality-TV': 'Unscripted shows featuring real people in various situations. Competition shows, lifestyle programs.',
    'Romance': 'Love stories and relationships as the central theme. From light rom-coms to intense romantic dramas.',
    'Sci-Fi': 'Science fiction exploring futuristic concepts, space, technology, or alternate realities. Star Wars, The Matrix, Interstellar.',
    'Short': 'Films typically under 40 minutes. Often experimental or focused on a single concept.',
    'Sport': 'Athletics-focused films about athletes, teams, or sporting events. Rocky, Remember the Titans, Moneyball.',
    'Talk-Show': 'Interview-format programs with hosts and guests discussing various topics.',
    'Thriller': 'Suspenseful films that keep you on edge. Psychological tension, plot twists, and danger.',
    'War': 'Military conflicts and their impact. Saving Private Ryan, Apocalypse Now, Dunkirk.',
    'Western': 'Stories of the American Old West, featuring cowboys, outlaws, and frontier life.'
  };

  const genres = Object.keys(genreDescriptions);

  // New states for dynamic voters
  const [numberOfVoters, setNumberOfVoters] = useState<number>(2);
  const [voterSetupComplete, setVoterSetupComplete] = useState(false);
  const [voters, setVoters] = useState<VoterInfo[]>([]);
  const [allRatings, setAllRatings] = useState<Record<number, GenreRatings>>({});
  const [currentVoterIndex, setCurrentVoterIndex] = useState(0);
  
  // Original states (adapted)
  const [showResults, setShowResults] = useState(false);
  const [scaleSize, setScaleSize] = useState(5);
  const [hoveredGenre, setHoveredGenre] = useState<string | null>(null);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [movieWatchStatus, setMovieWatchStatus] = useState<MovieWatchStatus>({});
  const [savedMovies, setSavedMovies] = useState<SavedMovie[]>([]);
  const [showFinalSelection, setShowFinalSelection] = useState(false);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [useApiRecommendations, setUseApiRecommendations] = useState(true);
  const [movieRecommendations, setMovieRecommendations] = useState<Record<string, Movie[]>>({});

  // Initialize API on component mount
  useEffect(() => {
    const apiKey = import.meta.env.VITE_TMDB_API_KEY;
    console.log('API Key present:', !!apiKey);
    if (apiKey && apiKey !== 'your_tmdb_api_key_here') {
      try {
        initializeMovieApi(apiKey);
        console.log('API initialized successfully');
      } catch (error) {
        console.error('Failed to initialize movie API:', error);
        setUseApiRecommendations(false);
      }
    } else {
      console.warn('TMDB API key not configured. Using hardcoded recommendations.');
      setUseApiRecommendations(false);
    }
  }, []);

  // Initialize voters when setup is complete
  useEffect(() => {
    if (voterSetupComplete) {
      const initialVoters: VoterInfo[] = [];
      const initialRatings: Record<number, GenreRatings> = {};
      
      for (let i = 0; i < numberOfVoters; i++) {
        initialVoters.push({
          id: i,
          name: `Person ${i + 1}`
        });
        initialRatings[i] = {};
      }
      
      setVoters(initialVoters);
      setAllRatings(initialRatings);
    }
  }, [voterSetupComplete, numberOfVoters]);

  const handleVoterSetup = (count: number) => {
    setNumberOfVoters(count);
    setVoterSetupComplete(true);
  };

  const handleRating = (genre: string, rating: number) => {
    setAllRatings(prev => ({
      ...prev,
      [currentVoterIndex]: {
        ...prev[currentVoterIndex],
        [genre]: rating
      }
    }));
  };

  const switchToNextVoter = () => {
    if (currentVoterIndex < numberOfVoters - 1) {
      setCurrentVoterIndex(currentVoterIndex + 1);
    } else {
      setCurrentVoterIndex(0);
    }
  };

  const calculateResults = (): GenreScores => {
    const combinedScores: GenreScores = {};
    
    genres.forEach(genre => {
      const scores: number[] = [];
      let total = 0;
      
      for (let i = 0; i < numberOfVoters; i++) {
        const score = allRatings[i]?.[genre] || 0;
        scores.push(score);
        total += score;
      }
      
      combinedScores[genre] = {
        scores,
        average: numberOfVoters > 0 ? total / numberOfVoters : 0,
        total
      };
    });
    
    return combinedScores;
  };

  const getTopGenres = () => {
    const scores = calculateResults();
    const threshold = scaleSize * 0.7;
    return Object.entries(scores)
      .sort((a, b) => b[1].average - a[1].average)
      .slice(0, 7)
      .filter(([, score]) => score.average >= threshold);
  };

  const resetRatings = () => {
    const resetRatings: Record<number, GenreRatings> = {};
    for (let i = 0; i < numberOfVoters; i++) {
      resetRatings[i] = {};
    }
    setAllRatings(resetRatings);
    setCurrentVoterIndex(0);
    setShowResults(false);
    setShowRecommendations(false);
    setMovieWatchStatus({});
    setSavedMovies([]);
    setShowFinalSelection(false);
    setVoterSetupComplete(false);
    setNumberOfVoters(2);
  };

  const changeScale = (newScale: number) => {
    setScaleSize(newScale);
    const resetRatings: Record<number, GenreRatings> = {};
    for (let i = 0; i < numberOfVoters; i++) {
      resetRatings[i] = {};
    }
    setAllRatings(resetRatings);
  };

  const updateWatchStatus = (movieKey: string, personId: string, status: boolean) => {
    setMovieWatchStatus(prev => ({
      ...prev,
      [movieKey]: {
        ...prev[movieKey],
        [personId]: status
      }
    }));
  };

  const toggleSaveMovie = (category: string, movie: Movie) => {
    const movieKey = `${category}-${movie.title}`;
    const existingIndex = savedMovies.findIndex(m => m.key === movieKey);
    
    if (existingIndex >= 0) {
      setSavedMovies(savedMovies.filter((_, index) => index !== existingIndex));
    } else {
      setSavedMovies([...savedMovies, { ...movie, category, key: movieKey }]);
    }
  };

  const isSaved = (category: string, movie: Movie) => {
    const movieKey = `${category}-${movie.title}`;
    return savedMovies.some(m => m.key === movieKey);
  };


  const generateRecommendations = async () => {
    const scores = calculateResults();
    console.log('Generating recommendations, useAPI:', useApiRecommendations);
    
    if (!useApiRecommendations) {
      console.log('Using hardcoded recommendations');
      return generateHardcodedRecommendations(scores);
    }

    setIsLoadingRecommendations(true);
    setApiError(null);
    
    try {
      console.log('Fetching from TMDB API...');
      const recommendations: Record<string, Movie[]> = {};
      const movieApi = getMovieApi();
      
      // Get top genres with high scores
      const topGenres = Object.entries(scores)
        .filter(([, score]) => score.average >= 3)
        .sort((a, b) => b[1].average - a[1].average)
        .slice(0, 5)
        .map(([genre]) => genre);

      // Generate recommendations based on genre combinations
      const genreCombinations: Array<{ genres: string[], requireAll: boolean, minScore: number }> = [];
      
      // War/Drama combination
      if (scores['War']?.average >= 3 && scores['Drama']?.average >= 3) {
        genreCombinations.push({ genres: ['War', 'Drama'], requireAll: true, minScore: 3 });
      }
      
      // Historical combinations
      if (scores['History']?.average >= 3) {
        if (scores['War']?.average >= 3) {
          genreCombinations.push({ genres: ['History', 'War'], requireAll: false, minScore: 3 });
        }
        if (scores['Drama']?.average >= 3) {
          genreCombinations.push({ genres: ['History', 'Drama'], requireAll: false, minScore: 3 });
        }
      }
      
      // Crime/Drama combination
      if (scores['Crime']?.average >= 3.5 && scores['Drama']?.average >= 3.5) {
        genreCombinations.push({ genres: ['Crime', 'Drama'], requireAll: false, minScore: 3.5 });
      }
      
      // Sci-Fi combinations
      if (scores['Sci-Fi']?.average >= 3) {
        if (scores['Action']?.average >= 3) {
          genreCombinations.push({ genres: ['Sci-Fi', 'Action'], requireAll: false, minScore: 3 });
        }
        if (scores['Thriller']?.average >= 3) {
          genreCombinations.push({ genres: ['Sci-Fi', 'Thriller'], requireAll: false, minScore: 3 });
        }
      }

      // Add individual top genres
      topGenres.forEach(genre => {
        if (!genreCombinations.some(combo => combo.genres.includes(genre))) {
          genreCombinations.push({ genres: [genre], requireAll: false, minScore: scores[genre].average });
        }
      });

      // Fetch movies for each combination
      const fetchPromises = genreCombinations.slice(0, 6).map(async combo => {
        const genreIds = getGenreIds(combo.genres);
        if (genreIds.length > 0) {
          return movieApi.getMoviesByGenreCombination(genreIds, combo.requireAll, 10);
        }
        return null;
      });

      console.log('Fetching movies for', genreCombinations.length, 'genre combinations');
      const results = await Promise.all(fetchPromises);
      console.log('API fetch complete, processing results...');
      
      results.forEach(result => {
        if (result && result.movies.length > 0) {
          recommendations[result.category] = result.movies;
          console.log(`Added ${result.movies.length} movies for ${result.category}`);
        }
      });
      
      console.log('Total recommendations:', Object.keys(recommendations).length);
      setMovieRecommendations(recommendations);
      setIsLoadingRecommendations(false);
      return recommendations;
      
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      console.error('Error details:', error);
      setApiError('Failed to fetch movie recommendations. Using fallback recommendations.');
      setIsLoadingRecommendations(false);
      setUseApiRecommendations(false);
      // Fallback to hardcoded recommendations
      return generateHardcodedRecommendations(scores);
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  const generateHardcodedRecommendations = (scores: GenreScores) => {
    const recommendations: Record<string, Movie[]> = {};
    
    // More comprehensive hardcoded recommendations
    if (scores['Action']?.average >= 3) {
      recommendations['Action'] = [
        {
          title: 'Mad Max: Fury Road',
          year: 2015,
          imdb: 8.1,
          description: 'In a post-apocalyptic wasteland, a woman rebels against a tyrannical ruler in search for her homeland.',
          poster: undefined,
          genres: ['Action', 'Adventure', 'Sci-Fi']
        },
        {
          title: 'The Dark Knight',
          year: 2008,
          imdb: 9.0,
          description: 'Batman faces the Joker, a criminal mastermind who wants to plunge Gotham into anarchy.',
          poster: undefined,
          genres: ['Action', 'Crime', 'Drama']
        }
      ];
    }
    
    if (scores['Drama']?.average >= 3) {
      recommendations['Drama'] = [
        {
          title: 'The Shawshank Redemption',
          year: 1994,
          imdb: 9.3,
          description: 'Two imprisoned men bond over years, finding solace and eventual redemption.',
          poster: undefined,
          genres: ['Drama']
        },
        {
          title: 'The Godfather',
          year: 1972,
          imdb: 9.2,
          description: 'The aging patriarch of an organized crime dynasty transfers control to his reluctant son.',
          poster: undefined,
          genres: ['Crime', 'Drama']
        }
      ];
    }
    
    if (scores['Sci-Fi']?.average >= 3) {
      recommendations['Sci-Fi'] = [
        {
          title: 'Inception',
          year: 2010,
          imdb: 8.8,
          description: 'A thief who steals corporate secrets through dream-sharing technology.',
          poster: undefined,
          genres: ['Action', 'Sci-Fi', 'Thriller']
        },
        {
          title: 'Interstellar',
          year: 2014,
          imdb: 8.6,
          description: 'A team of explorers travel through a wormhole in space to ensure humanity\'s survival.',
          poster: undefined,
          genres: ['Adventure', 'Drama', 'Sci-Fi']
        }
      ];
    }
    
    if (scores['Comedy']?.average >= 3) {
      recommendations['Comedy'] = [
        {
          title: 'The Grand Budapest Hotel',
          year: 2014,
          imdb: 8.1,
          description: 'The adventures of a legendary concierge at a famous hotel.',
          poster: undefined,
          genres: ['Adventure', 'Comedy', 'Crime']
        }
      ];
    }
    
    console.log('Generated hardcoded recommendations for', Object.keys(recommendations).length, 'categories');
    setMovieRecommendations(recommendations);
    return recommendations;
  };

  // Current voter's ratings
  const currentRatings = allRatings[currentVoterIndex] || {};
  
  // Check if other voters have completed
  const otherVotersComplete = Object.keys(allRatings).length === numberOfVoters && 
    Object.values(allRatings).every((ratings, index) => 
      index === currentVoterIndex || Object.keys(ratings).length > 0
    );

  const allVotersComplete = numberOfVoters > 0 && 
    Object.keys(allRatings).length === numberOfVoters && 
    Object.values(allRatings).every(ratings => Object.keys(ratings).length >= genres.length);

  const StarRating = ({ genre, currentRating }: { genre: string; currentRating: number }) => {
    return (
      <div className="flex items-center gap-1">
        {[...Array(scaleSize)].map((_, i) => (
          <button
            key={i}
            onClick={() => handleRating(genre, i + 1)}
            className="transition-all transform hover:scale-110"
          >
            <Star
              size={24}
              className={`${
                currentRating >= i + 1
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'fill-gray-200 text-gray-200 hover:fill-yellow-200 hover:text-yellow-200'
              } transition-colors`}
            />
          </button>
        ))}
      </div>
    );
  };

  const MovieCard = ({ movie, category }: { movie: Movie; category: string }) => {
    const movieKey = `${category}-${movie.title}`;
    const watchStatus = movieWatchStatus[movieKey] || {};
    const saved = isSaved(category, movie);

    return (
      <div className={`bg-white rounded-lg shadow-md overflow-hidden ${saved ? 'ring-2 ring-green-500' : ''}`}>
        {movie.poster && (
          <div className="relative h-48 bg-gray-200">
            <img 
              src={movie.poster} 
              alt={`${movie.title} poster`}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}
        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-semibold text-lg">{movie.title} ({movie.year})</h4>
            <button
              onClick={() => toggleSaveMovie(category, movie)}
              className={`transition ${saved ? 'text-green-600' : 'text-gray-400 hover:text-green-600'}`}
            >
              <Save size={20} />
            </button>
          </div>
          
          <div className="flex flex-wrap gap-3 mb-2">
            <div className="flex items-center gap-1">
              <Star size={16} className="fill-yellow-500 text-yellow-500" />
              <span className="font-medium">{movie.imdb.toFixed(1)}/10</span>
              <span className="text-xs text-gray-500">
                TMDB {movie.voteCount && `(${movie.voteCount.toLocaleString()} votes)`}
              </span>
            </div>
            {movie.runtime && (
              <div className="flex items-center gap-1">
                <Film size={16} className="text-purple-600" />
                <span className="font-medium">{movie.runtime}</span>
                <span className="text-xs text-gray-500">min</span>
              </div>
            )}
            {movie.year && (
              <div className="flex items-center gap-1">
                <Award size={16} className="text-green-600" />
                <span className="font-medium">{movie.year}</span>
              </div>
            )}
          </div>
          
          <p className="text-sm text-gray-600 mb-3">{movie.description}</p>
        
          <div className="flex flex-wrap gap-2">
            {voters.map((voter) => (
              <button
                key={voter.id}
                onClick={() => updateWatchStatus(movieKey, `person${voter.id}`, !watchStatus[`person${voter.id}`])}
                className={`px-3 py-1 text-sm rounded flex items-center gap-1 transition ${
                  watchStatus[`person${voter.id}`]
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                {watchStatus[`person${voter.id}`] && <Check size={14} />}
                {voter.name} saw
              </button>
            ))}
            {numberOfVoters > 1 && (
              <button
                onClick={() => {
                  const allSaw = voters.every(v => watchStatus[`person${v.id}`]);
                  voters.forEach(v => {
                    updateWatchStatus(movieKey, `person${v.id}`, !allSaw);
                  });
                }}
                className={`px-3 py-1 text-sm rounded flex items-center gap-1 transition ${
                  voters.every(v => watchStatus[`person${v.id}`])
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                {voters.every(v => watchStatus[`person${v.id}`]) && <Check size={14} />}
                All saw
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Voter setup screen
  if (!voterSetupComplete) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white/10 backdrop-blur-md rounded-lg">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <UserPlus className="w-16 h-16 text-purple-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">How many people are rating?</h2>
          <p className="text-purple-200">Select the number of voters for this session</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-8">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
            <button
              key={num}
              onClick={() => handleVoterSetup(num)}
              className="p-6 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 transition-all transform hover:scale-105 border-2 border-purple-400/50 hover:border-purple-400"
            >
              <div className="text-3xl font-bold text-white mb-1">{num}</div>
              <div className="text-sm text-purple-200">
                {num === 1 ? 'Solo' : `${num} People`}
              </div>
            </button>
          ))}
        </div>

        <div className="text-center">
          <p className="text-purple-200 text-sm">
            {numberOfVoters === 1 
              ? "Rating alone? Perfect for personal movie discovery!"
              : "Rating with friends? Find movies everyone will love!"}
          </p>
        </div>
      </div>
    );
  }

  if (showFinalSelection) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-gray-50 rounded-lg">
        <div className="text-center mb-6">
          <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-800">Your Movie Selection</h2>
          <p className="text-gray-600 mt-2">Movies saved for your next watch session!</p>
        </div>

        <div className="space-y-4 mb-6">
          {savedMovies.map((movie) => {
            const movieKey = `${movie.category}-${movie.title}`;
            const watchStatus = movieWatchStatus[movieKey] || {};
            const allWatched = numberOfVoters === 1 
              ? watchStatus['person0']
              : voters.every(v => watchStatus[`person${v.id}`]);

            return (
              <div key={movie.key} className={`bg-white p-4 rounded-lg shadow ${allWatched ? 'opacity-50' : ''}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{movie.title} ({movie.year})</h3>
                    <p className="text-sm text-gray-600">Category: {movie.category}</p>
                    <p className="text-sm text-gray-600">Rating: {movie.imdb}/10</p>
                  </div>
                  <div className="text-right">
                    {allWatched && <span className="text-green-600 font-semibold">✓ Watched</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-2 sm:gap-4 justify-center">
          <button
            onClick={() => setShowFinalSelection(false)}
            className="px-4 sm:px-6 py-2 sm:py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition text-sm sm:text-base"
          >
            <span className="hidden sm:inline">Back to Recommendations</span>
            <span className="sm:hidden">Back</span>
          </button>
          <button
            onClick={resetRatings}
            className="px-4 sm:px-6 py-2 sm:py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm sm:text-base"
          >
            <span className="hidden sm:inline">Start New Session</span>
            <span className="sm:hidden">New Session</span>
          </button>
        </div>
      </div>
    );
  }

  if (showRecommendations) {
    return (
      <div className="max-w-6xl mx-auto p-6 bg-gray-50 rounded-lg">
        <div className="text-center mb-6">
          <Film className="w-16 h-16 text-purple-600 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-800">Your Personalized Movie Recommendations</h2>
          <p className="text-gray-600 mt-2">Based on {numberOfVoters === 1 ? 'your' : 'everyone\'s'} genre preferences</p>
        </div>

        {isLoadingRecommendations && (
          <div className="text-center py-8">
            <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Finding perfect movies for you...</p>
          </div>
        )}

        {apiError && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <p className="text-yellow-800">{apiError}</p>
            </div>
          </div>
        )}

        {!isLoadingRecommendations && Object.entries(movieRecommendations).map(([category, movies]) => (
          <div key={category} className="mb-8">
            <h3 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Award className="text-purple-600" />
              {category}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {movies.map((movie, index) => (
                <MovieCard key={`${category}-${index}`} movie={movie} category={category} />
              ))}
            </div>
          </div>
        ))}

        <div className="flex flex-wrap gap-2 sm:gap-4 justify-center mt-8">
          <button
            onClick={() => setShowRecommendations(false)}
            className="px-4 sm:px-6 py-2 sm:py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition text-sm sm:text-base"
          >
            <span className="hidden sm:inline">Back to Results</span>
            <span className="sm:hidden">Back</span>
          </button>
          {savedMovies.length > 0 && (
            <button
              onClick={() => setShowFinalSelection(true)}
              className="px-4 sm:px-6 py-2 sm:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2 text-sm sm:text-base"
            >
              <Save size={20} />
              <span className="hidden sm:inline">View Saved Movies ({savedMovies.length})</span>
              <span className="sm:hidden">Saved ({savedMovies.length})</span>
            </button>
          )}
          <button
            onClick={resetRatings}
            className="px-4 sm:px-6 py-2 sm:py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm sm:text-base"
          >
            <span className="hidden sm:inline">Start Over</span>
            <span className="sm:hidden">Restart</span>
          </button>
        </div>
      </div>
    );
  }

  if (showResults) {
    const topGenres = getTopGenres();

    return (
      <div className="max-w-4xl mx-auto p-6 bg-white/10 backdrop-blur-md rounded-lg">
        <div className="text-center mb-6">
          <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-white">
            {numberOfVoters === 1 ? 'Your Results' : 'Combined Results'}
          </h2>
          <p className="text-purple-200 mt-2">
            {numberOfVoters === 1 
              ? 'Your top movie genres'
              : `Based on ${numberOfVoters} people's preferences`}
          </p>
        </div>

        <div className="space-y-4 mb-6">
          {topGenres.map(([genre, score]) => (
            <div key={genre} className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-semibold text-white">{genre}</h3>
                <div className="text-yellow-400">
                  {'★'.repeat(Math.round(score.average))}
                </div>
              </div>
              {numberOfVoters > 1 && (
                <div className="text-sm text-purple-200 space-y-1">
                  {voters.map((voter, index) => (
                    <span key={voter.id} className="block">
                      {voter.name}: {score.scores[index]}/{scaleSize} stars
                    </span>
                  ))}
                  <span className="block font-semibold">
                    Average: {score.average.toFixed(1)}/{scaleSize} stars
                  </span>
                </div>
              )}
              {numberOfVoters === 1 && (
                <div className="text-sm text-purple-200">
                  Rating: {score.scores[0]}/{scaleSize} stars
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 sm:gap-4 justify-center">
          <button
            onClick={() => setShowResults(false)}
            className="px-4 sm:px-6 py-2 sm:py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition text-sm sm:text-base"
          >
            <span className="hidden sm:inline">Back to Rating</span>
            <span className="sm:hidden">Back</span>
          </button>
          <button
            onClick={async () => {
              setShowRecommendations(true);
              await generateRecommendations();
            }}
            className="px-4 sm:px-6 py-2 sm:py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2 text-sm sm:text-base"
          >
            <span className="hidden sm:inline">Get Movie Recommendations</span>
            <span className="sm:hidden">Get Movies</span>
            <ChevronRight size={20} />
          </button>
          <button
            onClick={resetRatings}
            className="px-4 sm:px-6 py-2 sm:py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm sm:text-base"
          >
            <span className="hidden sm:inline">Reset All</span>
            <span className="sm:hidden">Reset</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white/10 backdrop-blur-md rounded-lg">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-3xl font-bold text-white">
              Movie Genre Ranking
            </h2>
            <p className="text-purple-200">
              {numberOfVoters === 1 
                ? 'Rate your favorite genres'
                : `${voters[currentVoterIndex]?.name || 'Person ' + (currentVoterIndex + 1)}'s Turn`}
            </p>
          </div>
          <div className="text-right">
            <p className="text-purple-200 text-sm">Scale: 1-{scaleSize} stars</p>
            <select 
              value={scaleSize} 
              onChange={(e) => changeScale(Number(e.target.value))}
              className="mt-1 px-3 py-1 bg-white/20 text-white rounded"
            >
              <option value="5">5 Stars</option>
              <option value="7">7 Stars</option>
              <option value="10">10 Stars</option>
            </select>
          </div>
        </div>

        {numberOfVoters > 1 && (
          <div className="bg-purple-800/30 p-3 rounded-lg mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="text-purple-300" />
                <span className="text-white">
                  Voter {currentVoterIndex + 1} of {numberOfVoters}
                </span>
              </div>
              <div className="flex gap-2">
                {voters.map((voter) => (
                  <div
                    key={voter.id}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                      voter.id === currentVoterIndex
                        ? 'bg-purple-400 text-white'
                        : Object.keys(allRatings[voter.id] || {}).length > 0
                        ? 'bg-green-400 text-white'
                        : 'bg-gray-400 text-white'
                    }`}
                  >
                    {voter.id + 1}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {genres.map((genre) => (
          <div
            key={genre}
            className="bg-white/10 backdrop-blur-sm p-4 rounded-lg hover:bg-white/20 transition"
            onMouseEnter={() => setHoveredGenre(genre)}
            onMouseLeave={() => setHoveredGenre(null)}
          >
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white">{genre}</h3>
                {hoveredGenre === genre && (
                  <p className="text-sm text-purple-200 mt-1">
                    {genreDescriptions[genre]}
                  </p>
                )}
              </div>
              <StarRating genre={genre} currentRating={currentRatings[genre] || 0} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-2 sm:gap-4 justify-center">
        {numberOfVoters > 1 && currentVoterIndex < numberOfVoters - 1 && (
          <button
            onClick={switchToNextVoter}
            className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 text-sm sm:text-base"
          >
            <span className="hidden sm:inline">Switch to {voters[currentVoterIndex + 1]?.name || `Person ${currentVoterIndex + 2}`}</span>
            <span className="sm:hidden">Next Person</span>
            <ChevronRight size={20} />
          </button>
        )}
        
        {allVotersComplete ? (
          <button
            onClick={() => setShowResults(true)}
            className="px-4 sm:px-6 py-2 sm:py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2 animate-pulse text-sm sm:text-base"
          >
            <Star size={20} />
            <span className="hidden sm:inline">All Done! See Results</span>
            <span className="sm:hidden">See Results</span>
          </button>
        ) : (
          (numberOfVoters === 1 || (numberOfVoters > 1 && otherVotersComplete)) && (
            <button
              onClick={() => setShowResults(true)}
              className="px-4 sm:px-6 py-2 sm:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2 text-sm sm:text-base"
            >
              <Trophy size={20} />
              <span className="hidden sm:inline">View Results</span>
              <span className="sm:hidden">Results</span>
            </button>
          )
        )}

        <button
          onClick={resetRatings}
          className="px-4 sm:px-6 py-2 sm:py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm sm:text-base"
        >
          <span className="hidden sm:inline">Reset All</span>
          <span className="sm:hidden">Reset</span>
        </button>
      </div>
    </div>
  );
};

export default MovieGenreRanker;