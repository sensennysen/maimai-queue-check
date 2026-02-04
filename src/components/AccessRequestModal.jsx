import { useState, useEffect } from 'react';
import { Modal, Stack, Button, Select, Text, Group, LoadingOverlay, Alert } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconSend, IconAlertCircle } from '@tabler/icons-react';
import { requestService, branchService } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';

const AccessRequestModal = ({ opened, onClose, onSuccess }) => {
  const { user, userRoles } = useAuth();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [existingRequests, setExistingRequests] = useState([]);

  const form = useForm({
    initialValues: {
      branchId: '',
    },
    validate: {
      branchId: (value) => !value ? 'Please select a branch' : null,
    },
  });

  useEffect(() => {
    if (opened) {
      loadData();
      form.reset();
    }
  }, [opened]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [branchesData, requestsData] = await Promise.all([
        branchService.getAllBranches(),
        requestService.getUserRequests(user.id)
      ]);
      setBranches(branchesData);
      setExistingRequests(requestsData);
    } catch (error) {
      console.error('Failed to load data:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to load options',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      setSubmitting(true);

      // Check if already requested or has access
      const branchId = Number(values.branchId);

      if (userRoles?.can_edit_on?.includes(branchId)) {
        notifications.show({ title: 'Info', message: 'You already have access to this branch.', color: 'blue' });
        onClose();
        return;
      }

      const existing = existingRequests.find(r => r.branch_id === branchId);
      if (existing) {
        if (existing.status === 'pending') {
          notifications.show({ title: 'Info', message: 'Request already pending.', color: 'yellow' });
          return;
        }
        if (existing.status === 'rejected') {
          // Allow re-request? Maybe. For now, warn.
          if (!window.confirm('Your previous request was rejected. Request again?')) {
            return;
          }
        }
      }

      await requestService.createRequest(user.id, branchId);

      notifications.show({
        title: 'Request Sent',
        message: 'Admin has been notified.',
        color: 'green',
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to send request',
        color: 'red',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const branchOptions = branches
    .filter(b => !userRoles?.can_edit_on?.includes(b.id)) // Only show branches user doesn't have access to
    .map(b => ({
      value: String(b.id),
      label: b.arcade_name,
      disabled: existingRequests.some(r => r.branch_id === b.id && r.status === 'pending') // Disable if pending
    }));

  return (
    <Modal opened={opened} onClose={onClose} title="Request Edit Access" centered>
      <LoadingOverlay visible={loading} />
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <Text size="sm" c="dimmed">
            Select the branch you want to manage queue for. The request will be sent to the branch admins for approval.
          </Text>

          <Select
            label="Select Branch"
            placeholder="Pick a branch"
            data={branchOptions}
            searchable
            nothingFoundMessage="No branches found or you have access to all"
            {...form.getInputProps('branchId')}
          />

          {existingRequests.some(r => r.branch_id === Number(form.values.branchId) && r.status === 'rejected') && (
            <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light" title="Previous Rejection">
              Your previous request for this branch was rejected.
            </Alert>
          )}

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={submitting} leftSection={<IconSend size={16} />}>
              Send Request
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};

export default AccessRequestModal;
