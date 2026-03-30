import { useState } from 'react';
import { Paper, Group, Title, Text, ActionIcon, Button, Stack } from '@mantine/core';
import IconQuote from '@tabler/icons-react/dist/esm/icons/IconQuote.mjs';
import IconPencil from '@tabler/icons-react/dist/esm/icons/IconPencil.mjs';
import IconX from '@tabler/icons-react/dist/esm/icons/IconX.mjs';
import IconCheck from '@tabler/icons-react/dist/esm/icons/IconCheck.mjs';
import { RichTextEditor, Link } from '@mantine/tiptap';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { notifications } from '@mantine/notifications';
import { userService } from '../../services/supabase';

import { sanitizeHtml } from '../../utils/sanitizeHtml';

function IntroductionEditor({ initialContent, onSave, onCancel }) {
  const [characterCount, setCharacterCount] = useState(0);

  const editor = useEditor({
    extensions: [StarterKit, Link],
    content: initialContent || '',
    onUpdate: ({ editor }) => {
      setCharacterCount(editor.getText().trim().length);
    },
    onCreate: ({ editor }) => {
      setCharacterCount(editor.getText().trim().length);
    },
  });

  const [isSaving, setIsSaving] = useState(false);
  const isOverLimit = characterCount > 1000;

  const handleSave = async () => {
    if (!editor || isOverLimit) return;
    setIsSaving(true);
    try {
      const html = editor.getHTML();
      // Treat an empty paragraph as null
      const value = html === '<p></p>' ? null : html;
      await onSave(value);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Stack gap="sm">
      <RichTextEditor editor={editor} style={{ minHeight: 140, borderColor: isOverLimit ? 'var(--mantine-color-red-filled)' : undefined }}>
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
          <Button
            variant="default"
            leftSection={<IconX size={16} />}
            onClick={onCancel}
            disabled={isSaving}
            size="sm"
          >
            Cancel
          </Button>
          <Button
            leftSection={<IconCheck size={16} />}
            onClick={handleSave}
            loading={isSaving}
            disabled={isOverLimit}
            size="sm"
            color={isOverLimit ? 'var(--theme-error)' : 'primary'}
          >
            Save
          </Button>
        </Group>
      </Group>
    </Stack>
  );
}

export function IntroductionCard({ introduction, isOwnProfile, userId, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);

  const hasContent = introduction && introduction !== '<p></p>';

  // Viewers: hide entirely if no content
  if (!isOwnProfile && !hasContent) return null;

  const handleSave = async (html) => {
    try {
      await userService.updateIntroduction(userId, html);
      onUpdate(html);
      setIsEditing(false);
      notifications.show({ title: 'Saved', message: 'Introduction updated', color: 'green' });
    } catch (e) {
      notifications.show({ title: 'Error', message: e.message || 'Failed to save', color: 'red' });
      throw e; // re-throw so editor keeps isSaving in sync
    }
  };

  return (
    <Paper shadow="sm" p="lg" radius="md" withBorder className="animate-fade-in delay-200">
      <Group justify="space-between" mb={isEditing || hasContent ? 'md' : 0}>
        <Group gap="xs">
          <IconQuote size={24} style={{ color: 'var(--theme-accent)' }} />
          <Title order={2}>Introduction</Title>
        </Group>

        {isOwnProfile && !isEditing && (
          <ActionIcon
            variant="subtle"
            color="gray"
            onClick={() => setIsEditing(true)}
            title="Edit introduction"
          >
            <IconPencil size={18} />
          </ActionIcon>
        )}
      </Group>

      {isEditing ? (
        <IntroductionEditor
          initialContent={introduction}
          onSave={handleSave}
          onCancel={() => setIsEditing(false)}
        />
      ) : hasContent ? (
        <div
          className="mantine-RichTextEditor-content"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(introduction, { mode: 'rich' }) }}
          style={{ lineHeight: 1.7 }}
        />
      ) : (
        // Owner, no content yet
        <Text
          c="dimmed"
          fs="italic"
          style={{ cursor: 'pointer' }}
          onClick={() => setIsEditing(true)}
        >
          Click the pencil icon to add an introduction…
        </Text>
      )}
    </Paper>
  );
}
