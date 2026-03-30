import { useState } from 'react';
import { notifications } from '@mantine/notifications';
import { discussionService } from '../../../services/supabase';

/**
 * Hook to manage song tagging logic
 * @param {string} songId - The ID of the song
 * @param {object} user - The current user object
 * @param {object} userRoles - The current user's roles/profile
 * @param {Array} availableTags - List of all available tags
 * @param {Function} setDiscussionData - Function to update the parent discussion state
 */
export function useTagManagement(songId, user, userRoles, availableTags, setDiscussionData) {
  const [isTaggingLoading, setIsTaggingLoading] = useState(false);
  const [newTagValue, setNewTagValue] = useState('');

  const addTag = async (tagObjOrId) => {
    if (!user) return;
    setIsTaggingLoading(true);
    
    try {
      let tagId, tagName, description;
      
      if (typeof tagObjOrId === 'object') {
        tagId = tagObjOrId.tagId;
        tagName = tagObjOrId.tagName;
        description = tagObjOrId.description;
      } else {
        const tag = availableTags.find(t => t.id === tagObjOrId);
        tagId = tag.id;
        tagName = tag.tag_name;
        description = tag.description;
      }

      await discussionService.addSongTag(songId, tagId, user.id);
      
      setDiscussionData(prev => ({
        ...prev,
        tags: [
          ...prev.tags,
          {
            song_id: songId,
            tag_id: tagId,
            user_id: user.id,
            song_tags_dictionary: { tag_name: tagName, description: description },
            user_profiles: { 
              display_name: userRoles?.display_name || 'You', 
              display_photo_url: userRoles?.display_photo_url 
            }
          }
        ]
      }));
      notifications.show({ title: 'Tag Added', message: `Added tag "${tagName}".`, color: 'green' });
      return true;
    } catch (err) {
      console.error('Failed to add tag', err);
      notifications.show({ title: 'Error', message: 'Failed to add tag.', color: 'red' });
      return false;
    } finally {
      setIsTaggingLoading(false);
    }
  };

  const removeTag = async (tagId, tagName) => {
    if (!user) return;
    setIsTaggingLoading(true);
    try {
      await discussionService.removeSongTag(songId, tagId, user.id);
      setDiscussionData(prev => ({
        ...prev,
        tags: prev.tags.filter(t => !(t.tag_id === tagId && t.user_id === user.id))
      }));
      notifications.show({ title: 'Tag Removed', message: `Removed tag "${tagName}".`, color: 'blue' });
    } catch (err) {
      console.error('Failed to remove tag', err);
      notifications.show({ title: 'Error', message: 'Failed to remove tag.', color: 'red' });
    } finally {
      setIsTaggingLoading(false);
    }
  };

  const createAndAddTag = async (tagInput) => {
    const input = tagInput.trim();
    if (!input) return;

    const existingTag = availableTags.find(t => t.tag_name.toLowerCase() === input.toLowerCase());
    if (existingTag) {
      return await addTag(existingTag.id);
    }

    const description = window.prompt(`Enter a description for the new tag "${input}" (optional):`);
    if (description === null) return; // Cancelled

    setIsTaggingLoading(true);
    try {
      const isSuperAdmin = !!userRoles?.is_super_admin;
      const status = isSuperAdmin ? 'approved' : 'pending';
      const newTag = await discussionService.addCustomTag(input, description, status);
      await discussionService.addSongTag(songId, newTag.id, user.id);

      setDiscussionData(prev => ({
        ...prev,
        tags: [
          ...prev.tags,
          {
            song_id: songId,
            tag_id: newTag.id,
            user_id: user.id,
            song_tags_dictionary: { tag_name: newTag.tag_name, description: newTag.description },
            user_profiles: { 
              display_name: userRoles?.display_name || 'You', 
              display_photo_url: userRoles?.display_photo_url 
            }
          }
        ]
      }));
      
      setNewTagValue('');
      notifications.show({
        title: isSuperAdmin ? 'Tag Added' : 'Tag Requested',
        message: isSuperAdmin
          ? `Custom tag "${newTag.tag_name}" has been added and auto-approved.`
          : `Custom tag "${newTag.tag_name}" has been requested and is pending moderation.`,
        color: isSuperAdmin ? 'green' : 'blue'
      });
      return true;
    } catch (err) {
      console.error('Failed to create custom tag', err);
      notifications.show({ title: 'Error', message: 'Failed to create tag.', color: 'red' });
      return false;
    } finally {
      setIsTaggingLoading(false);
    }
  };

  return {
    isTaggingLoading,
    newTagValue,
    setNewTagValue,
    addTag,
    removeTag,
    createAndAddTag
  };
}
