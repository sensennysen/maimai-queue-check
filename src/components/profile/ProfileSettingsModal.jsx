import { useState, useEffect } from 'react';
import { Modal, Stack, Group, SimpleGrid, TextInput, Select, MultiSelect, Box, Text, Button, UnstyledButton } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import IconSettings from '@tabler/icons-react/dist/esm/icons/IconSettings.mjs';
import IconCheck from '@tabler/icons-react/dist/esm/icons/IconCheck.mjs';
import IconLink from '@tabler/icons-react/dist/esm/icons/IconLink.mjs';
import IconUser from '@tabler/icons-react/dist/esm/icons/IconUser.mjs';
import IconWorld from '@tabler/icons-react/dist/esm/icons/IconWorld.mjs';
import { userService } from '../../services/supabase';

// ── Section header pill ──────────────────────────────────────────────────────
const SectionPill = ({ icon: Icon, label, accent }) => (
  <Group gap={6} mb={10}>
    <Box
      style={{
        width: 28,
        height: 28,
        borderRadius: '50%',
        background: accent,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Icon size={14} color="#fff" strokeWidth={2.2} />
    </Box>
    <Text
      size="sm"
      fw={700}
      style={{
        fontFamily: 'var(--font-heading)',
        letterSpacing: '-0.01em',
        color: 'var(--theme-text-primary)',
      }}
    >
      {label}
    </Text>
  </Group>
);

// ── Settings group card ──────────────────────────────────────────────────────
const SettingsCard = ({ icon, label, accent, children }) => (
  <Box
    style={{
      borderRadius: 18,
      padding: '14px 14px 12px',
      background: 'var(--theme-surface)',
      boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      border: '1px solid var(--theme-border)',
    }}
  >
    <SectionPill icon={icon} label={label} accent={accent} />
    <Stack gap="md">{children}</Stack>
  </Box>
);

const ProfileSettingsModal = ({ opened, onClose, userId, initialData, allBranches, onSuccess }) => {
  const [displayName, setDisplayName] = useState('');
  const [selectedBranches, setSelectedBranches] = useState([]);
  const [selectedMainBranch, setSelectedMainBranch] = useState(null);
  const [slug, setSlug] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingSlug, setIsSavingSlug] = useState(false);

  useEffect(() => {
    if (initialData) {
      setDisplayName(initialData.display_name || '');
      setSelectedBranches(initialData.preferred_branches?.map(String) || []);
      setSelectedMainBranch(initialData.main_branch ? String(initialData.main_branch) : null);
      setSlug(initialData.slug || '');
    }
  }, [initialData, opened]);

  const handleSavePreferences = async () => {
    if (!displayName.trim()) {
      notifications.show({
        title: 'Error',
        message: 'Display name cannot be empty',
        color: 'red',
      });
      return;
    }

    try {
      setIsSaving(true);
      await userService.updatePreferences(userId, {
        display_name: displayName.trim(),
        branch_ids: selectedBranches.map(Number),
        main_branch: selectedMainBranch ? parseInt(selectedMainBranch, 10) : null
      });

      notifications.show({
        title: 'Success',
        message: 'Preferences updated successfully',
        color: 'green',
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (e) {
      notifications.show({
        title: 'Error',
        message: e.message || 'Failed to update preferences',
        color: 'red',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSlug = async () => {
    if (!slug.trim()) return;
    
    // Simple validation: alphanumeric and hyphens
    const slugRegex = /^[a-zA-Z0-9-]+$/;
    if (!slugRegex.test(slug)) {
      notifications.show({
        title: 'Invalid URL',
        message: 'URLs can only contain letters, numbers, and hyphens',
        color: 'red',
      });
      return;
    }

    try {
      setIsSavingSlug(true);
      await userService.updateSlug(userId, slug.toLowerCase().trim());
      notifications.show({
        title: 'URL Updated',
        message: 'Your profile link has been saved',
        color: 'green',
      });
      if (onSuccess) onSuccess();
    } catch {
      notifications.show({
        title: 'URL Taken',
        message: 'That profile name is already in use. Please try another.',
        color: 'red',
      });
    } finally {
      setIsSavingSlug(false);
    }
  };

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
            <IconSettings size={18} color="var(--theme-primary-contrast)" strokeWidth={2.2} />
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
              Profile Settings
            </Text>
            <Text size="xs" style={{ color: 'var(--theme-primary-contrast)', opacity: 0.8, marginTop: 2 }}>
              Update your presence and display preferences
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
          Cancel
        </UnstyledButton>
      </Box>

      {/* ── Scrollable Body Area ─────────────────────────────────── */}
      <Box style={{ flex: 1, overflowY: 'auto' }}>
        <Stack gap="md" p="lg">

          {/* General Basics */}
          <SettingsCard icon={IconUser} label="General Settings" accent="#FF28A9">
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              <TextInput
                label="Display Name"
                placeholder="Enter your display name"
                value={displayName}
                onChange={(e) => setDisplayName(e.currentTarget.value)}
                maxLength={20}
                description="Shown as your profile heading"
                variant="filled"
                styles={{ input: { background: 'var(--theme-bg-soft)', border: '1px solid var(--theme-border)' } }}
              />
              <Select
                label="Home Branch"
                placeholder="Select your main branch"
                data={allBranches.map(b => ({ value: String(b.id), label: b.short_name || b.arcade_name }))}
                value={selectedMainBranch}
                onChange={setSelectedMainBranch}
                searchable
                description="Your primary arcade branch"
                clearable
                comboboxProps={{ withinPortal: false, position: 'bottom' }}
                variant="filled"
                styles={{ input: { background: 'var(--theme-bg-soft)', border: '1px solid var(--theme-border)' } }}
              />
            </SimpleGrid>
          </SettingsCard>

          {/* Locations Preferences */}
          <SettingsCard icon={IconWorld} label="Branch Preferences" accent="#00D2FF">
            <MultiSelect
              label="Selected Branches"
              description="Quickly filter the queue for these specific arcades"
              placeholder="Select one or more branches"
              data={allBranches.map(b => ({ value: String(b.id), label: b.short_name || b.arcade_name }))}
              value={selectedBranches}
              onChange={setSelectedBranches}
              searchable
              clearable
              comboboxProps={{ withinPortal: false, position: 'bottom' }}
              variant="filled"
              styles={{ input: { background: 'var(--theme-bg-soft)', border: '1px solid var(--theme-border)' } }}
            />
          </SettingsCard>

          {/* Vanity URL / Slug */}
          <SettingsCard icon={IconLink} label="Custom Profile Link" accent="#FFD200">
            <Box style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <TextInput
                label="Vanity URL"
                placeholder="your-name"
                value={slug}
                onChange={(e) => setSlug(e.currentTarget.value)}
                style={{ flex: 1 }}
                maxLength={30}
                description="queue.smf.ph/u/..."
                variant="filled"
                styles={{ input: { background: 'var(--theme-bg-soft)', border: '1px solid var(--theme-border)' } }}
              />
              <Button 
                variant="light" 
                color="yellow" 
                onClick={handleSaveSlug}
                loading={isSavingSlug}
                radius="md"
              >
                Claim
              </Button>
            </Box>
          </SettingsCard>

          {/* Footer Actions */}
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
              onClick={handleSavePreferences}
              loading={isSaving}
              leftSection={<IconCheck size={16} />}
            >
              Save Preferences
            </Button>
          </Group>

        </Stack>
      </Box>
    </Modal>
  );
};

export default ProfileSettingsModal;
