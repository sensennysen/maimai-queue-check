import { playlistCoreService } from './playlist-core';
import { playlistFeedService } from './playlist-feed';
import { playlistCommentService } from './playlist-comments';

/**
 * Aggregated playlist service maintaining legacy interface
 */
export const playlistService = {
  ...playlistCoreService,
  ...playlistFeedService,
  ...playlistCommentService
};

export { 
  playlistCoreService, 
  playlistFeedService, 
  playlistCommentService 
};
