import { TextInput, MultiSelect, Select, Text, Stack, Paper, Collapse, Button, Group, Box, Switch } from '@mantine/core';
import IconSearch from '@tabler/icons-react/dist/esm/icons/IconSearch.mjs';
import IconFilter from '@tabler/icons-react/dist/esm/icons/IconFilter.mjs';
import IconX from '@tabler/icons-react/dist/esm/icons/IconX.mjs';
import IconChevronDown from '@tabler/icons-react/dist/esm/icons/IconChevronDown.mjs';
import IconChevronUp from '@tabler/icons-react/dist/esm/icons/IconChevronUp.mjs';
import { useState, useMemo } from 'react';
import { VERSION_ORDER } from '../../../config/maimai-constants';

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

function SongFilters({ filters, onFilterChange, categories, versions, levels = [], internalLevels = [], artists = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(false);
  const isInternal = filters.showInternalLevels;

  const levelOptions = useMemo(() => levels.map(l => ({ value: l, label: l })), [levels]);
  const orderedVersions = useMemo(() => {
    const reversedVersionOrder = [...VERSION_ORDER].reverse();
    const knownVersions = reversedVersionOrder.filter(version => versions.includes(version));
    const unknownVersions = versions
      .filter(version => !VERSION_ORDER.includes(version))
      .sort((a, b) => a.localeCompare(b));

    return [...knownVersions, ...unknownVersions];
  }, [versions]);

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

  const hasActiveFilters = filters.query !== '' || filters.categories.length > 0 || filters.versions.length > 0 ||
    filters.levelMin !== '' || filters.levelMax !== '' || filters.region !== 'intl' || filters.type !== '' || filters.artists?.length > 0;

  const resetFilters = () => {
    onFilterChange({
      ...filters,
      query: '',
      categories: [],
      versions: [],
      levelMin: '',
      levelMax: '',
      showInternalLevels: false,
      region: 'intl',
      type: '',
      artists: []
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
    <Stack gap="md" className="song-filter-fields" style={{ width: '100%', maxWidth: '100%' }}>
      <TextInput
        className="song-filter-search"
        placeholder="Search title, artist..."
        leftSection={<IconSearch size={16} />}
        value={filters.query}
        onChange={(e) => updateFilter('query', e.currentTarget.value)}
        variant="default"
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
        variant="default"
        radius="md"
        comboboxProps={{ withinPortal: false }}
      />

      <MultiSelect
        label="Artists"
        placeholder="Select artists"
        data={artists}
        value={filters.artists || []}
        onChange={(val) => updateFilter('artists', val)}
        searchable
        clearable
        variant="default"
        radius="md"
        comboboxProps={{ withinPortal: false }}
      />

      <MultiSelect
        label="Versions"
        placeholder="Select versions"
        data={orderedVersions}
        value={filters.versions}
        onChange={(val) => updateFilter('versions', val)}
        searchable
        clearable
        variant="default"
        radius="md"
        comboboxProps={{ withinPortal: false }}
      />

      <Select
        label="Chart Type"
        placeholder="All types"
        data={[
          { label: 'DX', value: 'dx' },
          { label: 'Standard', value: 'standard' },
        ]}
        value={filters.type || null}
        onChange={(val) => updateFilter('type', val || '')}
        variant="default"
        radius="md"
        clearable
        comboboxProps={{ withinPortal: false }}
      />

      <Select
        label="Region"
        placeholder="Select region"
        data={[
          { label: 'Japanese Version', value: 'jp' },
          { label: 'International', value: 'intl' },
          { label: 'USA International', value: 'usa' },
          { label: 'Chinese International', value: 'cn' },
          { label: 'Unavailable to Japanese', value: 'unav_jp' },
          { label: 'Unavailable to International', value: 'unav_intl' },
          { label: 'Unavailable to USA', value: 'unav_usa' },
          { label: 'Unavailable to Chinese', value: 'unav_cn' },
        ]}
        value={filters.region || null}
        onChange={(val) => updateFilter('region', val || 'intl')}
        variant="default"
        radius="md"
        allowDeselect={false}
        comboboxProps={{ withinPortal: false }}
      />

      <Stack gap="xs" className="song-filter-levels">
        <Group justify="space-between">
          <Text size="sm" fw={500}>{isInternal ? 'Internal Level Range' : 'Level Range'}</Text>
          <Switch
            label="Use Internal Levels"
            checked={filters.showInternalLevels}
            onChange={handleToggleInternal}
            size="sm"
          />
        </Group>

        <Group grow>
          <Select
            label="Min"
            placeholder="Any"
            data={isInternal ? internalLevelOptions : levelOptions}
            value={filters.levelMin || null}
            onChange={(val) => updateFilter('levelMin', val || '')}
            variant="default"
            radius="md"
            clearable
            searchable
            comboboxProps={{ withinPortal: false }}
          />
          <Select
            label="Max"
            placeholder="Any"
            data={isInternal ? internalLevelOptions : levelOptions}
            value={filters.levelMax || null}
            onChange={(val) => updateFilter('levelMax', val || '')}
            variant="default"
            radius="md"
            clearable
            searchable
            comboboxProps={{ withinPortal: false }}
          />
        </Group>
      </Stack>

      {hasActiveFilters && (
        <Button
          className="song-filter-reset"
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
        variant="default"
        leftSection={<IconFilter size={16} />}
        rightSection={hasActiveFilters && <Box w={6} h={6} style={{ borderRadius: '50%', background: 'var(--theme-primary)' }} />}
        onClick={() => setIsOpen(!isOpen)}
        display={{ base: 'flex', md: 'none' }}
        radius="md"
        size="sm"
        className="song-filter-toggle"
      >
        {isOpen ? 'Close Filters' : 'Adjust Filters'}
      </Button>

      {/* Mobile Collapse content */}
      <Collapse in={isOpen} transitionDuration={200} animateOpacity display={{ base: 'block', md: 'none' }}>
        <Paper p="md" radius="md" className="song-filter-panel" style={{ width: '100%', overflowX: 'hidden' }}>
          {filterContent}
        </Paper>
      </Collapse>

      {/* Desktop View: Full-width filter toolbar */}
      <Paper
        p={desktopOpen ? 'md' : 'xs'}
        radius="md"
        className="song-filter-panel song-filter-panel--toolbar"
        display={{ base: 'none', md: 'block' }}
      >
        <Group justify="space-between" align="center" wrap="nowrap" className="song-filter-toolbar-header">
          <div>
            <Text fw={700} size="md" style={{ fontFamily: 'var(--font-heading)' }}>Filters</Text>
            {!desktopOpen && hasActiveFilters && (
              <Text size="xs" c="dimmed">Active filters are still applied</Text>
            )}
          </div>
          <Button
            variant="subtle"
            size="compact-sm"
            onClick={() => setDesktopOpen((current) => !current)}
            rightSection={desktopOpen ? <IconChevronUp size={15} /> : <IconChevronDown size={15} />}
            aria-expanded={desktopOpen}
            aria-controls="desktop-song-filters"
          >
            {desktopOpen ? 'Hide filters' : 'Show filters'}
          </Button>
        </Group>

        <Collapse in={desktopOpen} transitionDuration={160}>
          <div id="desktop-song-filters" className="song-filter-toolbar-content">
            {filterContent}
          </div>
        </Collapse>
      </Paper>
    </Stack>
  );
}

export default SongFilters;
