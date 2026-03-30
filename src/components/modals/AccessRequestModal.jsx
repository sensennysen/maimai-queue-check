import { useState, useEffect } from 'react';
import { Modal, Stack, Button, MultiSelect, Text, Group, LoadingOverlay, Box, UnstyledButton } from '@mantine/core';
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
  }, [opened]);

  const handleSubmit = async (values) => {
    try {
      setSubmitting(true);

      const branchIds = values.branchIds.map(Number);

      const validBranchIds = branchIds.filter(id => {
        if (userRoles?.can_edit_on?.includes(id)) return false;
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
    .filter(b => !userRoles?.can_edit_on?.includes(b.id)) 
    .map(b => ({
      value: String(b.id),
      label: b.short_name || b.arcade_name,
      disabled: existingRequests.some(r => r.branch_id === b.id && r.status === 'pending') 
    }));

  const showRejectionWarning = form.values.branchIds.some(id =>
    existingRequests.some(r => r.branch_id === Number(id) && r.status === 'rejected')
  );

  const selectedBranchId = form.values.branchIds.length === 1 ? Number(form.values.branchIds[0]) : null;
  const selectedBranch = selectedBranchId ? branches.find(b => b.id === selectedBranchId) : null;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="lg"
      centered
      padding={0}
      radius={24}
      withCloseButton={false}
      styles={{
        content: {
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 'calc(100vh - 40px)'
        },
        body: {
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          overflow: 'hidden'
        },
      }}
    >
      <LoadingOverlay visible={loading} zIndex={100} overlayProps={{ radius: 'md', blur: 2 }} />

      {/* ── Fixed Header ─────────────────────────────────────────── */}
      <Box
        style={{
          background: 'linear-gradient(135deg, var(--theme-primary), color-mix(in srgb, var(--theme-primary), var(--theme-secondary) 40%))',
          padding: '24px 24px 20px',
          position: 'relative',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        <Group gap="sm" style={{ position: 'relative', zIndex: 1 }}>
          <Box
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.3)',
            }}
          >
            <IconSend size={18} color="var(--theme-primary-contrast)" strokeWidth={2.2} />
          </Box>
          <Box>
            <Text
              size="lg"
              fw={800}
              style={{
                fontFamily: 'var(--font-heading)',
                color: 'var(--theme-primary-contrast)',
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
              }}
            >
              Request Access
            </Text>
            <Text size="xs" style={{ color: 'var(--theme-primary-contrast)', opacity: 0.8, marginTop: 2 }}>
              Get permission to manage queues
            </Text>
          </Box>
        </Group>

        <UnstyledButton
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            padding: '4px 12px',
            borderRadius: 20,
            background: 'rgba(255,255,255,0.2)',
            color: 'var(--theme-primary-contrast)',
            fontSize: 12,
            fontWeight: 700,
            backdropFilter: 'blur(4px)',
            transition: 'all 0.2s ease',
            zIndex: 10,
          }}
          className="header-close-pill"
        >
          Close
        </UnstyledButton>
      </Box>

      {/* ── Body ─────────────────────────────────────────────────── */}
      <Box style={{ flex: 1, overflowY: 'auto' }}>
        <Box component="form" onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md" p="lg">
            <Box
              style={{
                borderRadius: 18,
                padding: '16px',
                background: 'var(--theme-surface)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                border: '1px solid var(--theme-border)',
              }}
            >
              <Stack gap="md">
                <Box>
                  <Text size="sm" fw={700} style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.02em', color: 'var(--theme-text)' }}>
                    {selectedBranch ? `Selected: ${selectedBranch.arcade_name}` : "Select Branches"}
                  </Text>
                  <Text size="xs" c="dimmed" mt={2}>
                    {selectedBranch 
                      ? "Requesting power to edit the queue for this location." 
                      : "Choose the arcade branches where you want to manage real-time queues."}
                  </Text>
                </Box>

                <MultiSelect
                  placeholder="Choose arcade locations..."
                  data={branchOptions}
                  searchable
                  nothingFoundMessage="No locations found"
                  {...form.getInputProps('branchIds')}
                  maxDropdownHeight={200}
                  clearable
                  comboboxProps={{ 
                    withinPortal: false,
                    offset: 4,
                    position: 'bottom'
                  }}
                  styles={{
                    input: {
                      borderRadius: 12,
                      minHeight: 46,
                      background: 'var(--theme-bg-soft, #f8f9fa)',
                      border: '1px solid var(--theme-border)',
                      transition: 'border-color 0.2s ease',
                    }
                  }}
                />

                {showRejectionWarning && (
                  <Box
                    style={{
                      padding: '12px 14px',
                      borderRadius: 12,
                      background: 'color-mix(in srgb, var(--theme-error), transparent 93%)',
                      border: '1px solid color-mix(in srgb, var(--theme-error), transparent 80%)',
                      display: 'flex',
                      gap: 12,
                    }}
                  >
                    <IconAlertCircle size={18} color="var(--theme-error)" style={{ marginTop: 2, flexShrink: 0 }} />
                    <Box>
                      <Text size="sm" fw={700} color="var(--theme-error)" style={{ lineHeight: 1.2 }}>
                        Previous Rejection
                      </Text>
                      <Text size="xs" color="var(--theme-error)" style={{ marginTop: 4, opacity: 0.85 }}>
                        One or more selected branches have previously rejected your request. Re-submitting is allowed if conditions have changed.
                      </Text>
                    </Box>
                  </Box>
                )}
              </Stack>
            </Box>

            <Group justify="flex-end" gap="sm" pt={4}>
              <Button
                variant="subtle"
                onClick={onClose}
                color="gray"
                style={{ color: 'var(--theme-text-muted)' }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={submitting}
                leftSection={<IconSend size={16} />}
                style={{
                  background: 'var(--theme-primary)',
                  boxShadow: '0 4px 12px color-mix(in srgb, var(--theme-primary), transparent 70%)',
                }}
              >
                Send Request
              </Button>
            </Group>
          </Stack>
        </Box>
      </Box>
    </Modal>
  );
};

export default AccessRequestModal;
