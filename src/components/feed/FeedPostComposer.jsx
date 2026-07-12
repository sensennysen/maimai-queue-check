import { useId, useMemo, useState } from 'react';
import {
  ActionIcon,
  Avatar,
  Box,
  FileButton,
  Group,
  Image as MantineImage,
  Paper,
  Text,
  Textarea,
  Tooltip,
} from '@mantine/core';
import IconSend from '@tabler/icons-react/dist/esm/icons/IconSend.mjs';
import IconWorld from '@tabler/icons-react/dist/esm/icons/IconWorld.mjs';
import IconUsers from '@tabler/icons-react/dist/esm/icons/IconUsers.mjs';
import IconMusic from '@tabler/icons-react/dist/esm/icons/IconMusic.mjs';
import IconPlaylist from '@tabler/icons-react/dist/esm/icons/IconPlaylist.mjs';
import IconPhoto from '@tabler/icons-react/dist/esm/icons/IconPhoto.mjs';
import IconX from '@tabler/icons-react/dist/esm/icons/IconX.mjs';
import { getProfileImageUrl } from '../../utils/formatters';
import { SongPicker, PlaylistPicker, AttachmentPreview } from './AttachmentPickers';
import { feedService } from '../../services/supabase';
import { APP_CONFIG } from '../../constants/config';
import { FEED_PLACEHOLDERS } from '../../constants/placeholders';


/**
 * A compact post composer card shown at the top of the feed.
 * @param {{ user: object, profileData: object, onSubmit: (content: string, visibility: string, songId: string, playlistId: string) => Promise<void> }} props
 */
