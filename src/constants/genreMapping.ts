// TMDB Genre IDs as of 2024
// Source: https://api.themoviedb.org/3/genre/movie/list

export const TMDB_GENRE_IDS = {
  ACTION: 28,
  ADVENTURE: 12,
  ANIMATION: 16,
  COMEDY: 35,
  CRIME: 80,
  DOCUMENTARY: 99,
  DRAMA: 18,
  FAMILY: 10751,
  FANTASY: 14,
  HISTORY: 36,
  HORROR: 27,
  MUSIC: 10402,
  MYSTERY: 9648,
  ROMANCE: 10749,
  SCIENCE_FICTION: 878,
  TV_MOVIE: 10770,
  THRILLER: 53,
  WAR: 10752,
  WESTERN: 37,
} as const;

// Mapping from app genre names to TMDB genre IDs
export const GENRE_NAME_TO_TMDB_ID: Record<string, number[]> = {
  'Action': [TMDB_GENRE_IDS.ACTION],
  'Adventure': [TMDB_GENRE_IDS.ADVENTURE],
  'Animation': [TMDB_GENRE_IDS.ANIMATION],
  'Biography': [TMDB_GENRE_IDS.HISTORY, TMDB_GENRE_IDS.DRAMA], // TMDB doesn't have Biography, use History + Drama
  'Comedy': [TMDB_GENRE_IDS.COMEDY],
  'Crime': [TMDB_GENRE_IDS.CRIME],
  'Documentary': [TMDB_GENRE_IDS.DOCUMENTARY],
  'Drama': [TMDB_GENRE_IDS.DRAMA],
  'Family': [TMDB_GENRE_IDS.FAMILY],
  'Fantasy': [TMDB_GENRE_IDS.FANTASY],
  'Film-Noir': [TMDB_GENRE_IDS.CRIME, TMDB_GENRE_IDS.THRILLER], // Film-Noir not in TMDB, use Crime + Thriller
  'Game-Show': [], // Not applicable for movies
  'History': [TMDB_GENRE_IDS.HISTORY],
  'Horror': [TMDB_GENRE_IDS.HORROR],
  'Music': [TMDB_GENRE_IDS.MUSIC],
  'Musical': [TMDB_GENRE_IDS.MUSIC], // Musical uses Music genre in TMDB
  'Mystery': [TMDB_GENRE_IDS.MYSTERY],
  'News': [], // Not applicable for movies
  'Reality-TV': [], // Not applicable for movies
  'Romance': [TMDB_GENRE_IDS.ROMANCE],
  'Sci-Fi': [TMDB_GENRE_IDS.SCIENCE_FICTION],
  'Short': [], // Not a genre in TMDB
  'Sport': [TMDB_GENRE_IDS.DRAMA], // Sport movies typically categorized as Drama in TMDB
  'Talk-Show': [], // Not applicable for movies
  'Thriller': [TMDB_GENRE_IDS.THRILLER],
  'War': [TMDB_GENRE_IDS.WAR],
  'Western': [TMDB_GENRE_IDS.WESTERN],
};

// Reverse mapping for display purposes
export const TMDB_ID_TO_GENRE_NAME: Record<number, string> = {
  [TMDB_GENRE_IDS.ACTION]: 'Action',
  [TMDB_GENRE_IDS.ADVENTURE]: 'Adventure',
  [TMDB_GENRE_IDS.ANIMATION]: 'Animation',
  [TMDB_GENRE_IDS.COMEDY]: 'Comedy',
  [TMDB_GENRE_IDS.CRIME]: 'Crime',
  [TMDB_GENRE_IDS.DOCUMENTARY]: 'Documentary',
  [TMDB_GENRE_IDS.DRAMA]: 'Drama',
  [TMDB_GENRE_IDS.FAMILY]: 'Family',
  [TMDB_GENRE_IDS.FANTASY]: 'Fantasy',
  [TMDB_GENRE_IDS.HISTORY]: 'History',
  [TMDB_GENRE_IDS.HORROR]: 'Horror',
  [TMDB_GENRE_IDS.MUSIC]: 'Music',
  [TMDB_GENRE_IDS.MYSTERY]: 'Mystery',
  [TMDB_GENRE_IDS.ROMANCE]: 'Romance',
  [TMDB_GENRE_IDS.SCIENCE_FICTION]: 'Sci-Fi',
  [TMDB_GENRE_IDS.TV_MOVIE]: 'TV Movie',
  [TMDB_GENRE_IDS.THRILLER]: 'Thriller',
  [TMDB_GENRE_IDS.WAR]: 'War',
  [TMDB_GENRE_IDS.WESTERN]: 'Western',
};

// Genre combinations that work well together
export const GENRE_COMBINATIONS = {
  'War/Drama': [TMDB_GENRE_IDS.WAR, TMDB_GENRE_IDS.DRAMA],
  'Crime/Drama': [TMDB_GENRE_IDS.CRIME, TMDB_GENRE_IDS.DRAMA],
  'Sci-Fi/Thriller': [TMDB_GENRE_IDS.SCIENCE_FICTION, TMDB_GENRE_IDS.THRILLER],
  'Action/Adventure': [TMDB_GENRE_IDS.ACTION, TMDB_GENRE_IDS.ADVENTURE],
  'Comedy/Romance': [TMDB_GENRE_IDS.COMEDY, TMDB_GENRE_IDS.ROMANCE],
  'Horror/Thriller': [TMDB_GENRE_IDS.HORROR, TMDB_GENRE_IDS.THRILLER],
  'Fantasy/Adventure': [TMDB_GENRE_IDS.FANTASY, TMDB_GENRE_IDS.ADVENTURE],
  'Mystery/Thriller': [TMDB_GENRE_IDS.MYSTERY, TMDB_GENRE_IDS.THRILLER],
  'Historical Drama': [TMDB_GENRE_IDS.HISTORY, TMDB_GENRE_IDS.DRAMA],
  'Crime/Thriller': [TMDB_GENRE_IDS.CRIME, TMDB_GENRE_IDS.THRILLER],
};

// Utility function to get TMDB genre IDs from app genre names
export function getGenreIds(genreNames: string[]): number[] {
  const ids = new Set<number>();
  
  genreNames.forEach(name => {
    const mappedIds = GENRE_NAME_TO_TMDB_ID[name] || [];
    mappedIds.forEach(id => ids.add(id));
  });
  
  return Array.from(ids);
}

// Utility function to generate category name from genre IDs
export function getCategoryName(genreIds: number[]): string {
  const genreNames = genreIds
    .map(id => TMDB_ID_TO_GENRE_NAME[id])
    .filter(Boolean);
  
  if (genreNames.length === 0) return 'General';
  if (genreNames.length === 1) return genreNames[0];
  if (genreNames.length === 2) return genreNames.join('/');
  
  return `${genreNames.slice(0, 2).join('/')} & More`;
}