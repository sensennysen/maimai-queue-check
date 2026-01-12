import { ActionIcon, Tooltip } from '@mantine/core';
import { IconSun, IconMoon } from '@tabler/icons-react';
import { useTheme } from '../contexts/ThemeContext';

function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <Tooltip 
      label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'} 
      position="bottom"
    >
      <ActionIcon
        onClick={toggleTheme}
        size="lg"
        variant="subtle"
        style={{
          color: 'var(--theme-text-primary)',
          backgroundColor: 'transparent'
        }}
        className="theme-toggle"
      >
        {isDark ? (
          <IconSun size={20} />
        ) : (
          <IconMoon size={20} />
        )}
      </ActionIcon>
    </Tooltip>
  );
}

export default ThemeToggle;