export function FeedPostComposer({ user, profileData, onSubmit }) {
  const characterCountId = useId();
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState(APP_CONFIG.DEFAULT_VISIBILITY);
  const [loading, setLoading] = useState(false);
  
  const [attachedSong, setAttachedSong] = useState(null);
  const [attachedPlaylist, setAttachedPlaylist] = useState(null);
  const [songPickerOpened, setSongPickerOpened] = useState(false);
  const [playlistPickerOpened, setPlaylistPickerOpened] = useState(false);

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);



  const stripMetadata = async (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((blob) => {
            resolve(new File([blob], `post_${Date.now()}.jpg`, { type: 'image/jpeg' }));
          }, 'image/jpeg', 0.9);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageSelect = (file) => {
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    const trimmed = content.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    try {
      let imageUrl = null;
      if (imageFile) {
        const safeFile = await stripMetadata(imageFile);
        imageUrl = await feedService.uploadPostImage(user.id, safeFile);
      }

      await onSubmit(
        trimmed, 
        visibility, 
        attachedSong?.id || attachedSong?.songId || null, 
        attachedPlaylist?.id || null,
        imageUrl
      );
      setContent('');
      setAttachedSong(null);
      setAttachedPlaylist(null);
      setImageFile(null);
      setImagePreview(null);
    } catch (err) {
      console.error('Submit error:', err);
    } finally {
      setLoading(false);
    }
  };

  const maxLength = APP_CONFIG.MAX_POST_LENGTH;
  const warningThreshold = Math.floor(maxLength * 0.85);
  const isOver = content.length > maxLength;
  const isDisabled = !content.trim() || isOver || loading;
  const characterCountClass = [
    'community-composer-count',
    content.length >= maxLength
      ? 'community-composer-count--danger'
      : content.length >= warningThreshold
        ? 'community-composer-count--warning'
        : '',
  ].filter(Boolean).join(' ');

  const placeholder = useMemo(() => {
    return FEED_PLACEHOLDERS[Math.floor(Math.random() * FEED_PLACEHOLDERS.length)];
  }, []);

  const visibilityOptions = useMemo(() => [
    { value: 'public', label: 'Public', icon: IconWorld },
    { value: 'followers', label: 'Followers', icon: IconUsers },
  ], []);

  const attachmentButtonClass = (isActive) => [
    'community-composer-attachment-button',
    isActive ? 'community-composer-attachment-button--active' : '',
  ].filter(Boolean).join(' ');

  return (
    <Paper p={0} radius="md" withBorder className="community-panel community-composer">
      <div className="community-composer-input-section">
        <Avatar
          src={getProfileImageUrl(profileData || user)}
          size={38}
          radius="xl"
          color="primary"
          className="community-composer-avatar"
          style={{ flexShrink: 0, marginTop: 2 }}
        >
          {(profileData?.display_name || user?.display_name || '?').charAt(0)}
        </Avatar>

        <div className="community-composer-input-column">
          <Textarea
            className="community-composer-input"
            placeholder={placeholder}
            aria-label="Write a post"
            aria-describedby={characterCountId}
            aria-invalid={isOver}
            value={content}
            onChange={(e) => setContent(e.currentTarget.value)}
            minRows={2}
            autosize
            maxRows={6}
            disabled={loading}
          />

          {(attachedSong || attachedPlaylist || imagePreview) && (
            <Group gap="xs" mt="sm" align="flex-start" className="community-composer-previews">
              {attachedSong && (
                <AttachmentPreview 
                  type="song" 
                  item={attachedSong} 
                  onClear={() => setAttachedSong(null)} 
                />
              )}
              {attachedPlaylist && (
                <AttachmentPreview 
                  type="playlist" 
                  item={attachedPlaylist} 
                  onClear={() => setAttachedPlaylist(null)} 
                />
              )}
              {imagePreview && (
                <Box style={{ position: 'relative', width: 80, height: 80 }}>
                  <MantineImage 
                    src={imagePreview} 
                    radius="md" 
                    h={80} 
                    w={80} 
                    fit="cover" 
                  />
                  <ActionIcon 
                    size="sm" 
                    color="red" 
                    variant="filled" 
                    radius="xl"
                    aria-label="Remove uploaded image"
                    onClick={() => { setImageFile(null); setImagePreview(null); }}
                    style={{ position: 'absolute', top: -5, right: -5, zIndex: 1 }}
                  >
                    <IconX size={12} />
                  </ActionIcon>
                </Box>
              )}
            </Group>
          )}
        </div>
      </div>

      <div className="community-composer-toolbar">
        <div
          className="community-composer-visibility"
          role="radiogroup"
          aria-label="Post visibility"
        >
          {visibilityOptions.map(({ value, label, icon: VisibilityIcon }) => {
            const isSelected = visibility === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={isSelected}
                className={`community-composer-visibility-option${isSelected ? ' is-selected' : ''}`}
                onClick={() => setVisibility(value)}
                disabled={loading}
              >
                <VisibilityIcon size={15} aria-hidden="true" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        <Group
          className="community-composer-attachments"
          gap={4}
          wrap="nowrap"
          aria-label="Post attachments"
        >
          <Tooltip label="Attach a song" withArrow>
            <ActionIcon
              variant="subtle"
              size="md"
              className={attachmentButtonClass(!!attachedSong)}
              aria-label="Attach a song"
              aria-pressed={!!attachedSong}
              onClick={() => setSongPickerOpened(true)}
              disabled={loading}
            >
              <IconMusic size={18} />
            </ActionIcon>
          </Tooltip>

          <Tooltip label="Attach a playlist" withArrow>
            <ActionIcon
              variant="subtle"
              size="md"
              className={attachmentButtonClass(!!attachedPlaylist)}
              aria-label="Attach a playlist"
              aria-pressed={!!attachedPlaylist}
              onClick={() => setPlaylistPickerOpened(true)}
              disabled={loading}
            >
              <IconPlaylist size={18} />
            </ActionIcon>
          </Tooltip>

          <FileButton onChange={handleImageSelect} accept="image/png,image/jpeg,image/webp">
            {(props) => (
              <Tooltip label="Attach a photo" withArrow>
                <ActionIcon
                  {...props}
                  variant="subtle"
                  size="md"
                  className={attachmentButtonClass(!!imageFile)}
                  aria-label="Attach a photo"
                  aria-pressed={!!imageFile}
                  disabled={loading}
                >
                  <IconPhoto size={18} />
                </ActionIcon>
              </Tooltip>
            )}
          </FileButton>
        </Group>
      </div>

      <div className="community-composer-action-row">
        <Text
          id={characterCountId}
          component="span"
          className={characterCountClass}
          aria-live="polite"
        >
          {content.length} / {maxLength}
        </Text>
        <button
          type="button"
          className="community-composer-submit app-flat-primary-button"
          onClick={handleSubmit}
          disabled={isDisabled}
          aria-busy={loading ? 'true' : undefined}
        >
          <span className="app-flat-primary-button__icon" aria-hidden="true">
            <IconSend size={16} />
          </span>
          <span>{loading ? 'Posting...' : 'Post'}</span>
        </button>
      </div>

      <SongPicker 
        opened={songPickerOpened} 
        onClose={() => setSongPickerOpened(false)} 
        onSelect={setAttachedSong} 
      />
      <PlaylistPicker 
        opened={playlistPickerOpened} 
        onClose={() => setPlaylistPickerOpened(false)} 
        onSelect={setAttachedPlaylist} 
      />
    </Paper>
  );
}
