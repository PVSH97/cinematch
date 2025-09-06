// Type definitions for MovieGenreRanker component
import type { Movie } from './movie';

export interface GenreRatings {
  [genre: string]: number;
}

export interface GenreScore {
  person1: number;
  person2: number;
  average: number;
  total: number;
}

export interface GenreScores {
  [genre: string]: GenreScore;
}

export interface MovieWatchStatus {
  [movieKey: string]: {
    person1?: boolean;
    person2?: boolean;
  };
}

export interface SavedMovie extends Movie {
  category: string;
  key: string;
}

export interface GenreDescriptions {
  [genre: string]: string;
}