import { useState, useEffect } from 'react';
import { Film, Heart, Star, Trophy, Users, Info, Check, Save, ChevronRight, Award, Loader2, AlertCircle } from 'lucide-react';
import { initializeMovieApi, getMovieApi } from '../services/movieApi';
import { movieCache } from '../services/movieCache';
import { getGenreIds } from '../constants/genreMapping';
import type { Movie } from '../types/movie';
import type { GenreRatings, GenreScores, MovieWatchStatus, SavedMovie, GenreDescriptions } from '../types/MovieGenreRanker';

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

  const generateRecommendations = async () => {
    const scores = calculateResults();
    
    if (!useApiRecommendations) {
      return generateHardcodedRecommendations(scores);
    }

    setIsLoadingRecommendations(true);
    setApiError(null);
    
    try {
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

      // Fetch recommendations for each combination
      const promises = genreCombinations.slice(0, 6).map(async ({ genres, requireAll }) => {
        const genreIds = getGenreIds(genres);
        if (genreIds.length === 0) return null;
        
        // Check cache first
        const cacheKey = movieCache.createGenreKey(genreIds, requireAll);
        const cached = movieCache.get<{ category: string; movies: Movie[] }>(cacheKey);
        
        if (cached) {
          return cached;
        }
        
        // Fetch from API
        const result = await movieApi.getMoviesByGenreCombination(genreIds, requireAll, 10);
        
        // Cache the result
        movieCache.set(cacheKey, result);
        
        return result;
      });

      const results = await Promise.all(promises);
      
      results.forEach(result => {
        if (result && result.movies.length > 0) {
          recommendations[result.category] = result.movies;
        }
      });
      
      setMovieRecommendations(recommendations);
      return recommendations;
      
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setApiError('Failed to fetch movie recommendations. Using cached/default recommendations.');
      // Fall back to hardcoded recommendations
      return generateHardcodedRecommendations(scores);
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  // Keep the original hardcoded recommendations as fallback
  const generateHardcodedRecommendations = (scores: GenreScores) => {
    const recommendations: Record<string, Movie[]> = {};
    
    // War/Drama category (for high War + Drama scores)
    if (scores['War']?.average >= 3 && scores['Drama']?.average >= 3) {
      recommendations['War/Drama'] = [
        { title: 'Saving Private Ryan', year: 1998, imdb: 8.6, metascore: 91, description: 'Following D-Day, soldiers search for a paratrooper whose brothers have been killed.' },
        { title: '1917', year: 2019, imdb: 8.2, metascore: 78, description: 'Two soldiers race against time to deliver a message that will stop a deadly attack.' },
        { title: 'Dunkirk', year: 2017, imdb: 7.8, metascore: 94, description: 'Allied soldiers are evacuated from beaches during WWII as German forces close in.' },
        { title: 'The Thin Red Line', year: 1998, imdb: 7.6, metascore: 78, description: 'The battle of Guadalcanal seen through the eyes of several soldiers.' },
        { title: 'Apocalypse Now', year: 1979, imdb: 8.4, metascore: 94, description: 'A captain travels into Cambodia to assassinate a renegade colonel during Vietnam War.' },
        { title: 'Full Metal Jacket', year: 1987, imdb: 8.3, metascore: 76, description: 'A pragmatic Marine observes dehumanizing effects of Vietnam War on fellow recruits.' },
        { title: 'Platoon', year: 1986, imdb: 8.1, metascore: 86, description: 'A young soldier in Vietnam faces moral crisis when confronted with horrors of war.' },
        { title: 'The Deer Hunter', year: 1978, imdb: 8.1, metascore: 86, description: 'An in-depth examination of how Vietnam War impacts the lives of people in a small town.' },
        { title: 'Black Hawk Down', year: 2001, imdb: 7.7, metascore: 75, description: 'The story of a U.S. military raid in Somalia that went disastrously wrong.' },
        { title: 'Hacksaw Ridge', year: 2016, imdb: 8.1, metascore: 71, description: 'WWII medic serves on the battlefield without a weapon, saving 75 men.' }
      ];
    }
    
    // Historical War/Drama category
    if (scores['History']?.average >= 3 && (scores['War']?.average >= 3 || scores['Drama']?.average >= 3)) {
      recommendations['Historical War/Drama'] = [
        { title: 'Schindler\'s List', year: 1993, imdb: 9.0, metascore: 95, description: 'A German businessman saves over a thousand Polish-Jewish refugees during the Holocaust.' },
        { title: 'The Pianist', year: 2002, imdb: 8.5, metascore: 85, description: 'A Polish Jewish musician struggles to survive the destruction of the Warsaw ghetto.' },
        { title: 'Glory', year: 1989, imdb: 7.8, metascore: 78, description: 'The story of the first all-African-American regiment in the Civil War.' },
        { title: 'Lawrence of Arabia', year: 1962, imdb: 8.3, metascore: 100, description: 'The story of T.E. Lawrence and his experiences in the Arabian Peninsula during WWI.' },
        { title: 'Paths of Glory', year: 1957, imdb: 8.4, metascore: 90, description: 'A colonel defends three scapegoats on trial for cowardice during WWI.' },
        { title: 'All Quiet on the Western Front', year: 2022, imdb: 7.8, metascore: 76, description: 'A young German soldier\'s terrifying experiences on the Western Front during WWI.' },
        { title: 'The Bridge on the River Kwai', year: 1957, imdb: 8.1, metascore: 87, description: 'British POWs are forced to build a bridge for their Japanese captors in WWII.' },
        { title: 'Enemy at the Gates', year: 2001, imdb: 7.6, metascore: 53, description: 'A Russian and a German sniper play a game of cat-and-mouse during the Battle of Stalingrad.' },
        { title: 'Letters from Iwo Jima', year: 2006, imdb: 7.8, metascore: 89, description: 'The story of the Battle of Iwo Jima from the perspective of the Japanese.' },
        { title: 'Master and Commander', year: 2003, imdb: 7.5, metascore: 81, description: 'During the Napoleonic Wars, a British frigate pursues a French warship.' }
      ];
    }
    
    // Add classic categories if they have high enough scores
    if (scores['Crime']?.average >= 3.5 && scores['Drama']?.average >= 3.5) {
      recommendations['Crime/Drama/Mystery'] = [
        { title: 'The Godfather', year: 1972, imdb: 9.2, metascore: 100, description: 'The aging patriarch of a crime dynasty transfers control to his son.' },
        { title: 'The Departed', year: 2006, imdb: 8.5, metascore: 85, description: 'An undercover cop and a mole in the police try to identify each other.' },
        { title: 'Heat', year: 1995, imdb: 8.3, metascore: 76, description: 'A group of professional bank robbers face off against a dedicated detective.' },
        { title: 'Casino', year: 1995, imdb: 8.2, metascore: 73, description: 'A tale of greed and deception in Las Vegas casinos.' },
        { title: 'Scarface', year: 1983, imdb: 8.3, metascore: 65, description: 'A Cuban immigrant rises to power in Miami\'s drug underworld.' }
      ];
    }
    
    return recommendations;
  };

  const genres = Object.keys(genreDescriptions);

  const [person1Ratings, setPerson1Ratings] = useState<GenreRatings>({});
  const [person2Ratings, setPerson2Ratings] = useState<GenreRatings>({});
  const [currentPerson, setCurrentPerson] = useState(1);
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
    if (apiKey && apiKey !== 'your_tmdb_api_key_here') {
      try {
        initializeMovieApi(apiKey);
      } catch (error) {
        console.error('Failed to initialize movie API:', error);
        setUseApiRecommendations(false);
      }
    } else {
      console.warn('TMDB API key not configured. Using hardcoded recommendations.');
      setUseApiRecommendations(false);
    }
  }, []);

  const handleRating = (genre: string, rating: number) => {
    if (currentPerson === 1) {
      setPerson1Ratings({ ...person1Ratings, [genre]: rating });
    } else {
      setPerson2Ratings({ ...person2Ratings, [genre]: rating });
    }
  };

  const switchPerson = () => {
    setCurrentPerson(currentPerson === 1 ? 2 : 1);
  };

  const calculateResults = (): GenreScores => {
    const combinedScores: GenreScores = {};
    genres.forEach(genre => {
      const score1 = person1Ratings[genre] || 0;
      const score2 = person2Ratings[genre] || 0;
      combinedScores[genre] = {
        person1: score1,
        person2: score2,
        average: (score1 + score2) / 2,
        total: score1 + score2
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
    setPerson1Ratings({});
    setPerson2Ratings({});
    setCurrentPerson(1);
    setShowResults(false);
    setShowRecommendations(false);
    setMovieWatchStatus({});
    setSavedMovies([]);
    setShowFinalSelection(false);
  };

  const changeScale = (newScale: number) => {
    setScaleSize(newScale);
    setPerson1Ratings({});
    setPerson2Ratings({});
  };

  const updateWatchStatus = (movieKey: string, person: 'person1' | 'person2' | 'both', status: boolean) => {
    const newStatus = { ...movieWatchStatus };
    if (!newStatus[movieKey]) newStatus[movieKey] = {};
    
    if (person === 'both') {
      newStatus[movieKey].person1 = status;
      newStatus[movieKey].person2 = status;
    } else {
      newStatus[movieKey][person] = status;
    }
    
    setMovieWatchStatus(newStatus);
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

  const getGenreScore = (genreName: string) => {
    const scores = calculateResults();
    return scores[genreName] || { average: 0 };
  };

  const ratings = currentPerson === 1 ? person1Ratings : person2Ratings;
  const otherPersonComplete = currentPerson === 1 
    ? Object.keys(person2Ratings).length > 0 
    : Object.keys(person1Ratings).length > 0;

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
        
        <div className="flex gap-2">
          <button
            onClick={() => updateWatchStatus(movieKey, 'person1', !watchStatus.person1)}
            className={`px-3 py-1 text-sm rounded flex items-center gap-1 transition ${
              watchStatus.person1 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            {watchStatus.person1 && <Check size={14} />}
            Person 1 saw
          </button>
          <button
            onClick={() => updateWatchStatus(movieKey, 'person2', !watchStatus.person2)}
            className={`px-3 py-1 text-sm rounded flex items-center gap-1 transition ${
              watchStatus.person2 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            {watchStatus.person2 && <Check size={14} />}
            Person 2 saw
          </button>
          <button
            onClick={() => updateWatchStatus(movieKey, 'both', !watchStatus.person1 || !watchStatus.person2)}
            className={`px-3 py-1 text-sm rounded flex items-center gap-1 transition ${
              watchStatus.person1 && watchStatus.person2
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            {watchStatus.person1 && watchStatus.person2 && <Check size={14} />}
            Both saw
          </button>
        </div>
        </div>
      </div>
    );
  };

  if (showFinalSelection) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-gray-50 rounded-lg">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-2">
            <Trophy className="text-yellow-500" />
            Final Movie Selection
            <Film className="text-blue-600" />
          </h1>
          <p className="text-gray-600">Your saved movies with their genre compatibility scores</p>
        </div>

        <div className="space-y-4">
          {savedMovies
            .map(movie => {
              const genreNames = movie.category.split(/[\/,]/).map(g => g.trim());
              const genreScores = genreNames.map(genre => ({
                name: genre,
                score: getGenreScore(genre).average
              }));
              const avgGenreScore = genreScores.reduce((sum, g) => sum + g.score, 0) / genreScores.length;
              return { ...movie, genreScores, avgGenreScore };
            })
            .sort((a, b) => b.avgGenreScore - a.avgGenreScore)
            .map(movie => (
              <div key={movie.key} className="bg-white rounded-lg p-4 shadow-md">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-xl font-bold">{movie.title} ({movie.year})</h3>
                    <p className="text-sm text-gray-600 mt-1">{movie.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      {(movie.avgGenreScore / scaleSize * 10).toFixed(1)}/10
                    </div>
                    <div className="text-xs text-gray-500">Match Score</div>
                  </div>
                </div>
                
                <div className="flex gap-4 mb-3">
                  <div className="flex items-center gap-1">
                    <Star size={16} className="fill-yellow-500 text-yellow-500" />
                    <span className="font-medium">{movie.imdb}</span>
                    <span className="text-xs text-gray-500">IMDB</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Award size={16} className="text-green-600" />
                    <span className="font-medium">{movie.metascore}</span>
                    <span className="text-xs text-gray-500">Metascore</span>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded p-3">
                  <div className="text-sm font-medium text-gray-700 mb-2">Genre Compatibility:</div>
                  <div className="flex flex-wrap gap-2">
                    {movie.genreScores.map(genre => (
                      <div key={genre.name} className="bg-white rounded px-3 py-1 text-sm">
                        <span className="font-medium">{genre.name}:</span>
                        <span className="ml-1 text-blue-600">{genre.score}/{scaleSize} stars</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
        </div>

        <div className="mt-6 flex gap-4">
          <button
            onClick={() => setShowFinalSelection(false)}
            className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
          >
            Back to Recommendations
          </button>
          <button
            onClick={resetRatings}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Start New Ranking
          </button>
        </div>
      </div>
    );
  }

  if (showRecommendations) {
    const categories = Object.keys(movieRecommendations);
    
    if (categories.length === 0) {
      return (
        <div className="max-w-4xl mx-auto p-6 bg-gray-50 rounded-lg">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">No Recommendations Available</h1>
            <p className="text-gray-600 mb-6">
              Please rate more genres with higher scores to see personalized movie recommendations.
            </p>
            <button
              onClick={() => setShowRecommendations(false)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Back to Results
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-6xl mx-auto p-6 bg-gray-50 rounded-lg">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-2">
            <Film className="text-blue-600" />
            Movie Recommendations
            <Heart className="text-red-500" />
          </h1>
          <p className="text-gray-600 mb-4">Based on your top genres, here are movies you might both enjoy!</p>
          {apiError && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertCircle size={20} />
                <p className="text-sm">{apiError}</p>
              </div>
            </div>
          )}
          <div className="bg-green-50 rounded-lg p-3 inline-block">
            <p className="text-sm text-green-800">
              <strong>Saved Movies:</strong> {savedMovies.length} selected
              {savedMovies.length > 0 && (
                <button
                  onClick={() => setShowFinalSelection(true)}
                  className="ml-3 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition"
                >
                  View Final Selection <ChevronRight size={14} className="inline" />
                </button>
              )}
            </p>
          </div>
        </div>

        <div className="space-y-8">
          {categories.map(category => (
            <div key={category} className="bg-white rounded-lg p-6 shadow-md">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Star className="text-yellow-500" />
                {category}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {movieRecommendations[category].map(movie => (
                  <MovieCard key={movie.title} movie={movie} category={category} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex gap-4">
          <button
            onClick={() => setShowRecommendations(false)}
            className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
          >
            Back to Results
          </button>
          {savedMovies.length > 0 && (
            <button
              onClick={() => setShowFinalSelection(true)}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              View Final Selection ({savedMovies.length} movies)
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-50 rounded-lg">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-2">
          <Film className="text-blue-600" />
          Movie Genre Ranking Tool
          <Heart className="text-red-500" />
        </h1>
        <p className="text-gray-600">Rate each genre based on how much you'd like to watch it!</p>
      </div>

      {!showResults ? (
        <>
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Users className="text-blue-600" />
                  <h2 className="text-xl font-semibold">
                    Person {currentPerson}'s Turn
                  </h2>
                </div>
                <div className="flex items-center gap-2 ml-8">
                  <span className="text-sm text-gray-600">Rating Scale:</span>
                  <button
                    onClick={() => changeScale(5)}
                    className={`px-3 py-1 rounded ${
                      scaleSize === 5
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    } transition`}
                  >
                    5 Stars
                  </button>
                  <button
                    onClick={() => changeScale(7)}
                    className={`px-3 py-1 rounded ${
                      scaleSize === 7
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    } transition`}
                  >
                    7 Stars
                  </button>
                </div>
              </div>
              <button
                onClick={switchPerson}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                Switch to Person {currentPerson === 1 ? 2 : 1}
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {genres.map(genre => (
                <div 
                  key={genre} 
                  className="bg-gray-50 rounded-lg p-3 relative"
                  onMouseEnter={() => setHoveredGenre(genre)}
                  onMouseLeave={() => setHoveredGenre(null)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-gray-800">{genre}</h3>
                    <Info size={16} className="text-gray-400 mt-0.5" />
                  </div>
                  
                  {hoveredGenre === genre && (
                    <div className="absolute z-10 bg-gray-800 text-white text-sm p-3 rounded-lg shadow-lg -top-2 left-0 right-0 transform -translate-y-full">
                      {genreDescriptions[genre]}
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                        <div className="border-8 border-transparent border-t-gray-800"></div>
                      </div>
                    </div>
                  )}
                  
                  <StarRating genre={genre} currentRating={ratings[genre] || 0} />
                  
                  {ratings[genre] && (
                    <div className="mt-1 text-sm text-gray-600">
                      Rated: {ratings[genre]}/{scaleSize} stars
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center gap-4">
            {otherPersonComplete && (
              <button
                onClick={() => setShowResults(true)}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
              >
                <Trophy />
                View Combined Results
              </button>
            )}
            <button
              onClick={resetRatings}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
            >
              Reset All Ratings
            </button>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Star className="text-yellow-500" />
            Your Combined Results ({scaleSize}-Star Scale)
          </h2>
          
          <div className="space-y-4 mb-6">
            {Object.entries(calculateResults())
              .sort((a, b) => b[1].average - a[1].average)
              .map(([genre, scores]) => (
                <div key={genre} className="border-b pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg">{genre}</h3>
                    <div className="flex items-center gap-1">
                      {[...Array(Math.round(scores.average))].map((_, i) => (
                        <Star key={i} size={20} className="fill-yellow-400 text-yellow-400" />
                      ))}
                      {[...Array(scaleSize - Math.round(scores.average))].map((_, i) => (
                        <Star key={i + scores.average} size={20} className="fill-gray-200 text-gray-200" />
                      ))}
                      <span className="ml-2 text-lg font-bold text-blue-600">
                        {scores.average.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-4 text-sm text-gray-600">
                    <span>Person 1: {scores.person1}/{scaleSize} stars</span>
                    <span>Person 2: {scores.person2}/{scaleSize} stars</span>
                  </div>
                  <div className="mt-2 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${(scores.average / scaleSize) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>

          <div className="bg-green-50 rounded-lg p-4 mb-4">
            <h3 className="font-bold text-green-800 mb-2">Your Top Genres:</h3>
            <p className="text-green-700">
              {getTopGenres().map(([genre]) => genre).join(', ') || `No genres rated ${(scaleSize * 0.7).toFixed(0)} stars or higher`}
            </p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setShowResults(false)}
              className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
            >
              Back to Ratings
            </button>
            <button
              onClick={async () => {
                const recommendations = await generateRecommendations();
                setMovieRecommendations(recommendations);
                setShowRecommendations(true);
              }}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoadingRecommendations}
            >
              {isLoadingRecommendations ? (
                <>
                  <Loader2 className="animate-spin" />
                  Loading Recommendations...
                </>
              ) : (
                <>
                  <Film />
                  Get Movie Recommendations
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MovieGenreRanker;