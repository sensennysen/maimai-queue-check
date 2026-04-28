import { activityService } from './activity';
import { activityNotificationService } from './notifications';
import { postsService } from './posts';
import { playlistFeedService } from './playlist-feed';

// Legacy re-exports to maintain compatibility while shifting to individual files
export const feedService = {
  ...activityService,
  ...activityNotificationService,
  ...postsService,
  ...playlistFeedService,
  
  // Explicitly export notification methods that are used direct on feedService
  createActivityNotification: activityNotificationService.createActivityNotification,
  getActivityNotifications: activityNotificationService.getActivityNotifications,
  markActivityNotificationRead: activityNotificationService.markActivityNotificationRead,
  markAllActivityNotificationsRead: activityNotificationService.markAllActivityNotificationsRead,
};

export { activityService, activityNotificationService, postsService };
