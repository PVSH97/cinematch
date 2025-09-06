// TMDB API Response Types

export interface TMDBGenre {
  id: number;
  name: string;
}

export interface TMDBMovie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  release_date: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids: number[];
  adult: boolean;
  original_language: string;
  video: boolean;
}

export interface TMDBMovieDetails extends TMDBMovie {
  runtime: number;
  budget: number;
  revenue: number;
  genres: TMDBGenre[];
  production_companies: ProductionCompany[];
  production_countries: ProductionCountry[];
  spoken_languages: SpokenLanguage[];
  status: string;
  tagline: string;
  imdb_id: string | null;
}

export interface ProductionCompany {
  id: number;
  logo_path: string | null;
  name: string;
  origin_country: string;
}

export interface ProductionCountry {
  iso_3166_1: string;
  name: string;
}

export interface SpokenLanguage {
  english_name: string;
  iso_639_1: string;
  name: string;
}

export interface TMDBDiscoverResponse {
  page: number;
  results: TMDBMovie[];
  total_pages: number;
  total_results: number;
}

export interface TMDBGenresResponse {
  genres: TMDBGenre[];
}

// App-specific Movie Types

export interface Movie {
  title: string;
  year: number;
  imdb: number;
  metascore?: number;
  description: string;
  poster?: string;
  tmdbId?: number;
  runtime?: number;
  genres?: string[];
  voteCount?: number;
  popularity?: number;
  imdbId?: string;
}

export interface MovieRecommendations {
  [category: string]: Movie[];
}

// Cache Types

export interface CachedData<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// API Configuration

export interface MovieApiConfig {
  apiKey: string;
  baseUrl: string;
  imageBaseUrl: string;
  language?: string;
  region?: string;
}

// Search/Filter Parameters

export interface DiscoverParams {
  genres: number[];
  minRating?: number;
  minVoteCount?: number;
  releaseYearFrom?: number;
  releaseYearTo?: number;
  sortBy?: 'popularity.desc' | 'vote_average.desc' | 'release_date.desc';
  page?: number;
}