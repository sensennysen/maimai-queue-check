import { useState, useCallback, useEffect } from 'react';
import { Button, Stack, Text, Avatar, Menu, ActionIcon, Loader, Divider, Badge, Group } from '@mantine/core';
import IconBrandGoogle from '@tabler/icons-react/dist/esm/icons/IconBrandGoogle.mjs';
import IconLogout from '@tabler/icons-react/dist/esm/icons/IconLogout.mjs';
import IconUser from '@tabler/icons-react/dist/esm/icons/IconUser.mjs';
import IconSettings from '@tabler/icons-react/dist/esm/icons/IconSettings.mjs';
import IconLock from '@tabler/icons-react/dist/esm/icons/IconLock.mjs';
import IconSun from '@tabler/icons-react/dist/esm/icons/IconSun.mjs';
import IconMoon from '@tabler/icons-react/dist/esm/icons/IconMoon.mjs';
import IconHistory from '@tabler/icons-react/dist/esm/icons/IconHistory.mjs';
import IconMail from '@tabler/icons-react/dist/esm/icons/IconMail.mjs';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useBranch } from '../hooks/useBranch';
import { useTheme } from '../contexts/ThemeContext';
import { notifications } from '@mantine/notifications';
import { userService } from '../services/supabase';
import ProfileSettingsModal from './profile/ProfileSettingsModal';
import PrivacySettingsModal from './profile/PrivacySettingsModal';
import ChangelogModal from './modals/ChangelogModal';
import './LoginForm.css';

