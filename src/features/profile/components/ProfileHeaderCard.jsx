import { useState } from 'react';
import { Paper, Group, Box, Avatar, Stack, Title, Tooltip, Badge, Text, ActionIcon, Button, Divider } from '@mantine/core';
import IconUser from '@tabler/icons-react/dist/esm/icons/IconUser.mjs';
import IconCamera from '@tabler/icons-react/dist/esm/icons/IconCamera.mjs';
import IconCode from '@tabler/icons-react/dist/esm/icons/IconCode.mjs';
import IconGitPullRequest from '@tabler/icons-react/dist/esm/icons/IconGitPullRequest.mjs';
import IconBug from '@tabler/icons-react/dist/esm/icons/IconBug.mjs';
import IconMapPin from '@tabler/icons-react/dist/esm/icons/IconMapPin.mjs';
import IconStar from '@tabler/icons-react/dist/esm/icons/IconStar.mjs';
import IconListDetails from '@tabler/icons-react/dist/esm/icons/IconListDetails.mjs';
import IconQuote from '@tabler/icons-react/dist/esm/icons/IconQuote.mjs';
import IconPencil from '@tabler/icons-react/dist/esm/icons/IconPencil.mjs';
import IconX from '@tabler/icons-react/dist/esm/icons/IconX.mjs';
import IconCheck from '@tabler/icons-react/dist/esm/icons/IconCheck.mjs';
import { RichTextEditor, Link } from '@mantine/tiptap';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { notifications } from '@mantine/notifications';
import { userService } from '../../../services/supabase';
import { sanitizeHtml } from '../../../utils/sanitizeHtml';

/** Inline rich-text editor for the introduction */
function IntroductionEditor({ initialContent, onSave, onCancel }) {
  const [characterCount, setCharacterCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit, Link],
    content: initialContent || '',
    onUpdate: ({ editor }) => setCharacterCount(editor.getText().trim().length),
    onCreate: ({ editor }) => setCharacterCount(editor.getText().trim().length),
  });

  const isOverLimit = characterCount > 1000;

  const handleSave = async () => {
    if (!editor || isOverLimit) return;
    setIsSaving(true);
    try {
      const html = editor.getHTML();
      const value = html === '<p></p>' ? null : html;
      await onSave(value);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Stack gap="sm">
      <RichTextEditor
        editor={editor}
        style={{ minHeight: 140, borderColor: isOverLimit ? 'var(--mantine-color-red-filled)' : undefined }}
      >
        <RichTextEditor.Toolbar>
          <RichTextEditor.ControlsGroup>
            <RichTextEditor.Bold />
            <RichTextEditor.Italic />
            <RichTextEditor.Strikethrough />
            <RichTextEditor.ClearFormatting />
          </RichTextEditor.ControlsGroup>
          <RichTextEditor.ControlsGroup>
            <RichTextEditor.BulletList />
            <RichTextEditor.OrderedList />
          </RichTextEditor.ControlsGroup>
          <RichTextEditor.ControlsGroup>
            <RichTextEditor.Link />
            <RichTextEditor.Unlink />
          </RichTextEditor.ControlsGroup>
          <RichTextEditor.ControlsGroup>
            <RichTextEditor.Undo />
            <RichTextEditor.Redo />
          </RichTextEditor.ControlsGroup>
        </RichTextEditor.Toolbar>
        <RichTextEditor.Content />
      </RichTextEditor>

      <Group gap="xs" justify="space-between">
        <Text size="sm" c={isOverLimit ? 'red' : 'dimmed'} fw={isOverLimit ? 700 : 400}>
          {characterCount} / 1000 characters
        </Text>
        <Group gap="xs">
          <Button variant="default" leftSection={<IconX size={16} />} onClick={onCancel} disabled={isSaving} size="sm">
            Cancel
          </Button>
          <Button leftSection={<IconCheck size={16} />} onClick={handleSave} loading={isSaving} disabled={isOverLimit} size="sm" color={isOverLimit ? 'var(--theme-error)' : 'primary'}>
            Save
          </Button>
        </Group>
      </Group>
    </Stack>
  );
}

