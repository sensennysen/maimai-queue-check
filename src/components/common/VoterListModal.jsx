import { useEffect, useState } from 'react';
import { 
  Modal, Stack, Group, Avatar, Text, 
  Loader, ScrollArea, Tabs, Center, Box
} from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import IconThumbUp from '@tabler/icons-react/dist/esm/icons/IconThumbUp.mjs';
import IconThumbDown from '@tabler/icons-react/dist/esm/icons/IconThumbDown.mjs';
import { getProfileImageUrl } from '../../utils/formatters';

/**
 * Reusable modal to display a list of users who voted (liked/disliked) an item.
 * Supports both Feed Posts and Song Comments.
 */
export function VoterListModal({ 
  opened, 
  onClose, 
  title = "Voters",
  fetchVoters, // Async function that returns { vote_type, user: { id, display_name, slug, ... } }[]
  initialTab = "likes"
}) {
  const navigate = useNavigate();
  const [voters, setVoters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (opened) {
      const load = async () => {
        setLoading(true);
        try {
          const data = await fetchVoters();
          setVoters(data || []);
        } catch (error) {
          console.error('Failed to fetch voters:', error);
        } finally {
          setLoading(false);
        }
      };
      load();
    }
  }, [opened, fetchVoters]);

  const likes = voters.filter(v => v.vote_type === 1);
  const dislikes = voters.filter(v => v.vote_type === -1);

  const renderVoterList = (list) => {
    if (list.length === 0) {
      return (
        <Center py="xl">
          <Text c="dimmed" size="sm">No one here yet.</Text>
        </Center>
      );
    }

    return (
      <Stack gap="xs" mt="sm">
        {list.map((item, idx) => {
          const u = item.user;
          if (!u) return null; // Safety check
          return (
            <Group 
              key={u.id || idx} 
              gap="sm" 
              style={{ cursor: 'pointer' }}
              onClick={() => {
                if (u.slug) {
                  navigate(`/p/${u.slug}`);
                  onClose();
                }
              }}
              p={8}
              className="voter-item"
              wrap="nowrap"
            >
              <Avatar src={getProfileImageUrl(u)} size={32} radius="xl" color="primary">
                {(u.display_name || '?').charAt(0)}
              </Avatar>
              <Text size="sm" fw={500} style={{ flex: 1 }}>{u.display_name || 'Unknown'}</Text>
            </Group>
          );
        })}
      </Stack>
    );
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={title}
      size="sm"
      radius="md"
      scrollAreaComponent={ScrollArea.Autosize}
      styles={{
        header: { borderBottom: '1px solid var(--mantine-color-default-border)' },
        content: { minHeight: 300 }
      }}
    >
      {loading ? (
        <Center py="xl">
          <Loader size="md" />
        </Center>
      ) : (
        <Tabs value={activeTab} onChange={setActiveTab} color="blue" variant="outline">
          <Tabs.List grow>
            <Tabs.Tab 
              value="likes" 
              leftSection={<IconThumbUp size={14} color="var(--mantine-color-blue-filled)" />}
            >
              Likes ({likes.length})
            </Tabs.Tab>
            <Tabs.Tab 
              value="dislikes" 
              leftSection={<IconThumbDown size={14} color="var(--mantine-color-red-filled)" />}
            >
              Dislikes ({dislikes.length})
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="likes">
            {renderVoterList(likes)}
          </Tabs.Panel>

          <Tabs.Panel value="dislikes">
            {renderVoterList(dislikes)}
          </Tabs.Panel>
        </Tabs>
      )}
    </Modal>
  );
}
