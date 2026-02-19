import { useState, useEffect, useCallback } from 'react';
import { Select, Stack, Title, Text, Group, Loader, Center } from '@mantine/core';
import QueueRuleEditor from './QueueRuleEditor';
import { adminService } from '../../../services/supabase';

const QueueRuleManager = ({ isSuperAdmin, currentUserRoles }) => {
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadBranches = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminService.getAllBranchesForAdmin();
      setBranches(data);
      if (data.length > 0) {
        setSelectedBranchId(data[0].id);
      }
    } catch (error) {
      console.error('Failed to load branches:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isSuperAdmin) {
      loadBranches();
    } else if (currentUserRoles?.admin_branch) {
      setSelectedBranchId(currentUserRoles.admin_branch);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [isSuperAdmin, currentUserRoles, loadBranches]);

  const selectedBranch = isSuperAdmin
    ? branches.find(b => b.id === Number(selectedBranchId))
    : null;

  if (loading) {
    return (
      <Center py="xl">
        <Loader size="md" />
      </Center>
    );
  }

  if (!isSuperAdmin && !currentUserRoles?.admin_branch) {
    return (
      <Center py="xl">
        <Text c="dimmed">You are not assigned to any branch.</Text>
      </Center>
    );
  }

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-end">
        <Stack gap={0}>
          <Title order={3}>Queue Rule Management</Title>
          <Text size="sm" c="dimmed">
            {isSuperAdmin
              ? 'Manage queue rules for any branch.'
              : 'Manage queue rules for your assigned branch.'}
          </Text>
        </Stack>

        {isSuperAdmin && (
          <Select
            label="Select Branch"
            placeholder="Choose a branch"
            data={branches.map(b => ({ value: String(b.id), label: b.arcade_name }))}
            value={String(selectedBranchId)}
            onChange={(val) => setSelectedBranchId(Number(val))}
            searchable
            style={{ minWidth: 250 }}
          />
        )}
      </Group>

      {selectedBranchId ? (
        <QueueRuleEditor
          branchId={selectedBranchId}
          branchName={selectedBranch?.arcade_name || 'your assigned branch'}
        />
      ) : (
        <Text c="dimmed">No branch selected.</Text>
      )}
    </Stack>
  );
};

export default QueueRuleManager;
