import { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Group,
  Text,
  Badge,
  ActionIcon,
  Stack,
  Title,
  Paper,
  Button,
  TextInput,
  Textarea,
  Modal,
  Loader,
  Center,
  ScrollArea,
  Tabs,
  Tooltip,
} from '@mantine/core';
import {
  IconCheck,
  IconX,
  IconEdit,
  IconRefresh,
  IconPlus,
  IconTrash,
  IconSearch,
  IconTags
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { discussionService } from '../../../services/supabase';

const TagManager = ({ isSuperAdmin }) => {
  const [activeTab, setActiveTab] = useState('pending');
  const [tags, setTags] = useState([]);
  const [pendingTags, setPendingTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [editingTag, setEditingTag] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editValue, setEditValue] = useState({ name: '', description: '', status: 'approved' });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [allTags, pending] = await Promise.all([
        discussionService.getAllTags(),
        discussionService.getPendingTags()
      ]);
      setTags(allTags);
      setPendingTags(pending);
    } catch (err) {
      console.error('Failed to load tags', err);
      notifications.show({
        title: 'Error',
        message: 'Failed to load tags.',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStatusUpdate = async (tagId, status, description) => {
    try {
      await discussionService.updateTagStatus(tagId, status, description);
      notifications.show({
        title: 'Success',
        message: `Tag updated successfully.`,
        color: 'green'
      });
      loadData();
      setEditingTag(null);
    } catch (err) {
      console.error('Failed to update tag status', err);
      notifications.show({
        title: 'Error',
        message: 'Failed to update tag status.',
        color: 'red'
      });
    }
  };

  const handleDelete = async (tagId) => {
    if (!window.confirm('Are you sure you want to delete this tag? This action cannot be undone and may affect existing song tags.')) {
      return;
    }

    try {
      await discussionService.deleteTag(tagId);
      notifications.show({
        title: 'Deleted',
        message: 'Tag has been removed.',
        color: 'red'
      });
      loadData();
    } catch (err) {
      console.error('Failed to delete tag', err);
      notifications.show({
        title: 'Error',
        message: 'Failed to delete tag.',
        color: 'red'
      });
    }
  };

  const handleCreate = async () => {
    if (!editValue.name.trim()) return;

    try {
      await discussionService.addCustomTag(editValue.name.trim(), editValue.description, 'approved');
      notifications.show({
        title: 'Created',
        message: `Tag "${editValue.name}" created and approved.`,
        color: 'green'
      });
      setIsCreating(false);
      setEditValue({ name: '', description: '', status: 'approved' });
      loadData();
    } catch (err) {
      console.error('Failed to create tag', err);
      notifications.show({
        title: 'Error',
        message: 'Failed to create tag.',
        color: 'red'
      });
    }
  };

  const filteredTags = tags.filter(t =>
    t.tag_name.toLowerCase().includes(search.toLowerCase()) ||
    (t.description && t.description.toLowerCase().includes(search.toLowerCase()))
  );

  const renderTagTable = (data, isManagement = false) => (
    <ScrollArea>
      <Table striped highlightOnHover verticalSpacing="sm">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Tag Name</Table.Th>
            <Table.Th>Description</Table.Th>
            <Table.Th>{isManagement ? 'Status' : 'Requested By'}</Table.Th>
            <Table.Th>Created At</Table.Th>
            <Table.Th ta="right">Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {data.map(tag => (
            <Table.Tr key={tag.id}>
              <Table.Td>
                <Badge variant="light" color={tag.is_predefined ? 'indigo' : 'gray'}>
                  {tag.tag_name}
                </Badge>
              </Table.Td>
              <Table.Td>
                <Text size="sm" truncate maw={300} title={tag.description}>
                  {tag.description || '-'}
                </Text>
              </Table.Td>
              <Table.Td>
                {isManagement ? (
                  <Badge
                    variant="dot"
                    color={tag.status === 'approved' ? 'green' : tag.status === 'pending' ? 'blue' : 'red'}
                    size="sm"
                  >
                    {tag.status}
                  </Badge>
                ) : (
                  <Text size="sm">{tag.creator_name || 'Anonymous'}</Text>
                )}
              </Table.Td>
              <Table.Td>
                <Text size="sm" c="dimmed">
                  {new Date(tag.created_at).toLocaleDateString()}
                </Text>
              </Table.Td>
              <Table.Td>
                <Group gap="xs" justify="flex-end">
                  {tag.status === 'pending' && !isManagement && (
                    <>
                      <Tooltip label="Approve">
                        <ActionIcon
                          variant="light"
                          color="green"
                          onClick={() => handleStatusUpdate(tag.id, 'approved', tag.description)}
                        >
                          <IconCheck size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Reject">
                        <ActionIcon
                          variant="light"
                          color="red"
                          onClick={() => handleStatusUpdate(tag.id, 'rejected')}
                        >
                          <IconX size={16} />
                        </ActionIcon>
                      </Tooltip>
                    </>
                  )}
                  <Tooltip label="Edit">
                    <ActionIcon
                      variant="light"
                      color="blue"
                      onClick={() => {
                        setEditingTag(tag);
                        setEditValue({ name: tag.tag_name, description: tag.description || '', status: tag.status });
                      }}
                    >
                      <IconEdit size={16} />
                    </ActionIcon>
                  </Tooltip>
                  {isManagement && (
                    <Tooltip label="Delete">
                      <ActionIcon
                        variant="light"
                        color="red"
                        onClick={() => handleDelete(tag.id)}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Tooltip>
                  )}
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </ScrollArea>
  );

  if (!isSuperAdmin) return null;

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={3}>Tag Management</Title>
        <Group>
          <Button
            variant="light"
            leftSection={<IconRefresh size={16} />}
            onClick={loadData}
            loading={loading}
          >
            Refresh
          </Button>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => {
              setIsCreating(true);
              setEditValue({ name: '', description: '', status: 'approved' });
            }}
          >
            New Tag
          </Button>
        </Group>
      </Group>

      <Paper withBorder radius="md" p="md">
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List mb="md">
            <Tabs.Tab value="pending" leftSection={<IconCheck size={14} />}>
              Pending Requests ({pendingTags.length})
            </Tabs.Tab>
            <Tabs.Tab value="all" leftSection={<IconTags size={14} />}>
              All Tags ({tags.length})
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="pending">
            {loading ? (
              <Center py="xl"><Loader /></Center>
            ) : pendingTags.length === 0 ? (
              <Center py="xl"><Text c="dimmed">No pending requests.</Text></Center>
            ) : (
              renderTagTable(pendingTags)
            )}
          </Tabs.Panel>

          <Tabs.Panel value="all">
            <Stack gap="md">
              <TextInput
                placeholder="Search tags..."
                leftSection={<IconSearch size={14} />}
                value={search}
                onChange={(e) => setSearch(e.currentTarget.value)}
              />
              {loading ? (
                <Center py="xl"><Loader /></Center>
              ) : filteredTags.length === 0 ? (
                <Center py="xl"><Text c="dimmed">No tags found.</Text></Center>
              ) : (
                renderTagTable(filteredTags, true)
              )}
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </Paper>

      <Modal
        opened={!!editingTag}
        onClose={() => setEditingTag(null)}
        title="Edit Tag"
        centered
      >
        <Stack gap="md">
          <TextInput
            label="Tag Name"
            value={editValue.name}
            onChange={(e) => setEditValue(prev => ({ ...prev, name: e.currentTarget.value }))}
            description="Be careful changing tag names after they are in use"
          />
          <Textarea
            label="Description"
            placeholder="What does this tag mean?"
            value={editValue.description}
            onChange={(e) => setEditValue(prev => ({ ...prev, description: e.currentTarget.value }))}
            minRows={3}
          />
          <Group justify="flex-end" mt="md">
            {editingTag?.status === 'pending' && (
              <Button variant="subtle" color="red" onClick={() => handleStatusUpdate(editingTag.id, 'rejected')}>
                Reject
              </Button>
            )}
            <Button color="blue" onClick={() => handleStatusUpdate(editingTag.id, editingTag?.status === 'pending' ? 'approved' : editingTag?.status, editValue.description)}>
              {editingTag?.status === 'pending' ? 'Approve & Save' : 'Save Changes'}
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={isCreating}
        onClose={() => setIsCreating(false)}
        title="Create New Tag"
        centered
      >
        <Stack gap="md">
          <TextInput
            label="Tag Name"
            placeholder="e.g. Jazz, Fast-paced"
            value={editValue.name}
            onChange={(e) => setEditValue(prev => ({ ...prev, name: e.currentTarget.value }))}
            required
          />
          <Textarea
            label="Description"
            placeholder="Optional description"
            value={editValue.description}
            onChange={(e) => setEditValue(prev => ({ ...prev, description: e.currentTarget.value }))}
            minRows={3}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={() => setIsCreating(false)}>Cancel</Button>
            <Button color="blue" onClick={handleCreate}>Create Tag</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
};

export default TagManager;
