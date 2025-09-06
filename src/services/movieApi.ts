import axios from 'axios';
import type { AxiosInstance } from 'axios';
import type {
  TMDBMovie,
  TMDBMovieDetails,
  TMDBDiscoverResponse,
  TMDBGenresResponse,
  Movie,
  MovieApiConfig,
  DiscoverParams,
} from '../types/movie';
import { getCategoryName } from '../constants/genreMapping';

class MovieApiService {
  private client: AxiosInstance;
  private config: MovieApiConfig;
  private genreCache: Map<number, string> = new Map();

  constructor(config: MovieApiConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseUrl,
      params: {
        api_key: config.apiKey,
        language: config.language || 'en-US',
      },
    });

    // Initialize genre cache
    this.loadGenres();
  }

  private async loadGenres(): Promise<void> {
    try {
      const response = await this.client.get<TMDBGenresResponse>('/genre/movie/list');
      response.data.genres.forEach((genre) => {
        this.genreCache.set(genre.id, genre.name);
      });
    } catch (error) {
      console.error('Failed to load genres:', error);
    }
  }

  private convertToMovie(tmdbMovie: TMDBMovie | TMDBMovieDetails): Movie {
    // Extract year from release date
    const year = tmdbMovie.release_date ? parseInt(tmdbMovie.release_date.split('-')[0]) : 0;

    // Get genre names
    const genres = 'genres' in tmdbMovie
      ? tmdbMovie.genres.map(g => g.name)
      : tmdbMovie.genre_ids.map(id => this.genreCache.get(id) || 'Unknown');

    return {
      title: tmdbMovie.title,
      year,
      imdb: tmdbMovie.vote_average,
      description: tmdbMovie.overview || 'No description available.',
      poster: tmdbMovie.poster_path 
        ? `${this.config.imageBaseUrl}/w500${tmdbMovie.poster_path}`
        : undefined,
      tmdbId: tmdbMovie.id,
      runtime: 'runtime' in tmdbMovie ? tmdbMovie.runtime : undefined,
      genres,
      voteCount: tmdbMovie.vote_count,
      popularity: tmdbMovie.popularity,
      imdbId: 'imdb_id' in tmdbMovie ? tmdbMovie.imdb_id || undefined : undefined,
    };
  }

  async discoverMovies(params: DiscoverParams): Promise<Movie[]> {
    try {
      const response = await this.client.get<TMDBDiscoverResponse>('/discover/movie', {
        params: {
          with_genres: params.genres.join(','),
          'vote_average.gte': params.minRating || 7.0,
          'vote_count.gte': params.minVoteCount || 500,
          'primary_release_date.gte': params.releaseYearFrom ? `${params.releaseYearFrom}-01-01` : undefined,
          'primary_release_date.lte': params.releaseYearTo ? `${params.releaseYearTo}-12-31` : undefined,
          sort_by: params.sortBy || 'vote_average.desc',
          page: params.page || 1,
          region: this.config.region,
        },
      });

      return response.data.results.map(movie => this.convertToMovie(movie));
    } catch (error) {
      console.error('Error discovering movies:', error);
      throw new Error('Failed to fetch movies from TMDB');
    }
  }

  async getMovieDetails(movieId: number): Promise<Movie> {
    try {
      const response = await this.client.get<TMDBMovieDetails>(`/movie/${movieId}`);
      return this.convertToMovie(response.data);
    } catch (error) {
      console.error('Error fetching movie details:', error);
      throw new Error('Failed to fetch movie details');
    }
  }

  async searchMovies(query: string, page: number = 1): Promise<Movie[]> {
    try {
      const response = await this.client.get<TMDBDiscoverResponse>('/search/movie', {
        params: {
          query,
          page,
          region: this.config.region,
        },
      });

      return response.data.results.map(movie => this.convertToMovie(movie));
    } catch (error) {
      console.error('Error searching movies:', error);
      throw new Error('Failed to search movies');
    }
  }

  async getMoviesByGenreCombination(
    genreIds: number[],
    requireAll: boolean = false,
    limit: number = 10
  ): Promise<{ category: string; movies: Movie[] }> {
    const categoryName = getCategoryName(genreIds);
    
    // For requireAll, we need to get more results and filter
    // const fetchLimit = requireAll ? limit * 3 : limit;
    
    const movies = await this.discoverMovies({
      genres: genreIds,
      minRating: 7.0,
      minVoteCount: 1000,
      sortBy: 'vote_average.desc',
    });

    let filteredMovies = movies;
    
    if (requireAll && genreIds.length > 1) {
      // Filter to only movies that have ALL the requested genres
      filteredMovies = movies.filter(movie => {
        const movieGenreIds = movie.genres?.map(g => 
          Array.from(this.genreCache.entries())
            .find(([_, name]) => name === g)?.[0]
        ).filter(Boolean) || [];
        
        return genreIds.every(id => movieGenreIds.includes(id));
      });
    }

    return {
      category: categoryName,
      movies: filteredMovies.slice(0, limit),
    };
  }

  async getRecommendationsByRatings(
    genreRatings: Record<string, number>,
    threshold: number = 3.5
  ): Promise<Record<string, Movie[]>> {
    const recommendations: Record<string, Movie[]> = {};
    
    // Get top-rated genres
    const topGenres = Object.entries(genreRatings)
      .filter(([_, rating]) => rating >= threshold)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Fetch movies for each top genre
    for (const [genreName, _] of topGenres) {
      const genreIds = this.getGenreIdsByName(genreName);
      if (genreIds.length > 0) {
        const result = await this.getMoviesByGenreCombination(genreIds, false, 10);
        recommendations[result.category] = result.movies;
      }
    }

    // Look for strong genre combinations
    const genrePairs = this.findStrongGenrePairs(genreRatings, threshold);
    for (const pair of genrePairs) {
      const genreIds = pair.flatMap(name => this.getGenreIdsByName(name));
      if (genreIds.length > 1) {
        const result = await this.getMoviesByGenreCombination(genreIds, true, 10);
        if (result.movies.length > 0) {
          recommendations[result.category] = result.movies;
        }
      }
    }

    return recommendations;
  }

  private getGenreIdsByName(genreName: string): number[] {
    const ids: number[] = [];
    this.genreCache.forEach((name, id) => {
      if (name.toLowerCase() === genreName.toLowerCase()) {
        ids.push(id);
      }
    });
    return ids;
  }

  private findStrongGenrePairs(
    ratings: Record<string, number>,
    threshold: number
  ): string[][] {
    const pairs: string[][] = [];
    const genres = Object.keys(ratings);
    
    for (let i = 0; i < genres.length; i++) {
      for (let j = i + 1; j < genres.length; j++) {
        if (ratings[genres[i]] >= threshold && ratings[genres[j]] >= threshold) {
          pairs.push([genres[i], genres[j]]);
        }
      }
    }
    
    return pairs.slice(0, 3); // Limit to top 3 combinations
  }
}

// Create a singleton instance
let movieApiInstance: MovieApiService | null = null;

export function initializeMovieApi(apiKey: string): MovieApiService {
  if (!movieApiInstance) {
    movieApiInstance = new MovieApiService({
      apiKey,
      baseUrl: 'https://api.themoviedb.org/3',
      imageBaseUrl: 'https://image.tmdb.org/t/p',
      language: 'en-US',
    });
  }
  return movieApiInstance;
}

export function getMovieApi(): MovieApiService {
  if (!movieApiInstance) {
    throw new Error('Movie API not initialized. Call initializeMovieApi first.');
  }
  return movieApiInstance;
}