const LoginForm = ({ onOpenPreferences, showThemeToggleInMenu = false }) => {
  const { user, loading, signInWithProvider, signOut, userRoles, refreshUserRoles } = useAuth();
  const { branches, allEnabledBranches } = useBranch();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSettingsOpen, setProfileSettingsOpen] = useState(false);
  const [privacySettingsOpen, setPrivacySettingsOpen] = useState(false);
  const [changelogOpened, setChangelogOpened] = useState(false);

  const handleSocialLogin = async (provider) => {
    try {
      setIsLoading(true);
      await signInWithProvider(provider);
    } catch {
      setIsLoading(false);
      // Error handled silently
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch {
      // Error handled silently
    }
  };

  useEffect(() => {
    if (!user?.id) {
      setProfileData(null);
      setProfileSettingsOpen(false);
      setPrivacySettingsOpen(false);
    }
  }, [user?.id]);

  const loadProfileData = useCallback(async () => {
    if (!user?.id) return null;
    setProfileLoading(true);
    try {
      const profile = await userService.getOwnProfile(user.id);
      setProfileData(profile);
      return profile;
    } catch (e) {
      notifications.show({
        title: 'Error',
        message: e.message || 'Failed to load profile settings',
        color: 'red',
      });
      return null;
    } finally {
      setProfileLoading(false);
    }
  }, [user?.id]);

  const handleOpenProfileSettings = useCallback(async () => {
    const profile = await loadProfileData();
    if (profile) setProfileSettingsOpen(true);
  }, [loadProfileData]);

  const handleOpenPrivacySettings = useCallback(async () => {
    const profile = await loadProfileData();
    if (profile) setPrivacySettingsOpen(true);
  }, [loadProfileData]);

  const refreshProfileData = useCallback(async () => {
    await refreshUserRoles();
    await loadProfileData();
  }, [loadProfileData, refreshUserRoles]);

  // Helper to render preferred branch badges
  const renderPreferredBranches = () => {
    const activeBranches = allEnabledBranches.length > 0 ? allEnabledBranches : branches;
    if (!userRoles?.preferred_branches?.length || !activeBranches.length) return null;

    return (
      <Group gap={4} mt={4} style={{ flexWrap: 'wrap', maxWidth: '100%' }}>
        {userRoles.preferred_branches.map(branchId => {
          const branch = activeBranches.find(b => b.id === branchId);
          if (!branch) return null;
          return (
            <Badge key={branchId} size="xs" variant="light" color="blue">
              {branch.acronym || branch.short_name}
            </Badge>
          );
        })}
      </Group>
    );
  };

  if (loading) {
    return (
      <ActionIcon variant="subtle" size="xl" className="login-icon">
        <Loader size="sm" />
      </ActionIcon>
    );
  }

  if (user) {
    return (
      <>
        <Menu shadow="md" width={280} position="bottom-end">
          <Menu.Target>
            <ActionIcon variant="subtle" size="xl" className="login-icon">
              <Avatar
                src={userRoles?.display_photo_url || userRoles?.dx_display_photo_url}
                alt={userRoles?.display_name || user.user_metadata?.full_name || user.email}
                size={40}
                radius="xl"
              >
                <IconUser size={24} />
              </Avatar>
            </ActionIcon>
          </Menu.Target>

          <Menu.Dropdown>
            <Menu.Label>
              <Stack gap={2}>
                <Text size="sm" fw={500}>
                  {userRoles?.display_name || user.user_metadata?.full_name || 'User'}
                </Text>
                <Text size="xs" c="secondary">
                  {user.email}
                </Text>
                {renderPreferredBranches()}
              </Stack>
            </Menu.Label>
            <Divider />
            <Menu.Item
              leftSection={<IconUser size={16} />}
              onClick={() => {
                if (userRoles?.slug) {
                  navigate(`/p/${userRoles.slug}`);
                } else {
                  navigate('/profile');
                }
              }}
            >
              Profile
            </Menu.Item>
            <Menu.Item
              leftSection={<IconSettings size={16} />}
              onClick={handleOpenProfileSettings}
              disabled={profileLoading}
            >
              Profile Settings
            </Menu.Item>
            <Menu.Item
              leftSection={<IconLock size={16} />}
              onClick={handleOpenPrivacySettings}
              disabled={profileLoading}
            >
              Privacy Settings
            </Menu.Item>
            <Menu.Item
              leftSection={<IconSettings size={16} />}
              onClick={onOpenPreferences}
            >
              App Settings
            </Menu.Item>
            {showThemeToggleInMenu && (
              <Menu.Item
                leftSection={isDark ? <IconSun size={16} /> : <IconMoon size={16} />}
                onClick={toggleTheme}
              >
                {isDark ? 'Light Mode' : 'Dark Mode'}
              </Menu.Item>
            )}
            {(userRoles?.is_admin || userRoles?.is_super_admin) && (
              <>
                <Menu.Item
                  leftSection={<IconSettings size={16} />}
                  onClick={() => navigate('/admin')}
                >
                  Admin Panel
                </Menu.Item>
              </>
            )}
            <Divider />
            <Menu.Item
              leftSection={<IconLogout size={16} />}
              onClick={handleLogout}
              color="red"
            >
              Sign Out
            </Menu.Item>
            <Divider />
            <Menu.Item
              leftSection={<IconHistory size={16} />}
              onClick={() => setChangelogOpened(true)}
            >
              Changelogs
            </Menu.Item>
            <Menu.Item
              leftSection={<IconMail size={16} />}
              onClick={() => navigate('/contact')}
            >
              Contact
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>

        <ChangelogModal
          opened={changelogOpened}
          onClose={() => setChangelogOpened(false)}
        />

        <ProfileSettingsModal
          opened={profileSettingsOpen}
          onClose={() => setProfileSettingsOpen(false)}
          userId={user.id}
          initialData={profileData}
          allBranches={allEnabledBranches.length > 0 ? allEnabledBranches : branches}
          onSuccess={refreshProfileData}
        />
        <PrivacySettingsModal
          opened={privacySettingsOpen}
          onClose={() => setPrivacySettingsOpen(false)}
          userId={user.id}
          initialData={profileData}
          onSuccess={refreshProfileData}
        />
      </>
    );
  }

  // When not authenticated, show a prominent login button.
  return (
    <div className="login-button-container">
      <Button
        leftSection={<IconBrandGoogle size={16} />}
        onClick={() => handleSocialLogin('google')}
        variant="light"
        color="red"
        className="google-login-button"
        loading={isLoading}
      >
        <span className="login-button-text">Login with Google</span>
      </Button>
    </div>
  );
};

export default LoginForm;
