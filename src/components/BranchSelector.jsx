import { useState } from 'react';
import { Button, Menu, Text, Group, Badge, Loader } from '@mantine/core';
import { IconMapPin, IconChevronDown, IconCheck } from '@tabler/icons-react';
import { useBranch } from '../hooks/useBranch';
import { getDistance } from '../services/geolocation';

function BranchSelector() {
  const { branches, selectedBranch, setSelectedBranch, loading, userLocation, refreshLocation } = useBranch();
  const [menuOpened, setMenuOpened] = useState(false);

  if (loading) {
    return (
      <Button variant="light" disabled leftSection={<Loader size="xs" />}>
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
      onChange={setMenuOpened}
      position="bottom-start"
      shadow="md"
      width={280}
    >
      <Menu.Target>
        <Button
          variant="light"
          leftSection={<IconMapPin size={16} />}
          rightSection={<IconChevronDown size={14} />}
          styles={() => ({
            root: {
              paddingRight: 8,
            },
          })}
        >
          <Text size="sm" fw={500} truncate style={{ maxWidth: 150 }}>
            {selectedBranch.arcade_name}
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
                  <Badge size="sm" variant="light" color={distance < 100 ? 'green' : 'gray'}>
                    {distance < 1000 ? `${distance}m` : `${(distance / 1000).toFixed(1)}km`}
                  </Badge>
                )
              }
              style={{
                backgroundColor: isSelected ? 'var(--mantine-color-primary-light)' : undefined,
              }}
            >
              <Text size="sm" fw={isSelected ? 600 : 400}>
                {branch.arcade_name}
              </Text>
            </Menu.Item>
          );
        })}
      </Menu.Dropdown>
    </Menu>
  );
}

export default BranchSelector;
