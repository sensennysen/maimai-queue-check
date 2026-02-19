import { useState, useEffect, useCallback } from 'react';
import { Stack, Button, Group, Title, Text, Paper, Loader, Alert } from '@mantine/core';
import { RichTextEditor, Link } from '@mantine/tiptap';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import IconAlertCircle from '@tabler/icons-react/dist/esm/icons/IconAlertCircle.mjs';
import IconCheck from '@tabler/icons-react/dist/esm/icons/IconCheck.mjs';
import IconDeviceFloppy from '@tabler/icons-react/dist/esm/icons/IconDeviceFloppy.mjs';
import { rulesService } from '../../../services/supabase';
import { notifications } from '@mantine/notifications';

const QueueRuleEditor = ({ branchId, branchName }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link,
    ],
    content: '',
  });

  const fetchRules = useCallback(async () => {
    if (!editor) return;
    setLoading(true);
    setError(null);
    try {
      const data = await rulesService.getRules(branchId);
      if (data?.rules) {
        editor.commands.setContent(data.rules);
      } else {
        editor.commands.setContent('<p>Please ask the locals in the area about the queue rules.</p>');
      }
    } catch (err) {
      console.error('Error fetching rules:', err);
      setError('Failed to load existing rules.');
    } finally {
      setLoading(false);
    }
  }, [branchId, editor]);

  useEffect(() => {
    if (branchId && editor) {
      fetchRules();
    }
  }, [branchId, editor, fetchRules]);

  const handleSave = async () => {
    if (!editor) return;

    setSaving(true);
    setError(null);
    try {
      const html = editor.getHTML();
      await rulesService.updateRules(branchId, html);
      notifications.show({
        title: 'Success',
        message: 'Queue rules updated successfully',
        color: 'green',
        icon: <IconCheck size={16} />,
      });
    } catch (err) {
      console.error('Error saving rules:', err);
      setError('Failed to save rules. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Group justify="center" py="xl">
        <Loader size="md" />
        <Text>Loading editor...</Text>
      </Group>
    );
  }

  return (
    <Stack gap="md">
      <Paper p="md" withBorder radius="md">
        <Stack gap="xs">
          <Title order={4}>Editing Rules for {branchName}</Title>
          <Text size="sm" c="dimmed">
            This will be displayed to all users visiting this branch's queue page.
          </Text>
        </Stack>
      </Paper>

      {error && (
        <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
          {error}
        </Alert>
      )}

      <RichTextEditor editor={editor}>
        <RichTextEditor.Toolbar sticky stickyOffset={60}>
          <RichTextEditor.ControlsGroup>
            <RichTextEditor.Bold />
            <RichTextEditor.Italic />
            <RichTextEditor.Strikethrough />
            <RichTextEditor.ClearFormatting />
            <RichTextEditor.Code />
          </RichTextEditor.ControlsGroup>

          <RichTextEditor.ControlsGroup>
            <RichTextEditor.H1 />
            <RichTextEditor.H2 />
            <RichTextEditor.H3 />
            <RichTextEditor.H4 />
          </RichTextEditor.ControlsGroup>

          <RichTextEditor.ControlsGroup>
            <RichTextEditor.Blockquote />
            <RichTextEditor.Hr />
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

      <Group justify="flex-end">
        <Button
          leftSection={<IconDeviceFloppy size={18} />}
          onClick={handleSave}
          loading={saving}
          variant="filled"
        >
          Save Rules
        </Button>
      </Group>
    </Stack>
  );
};

export default QueueRuleEditor;
