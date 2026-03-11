import { useState } from 'react';
import { Paper, Group, Avatar, Textarea, Button, Text, SegmentedControl, Center, Box } from '@mantine/core';
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



const MAX_CHARS = 500;

/**
 * A compact post composer card shown at the top of the feed.
 * @param {{ user: object, profileData: object, onSubmit: (content: string, visibility: string, songId: string, playlistId: string) => Promise<void> }} props
 */
export function FeedPostComposer({ user, profileData, onSubmit }) {
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState('public');
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

  const remaining = MAX_CHARS - content.length;
  const isOver = remaining < 0;
  const isDisabled = !content.trim() || isOver || loading;

  return (
    <Paper p="md" radius="xl" withBorder className="community-panel">
      <Group gap="sm" wrap="nowrap" align="flex-start">
        <Avatar
          src={getProfileImageUrl(profileData || user)}
          size={38}
          radius="xl"
          color="primary"
          style={{ flexShrink: 0, marginTop: 2 }}
        >
          {(profileData?.display_name || user?.display_name || '?').charAt(0)}
        </Avatar>

        <div style={{ flex: 1 }}>
          <Textarea
            placeholder="What's on your mind? (Ctrl+Enter to post)"
            value={content}
            onChange={(e) => setContent(e.currentTarget.value)}
            onKeyDown={handleKeyDown}
            minRows={2}
            autosize
            maxRows={6}
            radius="md"
            styles={{ input: { fontSize: '0.9rem' } }}
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
                    size="xs" 
                    color="red" 
                    variant="filled" 
                    radius="xl"
                    onClick={() => { setImageFile(null); setImagePreview(null); }}
                    style={{ position: 'absolute', top: -5, right: -5, zIndex: 1 }}
                  >
                    <IconX size={10} />
                  </ActionIcon>
                </Box>
              )}
            </Group>
          )}

          <Group justify="space-between" mt="xs" align="center">
            <Group gap="xs">
              <SegmentedControl
                size="xs"
                value={visibility}
                onChange={setVisibility}
                disabled={loading}
                data={[
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
                ]}
              />
              
              <Group gap={4}>
                <Tooltip label="Attach Song" withArrow>
                  <ActionIcon 
                    variant="subtle" 
                    color="gray" 
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
                        disabled={loading || !!imageFile}
                      >
                        <IconPhoto size={18} />
                      </ActionIcon>
                    </Tooltip>
                  )}
                </FileButton>
              </Group>

              <Text
                size="xs"
                c={isOver ? 'red' : remaining <= 50 ? 'yellow' : 'dimmed'}
              >
                {remaining}
              </Text>
            </Group>
            <Button
              size="xs"
              leftSection={<IconSend size={14} />}
              onClick={handleSubmit}
              loading={loading}
              disabled={isDisabled}
            >
              Post
            </Button>
          </Group>
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
