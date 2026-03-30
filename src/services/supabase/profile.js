import { userService } from './user';
import { favoritesService } from './favorites';
import { playlistService } from './playlist';
import { mostPlayedService } from './most-played';

// Legacy re-exports to maintain compatibility while shifting to individual files
export { userService, favoritesService, playlistService, mostPlayedService };
