import { Paper, Group, Title, Tooltip, ActionIcon, Stack, Loader, Badge, HoverCard, Text, Center, Autocomplete, Avatar, Box, Modal, Button } from '@mantine/core';
import { useState } from 'react';
import IconBook from '@tabler/icons-react/dist/esm/icons/IconBook.mjs';
import IconX from '@tabler/icons-react/dist/esm/icons/IconX.mjs';
import IconPlus from '@tabler/icons-react/dist/esm/icons/IconPlus.mjs';
import { getProfileImageUrl } from '../../../utils/formatters';

/**
 * TagSection component to manage song tags
 */
export function TagSection({ 
  discussionData, 
  loading, 
  user, 
  availableTags, 
  isTaggingLoading,
  newTagValue,
  setNewTagValue,
  onAddTag,
  onRemoveTag,
  onCreateAndAddTag,
  onOpenGlossary,
  isMobile = false,
}) {
  const [selectedTag, setSelectedTag] = useState(null);
  
  // Group tags by name for display
  const tagSummary = Object.values(
    discussionData.tags.reduce((acc, tagItem) => {
      const name = tagItem.song_tags_dictionary?.tag_name;
      if (name) {
        if (!acc[name]) {
          acc[name] = {
            tagId: tagItem.tag_id,
            tagName: name,
            description: tagItem.song_tags_dictionary?.description,
            count: 0,
            users: [],
            hasAdded: false
          };
        }
        acc[name].count += 1;
        if (tagItem.user_profiles) {
          acc[name].users.push(tagItem.user_profiles);
        }
        if (user && tagItem.user_id === user.id) {
          acc[name].hasAdded = true;
        }
      }
      return acc;
    }, {})
  ).sort((a, b) => b.count - a.count);

  const renderTagDetails = (tagObj) => (
    <Stack gap="xs">
      <Text size="sm" fw={700}>{tagObj.tagName}</Text>
      {tagObj.description ? (
        <Text size="sm" c="dimmed" style={{ whiteSpace: 'pre-wrap' }}>{tagObj.description}</Text>
      ) : (
        <Text size="sm" c="dimmed" fs="italic">No description available.</Text>
      )}
      <Box mt="xs">
        <Text size="sm" fw={500} mb={4}>Added by:</Text>
        <Avatar.Group spacing="sm">
          {tagObj.users.slice(0, 5).map((u, i) => (
            <Tooltip key={i} label={u?.display_name || 'Unknown'}>
              <Avatar src={getProfileImageUrl(u)} size="sm" radius="xl" />
            </Tooltip>
          ))}
          {tagObj.users.length > 5 && (
            <Tooltip label={`${tagObj.users.length - 5} more`}>
              <Avatar size="sm" radius="xl">+{tagObj.users.length - 5}</Avatar>
            </Tooltip>
          )}
        </Avatar.Group>
      </Box>
      {user && !tagObj.hasAdded && (
        <Text size="sm" c="blue" mt="xs" fw={500}>
          {isMobile ? 'Tap add to attach this tag' : 'Click badge to add this tag'}
        </Text>
      )}
    </Stack>
  );

  return (
    <>
      <Paper p="md" radius="md" withBorder>
        <Group justify="space-between" align="center" mb="sm">
          <Title order={4}>Tags</Title>
          <Tooltip label="Tag Glossary">
            <ActionIcon variant="light" color="blue" onClick={onOpenGlossary}>
              <IconBook size={18} />
            </ActionIcon>
          </Tooltip>
        </Group>

        {loading ? <Loader size="sm" /> : (
          <Stack gap="sm">
            {tagSummary.length > 0 ? (
              <Group gap="xs">
                {tagSummary.map((tagObj) => (
                  isMobile ? (
                    <Badge
                      key={tagObj.tagName}
                      variant={tagObj.hasAdded ? 'filled' : 'light'}
                      color="var(--theme-primary)"
                      size="lg"
                      style={{ cursor: 'pointer', paddingRight: tagObj.hasAdded ? 0 : undefined }}
                      onClick={() => setSelectedTag(tagObj)}
                      rightSection={
                        tagObj.hasAdded ? (
                          <ActionIcon
                            size="xs"
                            color="var(--theme-primary-contrast)"
                            radius="xl"
                            variant="transparent"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveTag(tagObj.tagId, tagObj.tagName);
                            }}
                          >
                            <IconX size={10} />
                          </ActionIcon>
                        ) : null
                      }
                    >
                      {tagObj.tagName} <Text span size="sm" c={tagObj.hasAdded ? 'var(--theme-primary-contrast)' : 'dimmed'} ml={4} opacity={tagObj.hasAdded ? 0.8 : 1}>({tagObj.count})</Text>
                    </Badge>
                  ) : (
                    <HoverCard width={280} shadow="md" withArrow openDelay={200} closeDelay={400} key={tagObj.tagName}>
                      <HoverCard.Target>
                        <Badge
                          variant={tagObj.hasAdded ? 'filled' : 'light'}
                          color="var(--theme-primary)"
                          size="lg"
                          style={{ cursor: user ? 'pointer' : 'default', paddingRight: tagObj.hasAdded ? 0 : undefined }}
                          onClick={() => !tagObj.hasAdded && onAddTag(tagObj)}
                          rightSection={
                            tagObj.hasAdded ? (
                              <ActionIcon size="xs" color="var(--theme-primary-contrast)" radius="xl" variant="transparent"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onRemoveTag(tagObj.tagId, tagObj.tagName);
                                }}
                              >
                                <IconX size={10} />
                              </ActionIcon>
                            ) : null
                          }
                        >
                          {tagObj.tagName} <Text span size="sm" c={tagObj.hasAdded ? 'var(--theme-primary-contrast)' : 'dimmed'} ml={4} opacity={tagObj.hasAdded ? 0.8 : 1}>({tagObj.count})</Text>
                        </Badge>
                      </HoverCard.Target>
                      <HoverCard.Dropdown>
                        {renderTagDetails(tagObj)}
                      </HoverCard.Dropdown>
                    </HoverCard>
                  )
                ))}
              </Group>
            ) : (
              <Paper p="sm" bg="var(--mantine-color-default-hover)" radius="md">
                <Center>
                  <Text size="sm" c="dimmed" fs="italic">No tags yet. Be the first!</Text>
                </Center>
              </Paper>
            )}

            {user ? (
              <Stack gap="xs" mt="xs">
                <Group wrap={isMobile ? 'wrap' : 'nowrap'} align="flex-end">
                  <Autocomplete
                    label="Add Tag"
                    placeholder="Select or type..."
                    data={availableTags.map(t => t.tag_name)}
                    value={newTagValue}
                    onChange={setNewTagValue}
                    style={{ flex: 1 }}
                    disabled={isTaggingLoading}
                    maxLength={30}
                  />
                  <ActionIcon
                    variant="filled"
                    color="blue"
                    size="input-sm"
                    loading={isTaggingLoading}
                    onClick={() => onCreateAndAddTag(newTagValue)}
                    style={isMobile ? { width: '100%', height: 36 } : undefined}
                  >
                    <IconPlus size={16} />
                  </ActionIcon>
                </Group>
                {!availableTags.find(t => t.tag_name.toLowerCase() === newTagValue.trim().toLowerCase()) && newTagValue.trim() !== '' && (
                  <Text size="sm" c="dimmed">
                    This is a new tag. You can add a description after clicking the plus icon.
                  </Text>
                )}
              </Stack>
            ) : (
              <Text size="sm" c="dimmed" fs="italic" ta="center" mt="xs">
                Log in to add tags
              </Text>
            )}
          </Stack>
        )}
      </Paper>

      <Modal
        opened={!!selectedTag}
        onClose={() => setSelectedTag(null)}
        title={selectedTag?.tagName || 'Tag details'}
        centered
      >
        {selectedTag && (
          <Stack gap="md">
            {renderTagDetails(selectedTag)}
            {user && !selectedTag.hasAdded && (
              <Button
                leftSection={<IconPlus size={16} />}
                onClick={() => {
                  onAddTag(selectedTag);
                  setSelectedTag(null);
                }}
              >
                Add Tag
              </Button>
            )}
          </Stack>
        )}
      </Modal>
    </>
  );
}
