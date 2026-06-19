import { useState, useCallback, useEffect } from 'react';
import { Button, Stack, Text, Avatar, Menu, ActionIcon, Loader, Divider, Tooltip } from '@mantine/core';
import IconBrandGoogle from '@tabler/icons-react/dist/esm/icons/IconBrandGoogle.mjs';
import IconLogout from '@tabler/icons-react/dist/esm/icons/IconLogout.mjs';
import IconUser from '@tabler/icons-react/dist/esm/icons/IconUser.mjs';
import IconSettings from '@tabler/icons-react/dist/esm/icons/IconSettings.mjs';
import IconLock from '@tabler/icons-react/dist/esm/icons/IconLock.mjs';
import IconSun from '@tabler/icons-react/dist/esm/icons/IconSun.mjs';
import IconMoon from '@tabler/icons-react/dist/esm/icons/IconMoon.mjs';
import IconHistory from '@tabler/icons-react/dist/esm/icons/IconHistory.mjs';
import IconMail from '@tabler/icons-react/dist/esm/icons/IconMail.mjs';
import IconShieldLock from '@tabler/icons-react/dist/esm/icons/IconShieldLock.mjs';
import IconFileText from '@tabler/icons-react/dist/esm/icons/IconFileText.mjs';
import IconShieldCheck from '@tabler/icons-react/dist/esm/icons/IconShieldCheck.mjs';
import IconPalette from '@tabler/icons-react/dist/esm/icons/IconPalette.mjs';
import IconChevronUp from '@tabler/icons-react/dist/esm/icons/IconChevronUp.mjs';
import IconChevronRight from '@tabler/icons-react/dist/esm/icons/IconChevronRight.mjs';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useBranch } from '../hooks/useBranch';
import { useTheme } from '../contexts/ThemeContext';
import { notifications } from '@mantine/notifications';
import { userService } from '../services/supabase';
import ProfileSettingsModal from './profile/ProfileSettingsModal';
import PrivacySettingsModal from './profile/PrivacySettingsModal';
import ChangelogModal from './modals/ChangelogModal';
import './UserAccountMenu.css';

/**
 * User account menu displayed in the navbar.
 * Shows a Google login button when unauthenticated, or an avatar-triggered
 * dropdown menu when authenticated. Menu is organised into logical groups:
 * identity → primary navigation → settings → admin → support/info → legal → destructive.
 *
 * @param {Object}   props
 * @param {Function} props.onOpenPreferences        - Opens the app preferences modal.
 * @param {boolean}  [props.showThemeToggleInMenu]  - Renders the light/dark toggle inside the menu.
 * @param {'icon'|'sidebar'|'mobile-page'} [props.variant] - Trigger presentation.
 */
