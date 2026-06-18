import { useState, useEffect } from 'react';
import { Modal, Group, Text, Button, Box, LoadingOverlay } from '@mantine/core';
import IconCheck from '@tabler/icons-react/dist/esm/icons/IconCheck.mjs';
import { useSongDatabase } from '../../../hooks/useSongDatabase';
import SongFilters from './SongFilters';
import SongList from './SongList';
import styles from './SongSelectionModal.module.css';

function SongSelectionModal({ opened, onClose, onSelect, multiple = false, initialSelectedSongs = [], onSelectionChange }) {
  const [selectedSongs, setSelectedSongs] = useState(initialSelectedSongs);

  useEffect(() => {
    setSelectedSongs(initialSelectedSongs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened]);

  const handleSelectionChange = (songs) => {
    setSelectedSongs(songs);
    if (onSelectionChange) {
      onSelectionChange(songs);
    }
  };

  const {
    loading,
    filters,
    setFilters,
    filteredSongs,
    categories,
    versions,
    levels,
    internalLevels,
    error
  } = useSongDatabase();

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Text fw={700} size="lg">
          {multiple ? 'Select Songs' : 'Select a Song'}
        </Text>
      }
      size="90%"
      padding="xl"
      styles={{
        body: { overflowX: 'hidden' }, // Prevent horizontal stretch
        content: { maxWidth: '100vw' } // Ensure it doesn't exceed viewport
      }}
    >
      <Box pos="relative">
        <LoadingOverlay visible={loading} zIndex={100} overlayProps={{ radius: "sm", blur: 2 }} />

        {/* Mobile Header Actions (Inside Body) */}
        {multiple && (
          <Group justify="space-between" mb="lg" hiddenFrom="md" style={{ marginTop: '1rem' }}>
            <Text fw={600} size="sm">
              {selectedSongs.length} Selected
            </Text>
            <Group gap="xs">
              {selectedSongs.length > 0 && (
                <Button
                  size="compact-xs"
                  variant="subtle"
                  color="red"
                  onClick={() => handleSelectionChange([])}
                >
                  Clear
                </Button>
              )}
              <Button
                size="sm"
                px="xl"
                radius="md"
                leftSection={<IconCheck size={16} />}
                onClick={() => {
                  onSelect(selectedSongs);
                  setSelectedSongs([]);
                  onClose();
                }}
                disabled={selectedSongs.length === 0}
              >
                Confirm
              </Button>
            </Group>
          </Group>
        )}

        {/* Desktop Header Actions (Inside Body) */}
        {multiple && (
          <Group justify="space-between" mb="xl" visibleFrom="md" style={{ marginTop: '1rem' }}>
            <Text fw={700} size="xl" style={{ fontFamily: 'var(--font-heading)' }}>
              {selectedSongs.length} songs selected
            </Text>
            <Group gap="md">
              {selectedSongs.length > 0 && (
                <Button
                  size="sm"
                  variant="subtle"
                  color="red"
                  onClick={() => handleSelectionChange([])}
                >
                  Clear Selection
                </Button>
              )}
              <Button
                size="md"
                px="xl"
                radius="md"
                leftSection={<IconCheck size={20} />}
                onClick={() => {
                  onSelect(selectedSongs);
                  setSelectedSongs([]);
                  onClose();
                }}
                disabled={selectedSongs.length === 0}
              >
                Confirm Selection
              </Button>
            </Group>
          </Group>
        )}

        {/* Layout Grid */}
        <div className={styles.songModalGrid} style={{ marginTop: '1rem' }}>
          <div style={{ position: 'relative', minWidth: 0, maxWidth: '100%' }}>
            <SongFilters
              filters={filters}
              onFilterChange={setFilters}
              categories={categories}
              versions={versions}
              levels={levels}
              internalLevels={internalLevels}
            />
          </div>

          <div style={{ minWidth: 0, maxWidth: '100%' }}>
            <SongList
              key={JSON.stringify(filters)}
              songs={filteredSongs}
              loading={loading}
              error={error}
              onSongSelect={(song) => {
                if (multiple) {
                  // Handled via onSelectionChange
                } else {
                  onSelect(song);
                  onClose();
                }
              }}
              multiple={multiple}
              selectedSongs={selectedSongs}
              onSelectionChange={handleSelectionChange}
            />
          </div>
        </div>
      </Box>
    </Modal>
  );
}

export default SongSelectionModal;
