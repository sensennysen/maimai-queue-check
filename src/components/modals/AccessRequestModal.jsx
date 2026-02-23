import { useState, useEffect } from 'react';
import { Modal, Stack, Button, MultiSelect, Text, Group, LoadingOverlay, Alert } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import IconSend from '@tabler/icons-react/dist/esm/icons/IconSend.mjs';
import IconAlertCircle from '@tabler/icons-react/dist/esm/icons/IconAlertCircle.mjs';
import { requestService, branchService, userService } from '../../services/supabase';
import { useAuth } from '../../hooks/useAuth';

const AccessRequestModal = ({ opened, onClose, onSuccess }) => {
  const { user, userRoles } = useAuth();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [existingRequests, setExistingRequests] = useState([]);

  const form = useForm({
    initialValues: {
      branchIds: [],
    },
    validate: {
      branchIds: (value) => value.length === 0 ? 'Please select at least one branch' : null,
    },
  });

  useEffect(() => {
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

    if (opened) {
      loadData();

      // Prefill with preferred branches that user doesn't have access to
      if (userRoles?.preferred_branches) {
        const prefill = userRoles.preferred_branches
          .filter(id => !userRoles.can_edit_on?.includes(id))
          .map(String);

        form.setValues({ branchIds: prefill });
      } else {
        form.reset();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // Intentionally depends only on `opened`: user, userRoles, and form are excluded
    // to prevent re-fetching on every auth state change while the modal is open.
    // The effect must only run when the modal is opened/closed.
  }, [opened]);

  const handleSubmit = async (values) => {
    try {
      setSubmitting(true);

      const branchIds = values.branchIds.map(Number);

      // Filter out invalid requests
      const validBranchIds = branchIds.filter(id => {
        // Check if already has access
        if (userRoles?.can_edit_on?.includes(id)) return false;

        // Check if pending
        const existing = existingRequests.find(r => r.branch_id === id);
        if (existing && existing.status === 'pending') return false;

        return true;
      });

      if (validBranchIds.length === 0) {
        notifications.show({ title: 'Info', message: 'No valid branches to request (already pending or have access).', color: 'blue' });
        onClose();
        return;
      }

      await requestService.createRequests(user.id, validBranchIds);

      // Update user preferences to include these branches
      const currentPreferences = userRoles?.preferred_branches || [];
      const newPreferences = [...new Set([...currentPreferences, ...validBranchIds])];

      await userService.updatePreferences(user.id, {
        branchIds: newPreferences
      });

      notifications.show({
        title: 'Request Sent',
        message: 'Admins have been notified.',
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
      label: b.short_name || b.arcade_name,
      disabled: existingRequests.some(r => r.branch_id === b.id && r.status === 'pending') // Disable if pending
    }));

  // Check if any selected branch was previously rejected
  const showRejectionWarning = form.values.branchIds.some(id =>
    existingRequests.some(r => r.branch_id === Number(id) && r.status === 'rejected')
  );

  // Find the selected branch if only one is selected, for the new text
  const selectedBranchId = form.values.branchIds.length === 1 ? Number(form.values.branchIds[0]) : null;
  const selectedBranch = selectedBranchId ? branches.find(b => b.id === selectedBranchId) : null;

  return (
    <Modal opened={opened} onClose={onClose} title="Request Queue Edit Access" centered>
      <LoadingOverlay visible={loading} />
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          {selectedBranch ? (
            <Text size="sm" c="secondary" fw={500} style={{ marginTop: '1rem' }}>
              Requesting access for: {selectedBranch?.arcade_name}
            </Text>
          ) : (
            <Text size="sm" c="secondary" style={{ marginTop: '1rem' }}>
              Select the branch(es) you want to manage queue for. The requests will be sent to the respective branch admins.
            </Text>
          )}

          <MultiSelect
            label="Select Branches"
            placeholder="Pick requests"
            data={branchOptions}
            searchable
            nothingFoundMessage="No branches found or you have access to all"
            {...form.getInputProps('branchIds')}
            maxDropdownHeight={200}
            clearable
          />

          {showRejectionWarning && (
            <Alert
              icon={<IconAlertCircle size={16} />}
              variant="light"
              title="Previous Rejection"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--theme-error), transparent 90%)',
                color: 'var(--theme-error)',
                borderColor: 'var(--theme-error)'
              }}
              styles={{
                title: { color: 'var(--theme-error)' },
                message: { color: 'var(--theme-error)' },
                icon: { color: 'var(--theme-error)' }
              }}
            >
              One or more selected branches have previously rejected requests.
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
