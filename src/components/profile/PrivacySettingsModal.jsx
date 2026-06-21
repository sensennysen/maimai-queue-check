import { useState, useEffect } from 'react';
import { Modal, Stack, Group, Switch, Text, Button, Box, Collapse, UnstyledButton } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import IconLock from '@tabler/icons-react/dist/esm/icons/IconLock.mjs';
import IconCheck from '@tabler/icons-react/dist/esm/icons/IconCheck.mjs';
import IconUser from '@tabler/icons-react/dist/esm/icons/IconUser.mjs';
import IconChartBar from '@tabler/icons-react/dist/esm/icons/IconChartBar.mjs';
import IconAlbum from '@tabler/icons-react/dist/esm/icons/IconAlbum.mjs';
import IconWorld from '@tabler/icons-react/dist/esm/icons/IconWorld.mjs';
import { userService } from '../../services/supabase';

/* ─────────────────────────────────────────────
   Intent:
     Palette  – hot-pink primary, cyan accent, golden highlight, blush surface
     Depth    – claymorphism: layered shadows + inset highlight; matches .mantine-Paper-root global
     Surfaces – frosted glass panels per group, elevated toggle rows
     Type     – Space Grotesk headings, Outfit body
     Spacing  – 8 px base unit
   ───────────────────────────────────────────── */

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

// ── Toggle row ───────────────────────────────────────────────────────────────
const ToggleRow = ({ label, description, checked, onChange, indented = false, size = 'md' }) => (
  <Box
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      padding: indented ? '7px 10px 7px 20px' : '8px 10px',
      borderRadius: 12,
      borderLeft: indented
        ? '2px solid color-mix(in srgb, var(--theme-primary) 30%, transparent)'
        : 'none',
    }}
  >
    <Box style={{ flex: 1, minWidth: 0 }}>
      <Text
        size={size === 'sm' ? 'xs' : 'sm'}
        fw={checked ? 600 : 400}
        style={{
          color: checked ? 'var(--theme-text-primary)' : 'var(--theme-text-muted)',
          transition: 'color 0.18s ease',
          fontFamily: 'var(--font-body)',
        }}
      >
        {label}
      </Text>
      {description && (
        <Text size="xs" c="dimmed" style={{ marginTop: 1 }}>
          {description}
        </Text>
      )}
    </Box>
    <Switch
      checked={checked}
      onChange={onChange}
      size={indented ? 'xs' : 'sm'}
      color="pink"
      styles={{
        track: {
          cursor: 'pointer',
          transition: 'box-shadow 0.18s ease',
        },
      }}
    />
  </Box>
);

// ── Permission section card ──────────────────────────────────────────────────
const PermissionCard = ({ icon, label, accent, children }) => (
  <Box
    style={{
      padding: '16px 20px',
      borderRadius: 18,
      background: 'var(--theme-surface)',
      border: '1px solid var(--theme-border)',
      boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
    }}
  >
    <SectionPill icon={icon} label={label} accent={accent} />
    <Stack gap={2}>{children}</Stack>
  </Box>
);