const UserAccountMenu = ({
  onOpenPreferences,
  showThemeToggleInMenu = false,
  variant = 'icon',
  mobileLeadingContent,
  onMobileNavigate,
}) => {
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
  const [menuOpened, setMenuOpened] = useState(false);

  const handleSocialLogin = async (provider) => {
    try {
      setIsLoading(true);
      await signInWithProvider(provider);
    } catch (err) {
      setIsLoading(false);
      console.error(`Failed to sign in with ${provider}:`, err);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error('Failed to sign out:', err);
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

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <ActionIcon variant="subtle" size="xl" className="login-icon">
        <Loader size="sm" />
      </ActionIcon>
    );
  }

  // ── Authenticated: avatar + dropdown ────────────────────────────────────────
  if (user) {
    const displayName = userRoles?.display_name || user.user_metadata?.full_name || 'User';
    const avatarUrl = userRoles?.display_photo_url || userRoles?.dx_display_photo_url;
    const isSidebar = variant === 'sidebar';
    const isMobilePage = variant === 'mobile-page';
    const navigateFromMobile = (path) => {
      onMobileNavigate?.();
      navigate(path);
    };
    const overlays = (
      <>
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

    if (isMobilePage) {
      return (
        <>
          <div className="mobile-more-account">
            <div className="mobile-more-identity">
              <Avatar src={avatarUrl} alt={displayName} size={40} radius="xl">
                <IconUser size={20} />
              </Avatar>
              <div>
                <Text className="mobile-more-name">{displayName}</Text>
                <Text className="mobile-more-email">{user.email}</Text>
              </div>
            </div>

            <div className="mobile-more-menu">
              {mobileLeadingContent}
              <button
                type="button"
                className="mobile-more-row"
                onClick={() => navigateFromMobile(userRoles?.slug ? `/p/${userRoles.slug}` : '/profile')}
              >
                <IconUser aria-hidden="true" />
                <span>Profile</span>
                <IconChevronRight aria-hidden="true" />
              </button>

              <div className="mobile-more-divider" />

              <button type="button" className="mobile-more-row" onClick={handleOpenProfileSettings} disabled={profileLoading}>
                <IconSettings aria-hidden="true" />
                <span>Profile settings</span>
                <IconChevronRight aria-hidden="true" />
              </button>
              <button type="button" className="mobile-more-row" onClick={handleOpenPrivacySettings} disabled={profileLoading}>
                <IconLock aria-hidden="true" />
                <span>Privacy settings</span>
                <IconChevronRight aria-hidden="true" />
              </button>
              <button type="button" className="mobile-more-row" onClick={onOpenPreferences}>
                <IconPalette aria-hidden="true" />
                <span>Select theme</span>
                <IconChevronRight aria-hidden="true" />
              </button>
              <button type="button" className="mobile-more-row" onClick={toggleTheme}>
                {isDark ? <IconSun aria-hidden="true" /> : <IconMoon aria-hidden="true" />}
                <span>{isDark ? 'Light mode' : 'Dark mode'}</span>
              </button>

              {(userRoles?.is_admin || userRoles?.is_super_admin) && (
                <>
                  <div className="mobile-more-divider" />
                  <button type="button" className="mobile-more-row is-admin" onClick={() => navigateFromMobile('/admin')}>
                    <IconShieldCheck aria-hidden="true" />
                    <span>Admin panel</span>
                    <IconChevronRight aria-hidden="true" />
                  </button>
                </>
              )}

              <div className="mobile-more-divider" />

              <button type="button" className="mobile-more-row" onClick={() => setChangelogOpened(true)}>
                <IconHistory aria-hidden="true" />
                <span>Changelogs</span>
              </button>
              <button type="button" className="mobile-more-row" onClick={() => navigateFromMobile('/contact')}>
                <IconMail aria-hidden="true" />
                <span>Contact</span>
              </button>
              <button type="button" className="mobile-more-row" onClick={() => navigateFromMobile('/privacy')}>
                <IconShieldLock aria-hidden="true" />
                <span>Privacy policy</span>
              </button>
              <button type="button" className="mobile-more-row" onClick={() => navigateFromMobile('/terms')}>
                <IconFileText aria-hidden="true" />
                <span>Terms of service</span>
              </button>

              <div className="mobile-more-divider" />

              <button
                type="button"
                className="mobile-more-row is-danger"
                onClick={() => {
                  onMobileNavigate?.();
                  handleLogout();
                }}
              >
                <IconLogout aria-hidden="true" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
          {overlays}
        </>
      );
    }

    return (
      <>
        <Menu
          opened={menuOpened}
          onChange={setMenuOpened}
          shadow="md"
          width={292}
          position={isSidebar ? 'top-end' : 'bottom-end'}
          offset={10}
          trapFocus
          closeOnEscape
          classNames={{ dropdown: 'profile-menu-dropdown', item: 'profile-menu-item' }}
        >
          <Menu.Target>
            {isSidebar ? (
              <button type="button" className="app-profile-trigger" aria-label={`Open profile menu for ${displayName}`}>
                <Avatar src={avatarUrl} alt={displayName} size={24} radius="xl">
                  <IconUser size={14} />
                </Avatar>
                <span>{displayName}</span>
                <IconChevronUp className={menuOpened ? 'is-open' : undefined} aria-hidden="true" />
              </button>
            ) : (
              <ActionIcon variant="subtle" size="xl" className="login-icon" aria-label={`Open profile menu for ${displayName}`}>
                <Avatar src={avatarUrl} alt={displayName} size={40} radius="xl">
                  <IconUser size={24} />
                </Avatar>
              </ActionIcon>
            )}
          </Menu.Target>

          <Menu.Dropdown>
            {/* ── Identity ── */}
            <div className="profile-menu-identity">
              <Avatar src={avatarUrl} alt={displayName} size={36} radius="xl">
                <IconUser size={20} />
              </Avatar>
              <Stack gap={1} className="profile-menu-identity-copy">
                <Text className="profile-menu-name">{displayName}</Text>
                <Text className="profile-menu-email">{user.email}</Text>
              </Stack>
            </div>

            <Divider />

            {!isSidebar && (
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
            )}

            {/* ── Settings ── */}
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
              leftSection={<IconPalette size={16} />}
              onClick={onOpenPreferences}
            >
              Select Theme
            </Menu.Item>
            {showThemeToggleInMenu && (
              <Menu.Item
                leftSection={isDark ? <IconSun size={16} /> : <IconMoon size={16} />}
                onClick={toggleTheme}
              >
                {isDark ? 'Light Mode' : 'Dark Mode'}
              </Menu.Item>
            )}

            {/* ── Admin (conditional) ── */}
            {(userRoles?.is_admin || userRoles?.is_super_admin) && (
              <>
                <Divider />
                <Menu.Item
                  leftSection={<IconShieldCheck size={16} />}
                  onClick={() => navigate('/admin')}
                  className="profile-menu-admin"
                >
                  Admin Panel
                </Menu.Item>
                <Divider />
              </>
            )}

            {/* ── Support / Info ── */}
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

            {/* ── Legal ── */}
            <Menu.Item
              leftSection={<IconShieldLock size={16} />}
              onClick={() => navigate('/privacy')}
            >
              Privacy Policy
            </Menu.Item>
            <Menu.Item
              leftSection={<IconFileText size={16} />}
              onClick={() => navigate('/terms')}
            >
              Terms of Service
            </Menu.Item>

            <Divider />

            {/* ── Destructive ── */}
            <Menu.Item
              leftSection={<IconLogout size={16} />}
              onClick={handleLogout}
              className="profile-menu-signout"
            >
              Sign Out
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>

        {overlays}
      </>
    );
  }

  // ── Unauthenticated: Google login button ────────────────────────────────────
  return (
    <div className="login-button-container">
      <Tooltip
        label={
          <Text size="xs" fw={700}>
            By signing in, you agree to our Privacy Policy and Terms of Service.
          </Text>
        }
        position="bottom-end"
        withArrow
        multiline
        w={220}
        offset={10}
        events={{ hover: true, focus: true, touch: true }}
        styles={{
          tooltip: {
            backgroundColor: 'color-mix(in srgb, var(--nav-surface) 90%, white 10%)',
            color: 'var(--nav-ink)',
            border: '1px solid var(--nav-border)',
            backdropFilter: 'blur(12px)',
            boxShadow: 'var(--mantine-shadow-md)',
            padding: '8px 12px',
            borderRadius: '12px',
          },
          arrow: {
            border: '1px solid var(--nav-border)',
            backgroundColor: 'color-mix(in srgb, var(--nav-surface) 90%, white 10%)',
          }
        }}
      >
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
      </Tooltip>
    </div>
  );
};

export default UserAccountMenu;
