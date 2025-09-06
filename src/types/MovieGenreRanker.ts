// Type definitions for MovieGenreRanker component
import type { Movie } from './movie';

export interface GenreRatings {
  [genre: string]: number;
}

export interface GenreScore {
  scores: number[]; // Array of scores from each voter
  average: number;
  total: number;
}

export interface GenreScores {
  [genre: string]: GenreScore;
}

export interface MovieWatchStatus {
  [movieKey: string]: {
    [personId: string]: boolean; // Dynamic person IDs like "person1", "person2", etc.
  };
}

export interface VoterInfo {
  id: number;
  name: string;
}

export interface SavedMovie extends Movie {
  category: string;
  key: string;
}

export interface GenreDescriptions {
  [genre: string]: string;
}