const PrivacySettingsModal = ({ opened, onClose, userId, initialData, onSuccess }) => {
  const [isPublic, setIsPublic] = useState(false);
  const [privacySettings, setPrivacySettings] = useState({
    show_introduction: true,
    show_dx_rating: true,
    show_best_50: true,
    show_best_50_details: true,
    show_most_played: true,
    show_most_played_details: true,
    show_favorite_songs: true,
    show_playlists: true,
    show_main_branch: true,
    show_preferred_branches: true,
    show_play_count: true,
    show_maimai_name: true,
    show_circle: true,
    show_recent_plays: true,
    show_posts: true,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialData && opened) {
      setIsPublic(!!initialData.is_public);
      if (initialData.privacy_settings) {
        setPrivacySettings((prev) => ({ ...prev, ...initialData.privacy_settings }));
      }
    }
  }, [initialData, opened]);

  const set = (key, value) =>
    setPrivacySettings((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await userService.updatePreferences(userId, {
        is_public: isPublic,
        privacy_settings: privacySettings,
      });
      notifications.show({
        title: 'Saved!',
        message: 'Your privacy settings have been updated.',
        color: 'green',
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (e) {
      notifications.show({
        title: 'Error',
        message: e.message || 'Failed to update privacy settings',
        color: 'red',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      aria-label="Privacy Settings"
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
        className="app-modal-header"
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
            <IconLock size={18} color="var(--theme-primary-contrast)" strokeWidth={2.2} />
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
              Privacy Settings
            </Text>
            <Text size="xs" style={{ color: 'var(--theme-primary-contrast)', opacity: 0.8, marginTop: 2 }}>
              Control what visitors can see on your profile
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
          aria-label="Close"
          className="header-close-pill"
        >
          Cancel
        </UnstyledButton>
      </Box>

      {/* ── Scrollable Body Area ─────────────────────────────────── */}
      <Box style={{ flex: 1, overflowY: 'auto' }}>
        <Stack gap="md" p="lg">
          {/* ── Public profile master toggle ── */}
          <Box
            style={{
              borderRadius: 18,
              padding: '14px 16px',
              background: 'var(--theme-surface)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              transition: 'all 0.25s ease',
            }}
          >
            <Group justify="space-between" wrap="nowrap">
              <Group gap="sm" style={{ flex: 1 }}>
                <Box
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: isPublic
                      ? 'linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))'
                      : 'color-mix(in srgb, var(--theme-text-muted) 20%, transparent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.25s ease',
                  }}
                >
                  <IconWorld size={16} color="#fff" strokeWidth={2.2} />
                </Box>
                <Box>
                  <Text
                    size="sm"
                    fw={700}
                    style={{
                      fontFamily: 'var(--font-heading)',
                      color: isPublic ? 'var(--theme-primary)' : 'var(--theme-text-primary)',
                      transition: 'color 0.2s ease',
                    }}
                  >
                    Public Profile
                  </Text>
                  <Text size="xs" c="dimmed">
                    Anyone can view your profile without logging in
                  </Text>
                </Box>
              </Group>
              <Switch
                checked={isPublic}
                onChange={(e) => setIsPublic(e.currentTarget.checked)}
                size="md"
                color="pink"
                styles={{
                  track: {
                    cursor: 'pointer',
                    transition: 'box-shadow 0.2s ease',
                  },
                }}
              />
            </Group>
          </Box>

          {/* ── Section permission cards ── */}
          <Collapse in={isPublic}>
            <Stack gap="sm">
              <Text
                size="xs"
                fw={600}
                ta="center"
                style={{
                  color: 'var(--theme-text-muted)',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  fontFamily: 'var(--font-heading)',
                }}
              >
                Visible sections
              </Text>

              {/* Basics */}
              <PermissionCard icon={IconUser} label="Basics" accent="#FF28A9">
                <ToggleRow
                  label="Introduction"
                  checked={privacySettings.show_introduction !== false}
                  onChange={(e) => set('show_introduction', e.currentTarget.checked)}
                />
                <ToggleRow
                  label="Home Branch"
                  checked={privacySettings.show_main_branch}
                  onChange={(e) => set('show_main_branch', e.currentTarget.checked)}
                />
                <ToggleRow
                  label="Preferred Branches"
                  checked={privacySettings.show_preferred_branches}
                  onChange={(e) => set('show_preferred_branches', e.currentTarget.checked)}
                />
              </PermissionCard>

              {/* Score Data */}
              <PermissionCard icon={IconChartBar} label="Score Data" accent="#00D2FF">
                <ToggleRow
                  label="Maimai Name"
                  checked={privacySettings.show_maimai_name}
                  onChange={(e) => set('show_maimai_name', e.currentTarget.checked)}
                />
                <ToggleRow
                  label="Circle Name"
                  checked={privacySettings.show_circle !== false}
                  onChange={(e) => set('show_circle', e.currentTarget.checked)}
                />
                <ToggleRow
                  label="DX Rating"
                  checked={privacySettings.show_dx_rating}
                  onChange={(e) => set('show_dx_rating', e.currentTarget.checked)}
                />
                <ToggleRow
                  label="Play Count"
                  checked={privacySettings.show_play_count !== false}
                  onChange={(e) => set('show_play_count', e.currentTarget.checked)}
                />
                <ToggleRow
                  label="Best 50"
                  checked={privacySettings.show_best_50}
                  onChange={(e) => set('show_best_50', e.currentTarget.checked)}
                />
                <Collapse in={privacySettings.show_best_50}>
                  <ToggleRow
                    indented
                    size="sm"
                    label="Allow song details"
                    description="Visitors can click cards for more info"
                    checked={privacySettings.show_best_50_details === true}
                    onChange={(e) => set('show_best_50_details', e.currentTarget.checked)}
                  />
                </Collapse>
                <ToggleRow
                  label="Most Played"
                  checked={privacySettings.show_most_played !== false}
                  onChange={(e) => set('show_most_played', e.currentTarget.checked)}
                />
                <Collapse in={privacySettings.show_most_played !== false}>
                  <ToggleRow
                    indented
                    size="sm"
                    label="Allow song details"
                    description="Visitors can click cards for more info"
                    checked={privacySettings.show_most_played_details === true}
                    onChange={(e) => set('show_most_played_details', e.currentTarget.checked)}
                  />
                </Collapse>
                <ToggleRow
                  label="Recent Plays"
                  checked={privacySettings.show_recent_plays !== false}
                  onChange={(e) => set('show_recent_plays', e.currentTarget.checked)}
                />
              </PermissionCard>

              {/* Collections */}
              <PermissionCard icon={IconAlbum} label="Collections" accent="var(--theme-secondary)">
                <ToggleRow
                  label="Favorite Songs"
                  checked={privacySettings.show_favorite_songs}
                  onChange={(e) => set('show_favorite_songs', e.currentTarget.checked)}
                />
                <ToggleRow
                  label="Playlists"
                  checked={privacySettings.show_playlists}
                  onChange={(e) => set('show_playlists', e.currentTarget.checked)}
                />
                <ToggleRow
                  label="Community Posts"
                  checked={privacySettings.show_posts !== false}
                  onChange={(e) => set('show_posts', e.currentTarget.checked)}
                />
              </PermissionCard>
            </Stack>
          </Collapse>

          {/* Hint when public is off */}
          <Collapse in={!isPublic}>
            <Box
              style={{
                borderRadius: 14,
                padding: '12px 16px',
                background: 'color-mix(in srgb, var(--theme-text-muted) 8%, transparent)',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <IconLock size={16} color="var(--theme-text-muted)" />
              <Text size="sm" c="dimmed">
                Enable public profile above to configure which sections are visible to visitors.
              </Text>
            </Box>
          </Collapse>

          {/* ── Footer actions ── */}
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
              onClick={handleSave}
              loading={isSaving}
              leftSection={<IconCheck size={16} />}
            >
              Save Settings
            </Button>
          </Group>
        </Stack>
      </Box>
    </Modal>
  );
};

export default PrivacySettingsModal;
