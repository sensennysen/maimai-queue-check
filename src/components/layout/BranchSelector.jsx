import { useState, useEffect } from 'react';
import { Button, Menu, Text, Badge, Loader } from '@mantine/core';
import IconMapPin from '@tabler/icons-react/dist/esm/icons/IconMapPin.mjs';
import IconChevronDown from '@tabler/icons-react/dist/esm/icons/IconChevronDown.mjs';
import IconCheck from '@tabler/icons-react/dist/esm/icons/IconCheck.mjs';
import { useBranch } from '../../hooks/useBranch';
import { useTheme } from '../../contexts/ThemeContext';
import { getDistance, checkGeolocationPermission } from '../../services/geolocation';

function BranchSelector() {
  const { branches, selectedBranch, setSelectedBranch, loading, userLocation, refreshLocation } = useBranch();
  const { themeColors } = useTheme();
  const [menuOpened, setMenuOpened] = useState(false);
  const [locationRequested, setLocationRequested] = useState(false);

  // Request location on mount if permission is already granted
  useEffect(() => {
    const initializeLocation = async () => {
      if (!locationRequested) {
        setLocationRequested(true);
        const permissionState = await checkGeolocationPermission();
        if (permissionState === 'granted') {
          await refreshLocation();
        }
      }
    };

    initializeLocation();
    // Intentionally run once on mount: refreshLocation and locationRequested state
    // are excluded to prevent re-running on every render after the initial permission check.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Also request location when dropdown is opened for the first time
  const handleMenuChange = async (opened) => {
    setMenuOpened(opened);

    if (opened && !userLocation && !locationRequested) {
      setLocationRequested(true);
      await refreshLocation();
    }
  };

  if (loading) {
    return (
      <Button variant="light" disabled leftSection={<Loader size="sm" />}>
        Loading...
      </Button>
    );
  }

  if (!selectedBranch) {
    return null;
  }

  const handleBranchChange = async (branch) => {
    setSelectedBranch(branch);
    setMenuOpened(false);

    // Refresh location when changing branches
    await refreshLocation();
  };

  const getBranchDistance = (branch) => {
    if (!userLocation) return null;

    const distance = getDistance(userLocation, {
      latitude: branch.latitude,
      longitude: branch.longitude,
    });

    return Math.round(distance);
  };

  return (
    <Menu
      opened={menuOpened}
      onChange={handleMenuChange}
      position="bottom-start"
      shadow="md"
      width={280}
    >
      <Menu.Target>
        <Button
          variant="light"
          leftSection={<IconMapPin size={16} />}
          rightSection={<IconChevronDown size={14} />}
          className="branch-selector-button"
          styles={() => ({
            root: {
              paddingRight: 8,
            },
          })}
        >
          <Text size="sm" fw={500} truncate="end">
            {selectedBranch.short_name || selectedBranch.arcade_name}
          </Text>
        </Button>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>Select Branch</Menu.Label>
        {branches.map((branch) => {
          const distance = getBranchDistance(branch);
          const isSelected = selectedBranch?.id === branch.id;

          return (
            <Menu.Item
              key={branch.id}
              onClick={() => handleBranchChange(branch)}
              leftSection={isSelected ? <IconCheck size={16} /> : <IconMapPin size={16} />}
              rightSection={
                distance !== null && (
                  <Badge size="sm" variant="light" color={distance < 100 ? themeColors.lightest : themeColors.darkest}>
                    {distance < 1000 ? `${distance}m` : `${(distance / 1000).toFixed(1)}km`}
                  </Badge>
                )
              }
              style={{
                backgroundColor: isSelected ? 'color-mix(in srgb, var(--theme-primary), transparent 85%)' : undefined,
              }}
            >
              <Text size="sm" fw={isSelected ? 600 : 400}>
                {branch.short_name || branch.arcade_name}
              </Text>
            </Menu.Item>
          );
        })}
      </Menu.Dropdown>
    </Menu>
  );
}

export default BranchSelector;
