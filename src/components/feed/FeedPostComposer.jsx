import { useState, useMemo } from 'react';
import { Paper, Group, Avatar, Textarea, Button, Text, SegmentedControl, Center, Box, Stack } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import IconSend from '@tabler/icons-react/dist/esm/icons/IconSend.mjs';
import IconWorld from '@tabler/icons-react/dist/esm/icons/IconWorld.mjs';
import IconUsers from '@tabler/icons-react/dist/esm/icons/IconUsers.mjs';
import IconMusic from '@tabler/icons-react/dist/esm/icons/IconMusic.mjs';
import IconPlaylist from '@tabler/icons-react/dist/esm/icons/IconPlaylist.mjs';
import IconPhoto from '@tabler/icons-react/dist/esm/icons/IconPhoto.mjs';
import IconX from '@tabler/icons-react/dist/esm/icons/IconX.mjs';
import { getProfileImageUrl } from '../../utils/formatters';
import { SongPicker, PlaylistPicker, AttachmentPreview } from './AttachmentPickers';
import { Tooltip, ActionIcon, FileButton, Image as MantineImage } from '@mantine/core';
import { feedService } from '../../services/supabase';
import { APP_CONFIG } from '../../constants/config';
import { FEED_PLACEHOLDERS } from '../../constants/placeholders';


/**
 * A compact post composer card shown at the top of the feed.
 * @param {{ user: object, profileData: object, onSubmit: (content: string, visibility: string, songId: string, playlistId: string) => Promise<void> }} props
 */
export function FeedPostComposer({ user, profileData, onSubmit }) {
  const isMobile = useMediaQuery('(max-width: 48em)');
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

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSubmit();
    }
  };

  const remaining = APP_CONFIG.MAX_POST_LENGTH - content.length;
  const isOver = remaining < 0;
  const isDisabled = !content.trim() || isOver || loading;
  const characterCountClass = [
    'community-composer-count',
    content.length > 480
      ? 'community-composer-count--danger'
      : content.length > 400
        ? 'community-composer-count--warning'
        : '',
  ].filter(Boolean).join(' ');

  const placeholder = useMemo(() => {
    return FEED_PLACEHOLDERS[Math.floor(Math.random() * FEED_PLACEHOLDERS.length)];
  }, []);

  const visibilitySegmentData = useMemo(
    () => [
      {
        value: 'public',
        label: (
          <Center style={{ gap: 6 }}>
            <IconWorld size={14} />
            <span>Public</span>
          </Center>
        ),
      },
      {
        value: 'followers',
        label: (
          <Center style={{ gap: 6 }}>
            <IconUsers size={14} />
            <span>Followers</span>
          </Center>
        ),
      },
    ],
    []
  );

  return (
    <Paper p="md" radius="md" withBorder className="community-panel community-composer">
      <Group gap="sm" wrap="nowrap" align="flex-start">
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

        <div style={{ flex: 1 }}>
          <Textarea
            className="community-composer-input"
            placeholder={`${placeholder}`}
            aria-label="Create a feed post"
            value={content}
            onChange={(e) => setContent(e.currentTarget.value)}
            onKeyDown={handleKeyDown}
            minRows={2}
            autosize
            maxRows={6}
            radius="md"
            styles={{ input: { fontSize: '1rem' } }}
            disabled={loading}
          />

          {(attachedSong || attachedPlaylist || imagePreview) && (
            <Group gap="xs" mt="xs" align="flex-start">
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

          <Stack gap="sm" mt="sm" className="community-composer-controls">
            <Group justify="space-between" align="center" wrap="wrap" gap="sm" className="community-composer-footer">
              <SegmentedControl
                fullWidth={isMobile}
                size="sm"
                value={visibility}
                onChange={setVisibility}
                disabled={loading}
                data={visibilitySegmentData}
                className="community-composer-visibility"
              />

              <Group className="community-composer-actions" gap="xs" wrap="nowrap">
                <Group
                  className="community-composer-attachments"
                  gap="xs"
                  wrap="nowrap"
                  aria-label="Post attachments"
                >
                  <Tooltip label="Attach Song" withArrow>
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      size="sm"
                      aria-label="Attach song"
                      onClick={() => setSongPickerOpened(true)}
                      disabled={loading || !!attachedSong}
                    >
                      <IconMusic size={18} />
                    </ActionIcon>
                  </Tooltip>

                  <Tooltip label="Attach Playlist" withArrow>
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      size="sm"
                      aria-label="Attach playlist"
                      onClick={() => setPlaylistPickerOpened(true)}
                      disabled={loading || !!attachedPlaylist}
                    >
                      <IconPlaylist size={18} />
                    </ActionIcon>
                  </Tooltip>

                  <FileButton onChange={handleImageSelect} accept="image/png,image/jpeg,image/webp">
                    {(props) => (
                      <Tooltip label="Upload Image" withArrow>
                        <ActionIcon
                          {...props}
                          variant="subtle"
                          color="gray"
                          size="sm"
                          aria-label="Upload image"
                          disabled={loading || !!imageFile}
                        >
                          <IconPhoto size={18} />
                        </ActionIcon>
                      </Tooltip>
                    )}
                  </FileButton>
                </Group>

                <Group className="community-composer-submit-group" gap={0} wrap="nowrap">
                  <Text
                    size="sm"
                    ff="monospace"
                    className={characterCountClass}
                    aria-live="polite"
                  >
                    {content.length} / {APP_CONFIG.MAX_POST_LENGTH}
                  </Text>
                  <Button
                    size={isMobile ? 'compact-sm' : 'sm'}
                    radius="md"
                    className="community-composer-submit"
                    leftSection={<IconSend size={isMobile ? 14 : 16} />}
                    onClick={handleSubmit}
                    loading={loading}
                    disabled={isDisabled}
                  >
                    Post
                  </Button>
                </Group>
              </Group>
            </Group>
          </Stack>
        </div>
      </Group>

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
