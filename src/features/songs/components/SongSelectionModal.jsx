import { useState, useEffect } from 'react';
import { Modal, Group, Text, Button, Box, LoadingOverlay } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import { useSongDatabase } from '../../hooks/useSongDatabase';
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
        <Group justify="space-between" w="100%" pr="xl">
          <Text fw={700}>{multiple ? `Select Songs (${selectedSongs.length} selected)` : 'Select a Song'}</Text>
          {multiple && (
            <Group gap="xs">
              {selectedSongs.length > 0 && (
                <Button
                  size="xs"
                  variant="subtle"
                  color="red"
                  onClick={() => handleSelectionChange([])}
                >
                  Clear Selection
                </Button>
              )}
              <Button
                size="xs"
                leftSection={<IconCheck size={16} />}
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
          )}
        </Group>
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

        {/* Layout Grid */}
        <div className={styles.songModalGrid} style={{ marginTop: '2rem' }}>
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
