import { useState, useEffect, useCallback } from 'react';
import {
  Stack,
  Group,
  Text,
  Table,
  ActionIcon,
  Badge,
  Loader,
  Center,
  Paper,
} from '@mantine/core';
import {
  IconCheck,
  IconX,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { adminService, requestService, rolesService } from '../../../services/supabase';
import './UserManager.css';

const AccessRequests = ({ isSuperAdmin, currentUserRoles, keyProp }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      const adminBranch = currentUserRoles?.admin_branch;
      const data = await requestService.getPendingRequests(isSuperAdmin ? null : adminBranch);
      setRequests(data);
    } catch (error) {
      console.error("Failed to load requests", error);
    } finally {
      setLoading(false);
    }
  }, [isSuperAdmin, currentUserRoles]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests, keyProp]);

  const handleAction = async (request, action) => {
    try {
      setProcessing(request.id);
      if (action === 'approve') {
        // Fetch current user roles to append permission
        const currentRoles = await rolesService.getUserRoles(request.user_id);
        let currentCanEditOn = currentRoles.can_edit_on || [];

        // Add branch if not present
        if (!currentCanEditOn.includes(request.branch_id)) {
          currentCanEditOn.push(request.branch_id);
          await adminService.updateUserRole(request.user_id, {
            can_edit_on: currentCanEditOn
          });
        }

        await requestService.updateRequestStatus(request.id, 'approved');
        notifications.show({ title: 'Approved', message: 'Access granted.', color: 'green' });
      } else {
        await requestService.updateRequestStatus(request.id, 'rejected');
        notifications.show({ title: 'Rejected', message: 'Request rejected.', color: 'gray' });
      }
      loadRequests();
    } catch (error) {
      notifications.show({ title: 'Error', message: error.message, color: 'red' });
    } finally {
      setProcessing(null);
    }
  };

  return (
    <Stack gap="md" mt="md">
      {loading ? (
        <Center p="xl"><Loader /></Center>
      ) : requests.length === 0 ? (
        <Paper p="xl" withBorder>
          <Center>
            <Text c="dimmed">No pending access requests.</Text>
          </Center>
        </Paper>
      ) : (
        <Paper withBorder>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>User</Table.Th>
                <Table.Th>Branch</Table.Th>
                <Table.Th>Date</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {requests.map(r => (
                <Table.Tr key={r.id}>
                  <Table.Td>
                    <Stack gap={0}>
                      <Text size="sm">{r.user_roles?.display_name || 'Unknown'}</Text>
                      <Text size="xs" c="dimmed">{r.user_roles?.email}</Text>
                    </Stack>
                  </Table.Td>
                  <Table.Td>
                    <Badge>{r.allowed_places?.acronym || r.allowed_places?.short_name}</Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{new Date(r.created_at).toLocaleDateString()}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <ActionIcon
                        color="green"
                        variant="light"
                        loading={processing === r.id}
                        onClick={() => handleAction(r, 'approve')}
                        title="Approve"
                      >
                        <IconCheck size={16} />
                      </ActionIcon>
                      <ActionIcon
                        color="red"
                        variant="light"
                        loading={processing === r.id}
                        onClick={() => handleAction(r, 'reject')}
                        title="Reject"
                      >
                        <IconX size={16} />
                      </ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Paper>
      )}
    </Stack>
  );
};

export default AccessRequests;