/**
 * ProfileHeaderCard — displays avatar, name, badges, branch info, and DX stats.
 * Also embeds the introduction section (replaces the standalone IntroductionCard).
 */
export function ProfileHeaderCard({
  profile,
  privacy,
  isOwner,
  mainBranchName,
  preferredBranchNames,
  onAvatarClick,
  // Introduction props
  introduction,
  onIntroductionUpdate,
}) {
  const [isEditingIntro, setIsEditingIntro] = useState(false);

  if (!profile) return null;

  const hasIntroContent = introduction && introduction !== '<p></p>';
  const showIntroSection = isOwner || hasIntroContent;

  // Only show the intro section if privacy allows or owner
  const introAllowed = privacy.show_introduction !== false || isOwner;

  const handleIntroSave = async (html) => {
    try {
      await userService.updateIntroduction(profile.id, html);
      onIntroductionUpdate?.(html);
      setIsEditingIntro(false);
      notifications.show({ title: 'Saved', message: 'Introduction updated', color: 'green' });
    } catch (e) {
      notifications.show({ title: 'Error', message: e.message || 'Failed to save', color: 'red' });
      throw e;
    }
  };

  return (
    <Paper shadow="sm" p="lg" radius="md" withBorder className="animate-fade-in delay-100">
      {/* ── Top row: avatar + info ── */}
      <Group wrap="nowrap" justify="space-between" align="flex-start">
        <Group wrap="nowrap" style={{ flex: 1 }}>
          <div
            style={{
              position: 'relative',
              cursor: isOwner ? 'pointer' : 'default',
              transition: 'transform 0.1s ease'
            }}
            className={isOwner ? 'hover-scale' : ''}
            onClick={onAvatarClick}
          >
            <Avatar
              src={profile.display_photo_url || profile.dx_display_photo_url}
              size={90}
              radius={90}
              color="primary"
            >
              <IconUser size={45} />
            </Avatar>
            {isOwner && (
              <Box
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  background: 'var(--theme-primary)',
                  color: 'var(--theme-primary-contrast)',
                  borderRadius: '50%',
                  width: 28,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
              >
                <IconCamera size={16} />
              </Box>
            )}
          </div>

          <Stack gap={4}>
            <Group gap="xs" align="center">
              <Title order={1} style={{ fontSize: '1.75rem', lineHeight: 1.2 }}>
                {profile.display_name || 'Anonymous Player'}
              </Title>

              {profile.user_attributions?.attributions?.length > 0 && (
                <Group gap={6} align="center" mt={4}>
                  {profile.user_attributions.attributions.includes('DEVELOPER') && (
                    <Tooltip label="Developer" withArrow position="top">
                      <Badge variant="light" color="primary" leftSection={<IconCode size={14} />}>
                        Developer
                      </Badge>
                    </Tooltip>
                  )}
                  {profile.user_attributions.attributions.includes('CONTRIBUTOR') && (
                    <Tooltip label="Contributor" withArrow position="top">
                      <Badge variant="light" color="accent" leftSection={<IconGitPullRequest size={14} />}>
                        Contributor
                      </Badge>
                    </Tooltip>
                  )}
                  {profile.user_attributions.attributions.includes('TESTER') && (
                    <Tooltip label="Tester" withArrow position="top">
                      <Badge variant="light" color="var(--theme-success)" leftSection={<IconBug size={14} />}>
                        Tester
                      </Badge>
                    </Tooltip>
                  )}
                </Group>
              )}
            </Group>

            {(privacy.show_main_branch || isOwner) && mainBranchName && (
              <Group gap={4} align="center">
                <IconMapPin size={14} style={{ color: 'var(--theme-primary)' }} />
                <Text size="sm" fw={500}>Main Branch: {mainBranchName}</Text>
              </Group>
            )}

            {(privacy.show_preferred_branches || isOwner) && preferredBranchNames.length > 0 && (
              <Group gap={6} align="center" wrap="wrap">
                <IconStar size={14} style={{ color: 'var(--theme-accent)' }} />
                <Text size="sm">Preferred:</Text>
                {preferredBranchNames.map((name, i) => (
                  <Badge key={i} size="sm" variant="light" color="secondary">{name}</Badge>
                ))}
              </Group>
            )}

            {profile.user_roles?.queue_name && (
              <Group gap={4} align="center">
                <IconListDetails size={14} style={{ color: 'var(--mantine-color-blue-5)' }} />
                <Text size="sm">Queue Name: <Text component="span" fw={600}>{profile.user_roles.queue_name}</Text></Text>
              </Group>
            )}

            {/* Mobile: DX Name + Rating inline */}
            <Stack gap={2} hiddenFrom="sm">
              {(privacy.show_maimai_name || isOwner) && profile.maimai_dx_name && (
                <Group gap={4} align="center">
                  <Text size="sm" fw={600}>DX Name:</Text>
                  <Text size="sm">{profile.maimai_dx_name}</Text>
                </Group>
              )}
              {(privacy.show_dx_rating || isOwner) && profile.maimai_best_scores?.total_rating && (
                <Group gap={4} align="center">
                  <Text size="sm" fw={600}>Rating:</Text>
                  <Text size="sm" fw={700} c="primary">{profile.maimai_best_scores.total_rating}</Text>
                </Group>
              )}
              {(privacy.show_circle !== false || isOwner) && profile.circle_name && (
                <Group gap={4} align="center">
                  <Text size="sm" fw={600}>Circle:</Text>
                  <Text size="sm">{profile.circle_name}</Text>
                </Group>
              )}
            </Stack>
          </Stack>
        </Group>

        <Stack gap={0} align="flex-end" visibleFrom="sm">
          {(privacy.show_maimai_name || isOwner) && profile.maimai_dx_name && (
            <Group gap={4}>
              <Text size="sm" c="secondary" fw={500}>maimai DX Name:</Text>
              <Text size="sm" fw={600}>{profile.maimai_dx_name}</Text>
            </Group>
          )}
          {(privacy.show_dx_rating || isOwner) && profile.maimai_best_scores?.total_rating && (
            <Stack gap={0} align="flex-end" mt={4}>
              <Text size="sm" fw={700} c="secondary" tt="uppercase" lts={1}>Rating</Text>
              <Text size="xl" fw={900} c="primary" style={{ fontSize: '2.5rem', lineHeight: 1 }}>
                {profile.maimai_best_scores.total_rating}
              </Text>
            </Stack>
          )}
          {(privacy.show_circle !== false || isOwner) && profile.circle_name && (
            <Group gap={4} mt={4}>
              <Text size="sm" c="secondary" fw={500}>Circle:</Text>
              <Text size="sm" fw={600}>{profile.circle_name}</Text>
            </Group>
          )}
        </Stack>
      </Group>

      {/* ── Introduction section ── */}
      {introAllowed && showIntroSection && (
        <>
          <Divider
            mt="md"
            mb="md"
            style={{ borderColor: 'color-mix(in srgb, var(--theme-primary) 15%, transparent)' }}
          />

          <Group justify="space-between" align="center" mb={isEditingIntro || hasIntroContent ? 'sm' : 0}>
            <Group gap="xs">
              <IconQuote size={18} style={{ color: 'var(--theme-accent)', flexShrink: 0 }} />
              <Text fw={700} size="sm" style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.01em' }}>
                Introduction
              </Text>
            </Group>

            {isOwner && !isEditingIntro && (
              <ActionIcon variant="subtle" color="gray" onClick={() => setIsEditingIntro(true)} title="Edit introduction">
                <IconPencil size={16} />
              </ActionIcon>
            )}
          </Group>

          {isEditingIntro ? (
            <IntroductionEditor
              initialContent={introduction}
              onSave={handleIntroSave}
              onCancel={() => setIsEditingIntro(false)}
            />
          ) : hasIntroContent ? (
            <div
              className="mantine-RichTextEditor-content"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(introduction, { mode: 'rich' }) }}
              style={{ lineHeight: 1.7, fontSize: '0.9rem' }}
            />
          ) : (
            // Owner, no content yet
            <Text
              c="dimmed"
              fs="italic"
              size="sm"
              style={{ cursor: 'pointer' }}
              onClick={() => setIsEditingIntro(true)}
            >
              Click the pencil icon to add an introduction…
            </Text>
          )}
        </>
      )}
    </Paper>
  );
}
