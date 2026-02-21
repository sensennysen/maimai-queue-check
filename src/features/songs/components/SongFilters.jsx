import { TextInput, MultiSelect, Select, Text, Stack, Paper, Collapse, Button, Group, Box, ActionIcon, Tooltip, Switch } from '@mantine/core';
import { IconSearch, IconFilter, IconX } from '@tabler/icons-react';
import { useState, useMemo } from 'react';

// Helper for level conversion
const parseLevel = (levelStr) => {
  if (!levelStr) return 0;
  if (!isNaN(levelStr)) return parseFloat(levelStr);
  const base = parseFloat(levelStr);
  if (levelStr.includes('+')) return base + 0.7;
  return base;
};

// Helper to convert internal float back to approximate label
const toLevelLabel = (val) => {
  const floor = Math.floor(val);
  const decimal = val - floor;
  if (decimal >= 0.65) return `${floor}+`;
  return `${floor}`;
};

function SongFilters({ filters, onFilterChange, categories, versions, levels = [], internalLevels = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const isInternal = filters.showInternalLevels;

  const levelOptions = useMemo(() => levels.map(l => ({ value: l, label: l })), [levels]);

  // For internal levels: fill from 1.0 up to the lowest available DB value (in increments of 1), then use actual DB values
  const internalLevelOptions = useMemo(() => {
    if (internalLevels.length === 0) return [];

    const lowestDb = parseFloat(internalLevels[0]); // already sorted
    const allOptions = new Set();

    // Fill from 1.0 up to floor of lowest DB value in increments of 1
    for (let i = 1; i < Math.floor(lowestDb); i++) {
      allOptions.add(i.toFixed(1));
    }

    // Add all DB values
    internalLevels.forEach(l => allOptions.add(l));

    // Sort and return
    return Array.from(allOptions)
      .sort((a, b) => parseFloat(a) - parseFloat(b))
      .map(l => ({ value: l, label: l }));
  }, [internalLevels]);

  // Helper to update specific filter
  const updateFilter = (key, value) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const hasActiveFilters = filters.categories.length > 0 || filters.versions.length > 0 ||
    filters.levelMin !== '' || filters.levelMax !== '';

  const resetFilters = () => {
    onFilterChange({
      ...filters,
      categories: [],
      versions: [],
      levelMin: '',
      levelMax: '',
      showInternalLevels: false
    });
  };

  const handleToggleInternal = (e) => {
    const checked = e.currentTarget.checked;
    const newFilters = { ...filters, showInternalLevels: checked };

    // Convert values when switching modes
    if (filters.levelMin) {
      if (checked) {
        const minVal = parseLevel(filters.levelMin);
        newFilters.levelMin = minVal.toFixed(1);
      } else {
        const minVal = parseFloat(filters.levelMin);
        newFilters.levelMin = toLevelLabel(minVal);
      }
    }

    if (filters.levelMax) {
      if (checked) {
        const maxVal = parseLevel(filters.levelMax);
        newFilters.levelMax = maxVal.toFixed(1);
      } else {
        const maxVal = parseFloat(filters.levelMax);
        newFilters.levelMax = toLevelLabel(maxVal);
      }
    }

    onFilterChange(newFilters);
  };

  // Inline the filter content instead of using a component function (avoids remount/focus loss)
  const filterContent = (
    <Stack gap="lg">
      <TextInput
        placeholder="Search title, artist..."
        leftSection={<IconSearch size={16} />}
        value={filters.query}
        onChange={(e) => updateFilter('query', e.currentTarget.value)}
        variant="filled"
        radius="md"
        size="md"
      />

      <MultiSelect
        label="Categories"
        placeholder="Select categories"
        data={categories}
        value={filters.categories}
        onChange={(val) => updateFilter('categories', val)}
        searchable
        clearable
        variant="filled"
        radius="md"
      />

      <MultiSelect
        label="Versions"
        placeholder="Select versions"
        data={versions}
        value={filters.versions}
        onChange={(val) => updateFilter('versions', val)}
        searchable
        clearable
        variant="filled"
        radius="md"
      />

      <Stack gap="xs">
        <Group justify="space-between">
          <Text size="sm" fw={500}>{isInternal ? 'Internal Level Range' : 'Level Range'}</Text>
          <Switch
            label="Use Internal Levels"
            checked={filters.showInternalLevels}
            onChange={handleToggleInternal}
            size="xs"
          />
        </Group>

        <Group grow>
          <Select
            label="Min"
            placeholder="Any"
            data={isInternal ? internalLevelOptions : levelOptions}
            value={filters.levelMin || null}
            onChange={(val) => updateFilter('levelMin', val || '')}
            variant="filled"
            radius="md"
            clearable
            searchable
          />
          <Select
            label="Max"
            placeholder="Any"
            data={isInternal ? internalLevelOptions : levelOptions}
            value={filters.levelMax || null}
            onChange={(val) => updateFilter('levelMax', val || '')}
            variant="filled"
            radius="md"
            clearable
            searchable
          />
        </Group>
      </Stack>

      {hasActiveFilters && (
        <Button
          variant="light"
          color="red"
          leftSection={<IconX size={16} />}
          onClick={resetFilters}
          fullWidth
        >
          Reset Filters
        </Button>
      )}
    </Stack>
  );

  return (
    <Stack gap="md" style={{ maxWidth: '100%', overflowX: 'hidden' }}>
      {/* Mobile Toggle */}
      <Button
        variant="light"
        leftSection={<IconFilter size={16} />}
        rightSection={hasActiveFilters && <Box w={6} h={6} style={{ borderRadius: '50%', background: 'var(--theme-primary)' }} />}
        onClick={() => setIsOpen(!isOpen)}
        fullWidth
        display={{ base: 'flex', md: 'none' }}
        radius="md"
        size="md"
      >
        {isOpen ? 'Hide Filters' : 'Show Filters'}
      </Button>

      {/* Mobile Collapse content */}
      <Collapse in={isOpen} transitionDuration={200} animateOpacity display={{ base: 'block', md: 'none' }}>
        <Paper p="md" radius="lg" className="hologram-card" style={{ width: '100%', overflowX: 'hidden' }}>
          {filterContent}
        </Paper>
      </Collapse>

      {/* Desktop View: Side panel */}
      <Paper
        p="xl"
        radius="lg"
        className="hologram-card"
        display={{ base: 'none', md: 'block' }}
        style={{ position: 'sticky', top: '2rem' }}
      >
        <Stack gap="lg">
          <Group justify="space-between" align="center" wrap="nowrap">
            <Text fw={700} size="lg" style={{ fontFamily: 'var(--font-heading)' }} truncate>Filters</Text>
            {hasActiveFilters && (
              <Tooltip label="Reset all filters">
                <ActionIcon variant="subtle" color="gray" onClick={resetFilters}>
                  <IconFilter size={16} style={{ opacity: 0.5 }} />
                  <IconX size={12} style={{ position: 'absolute', bottom: 4, right: 4 }} />
                </ActionIcon>
              </Tooltip>
            )}
          </Group>
          {filterContent}
        </Stack>
      </Paper>
    </Stack>
  );
}

export default SongFilters;
