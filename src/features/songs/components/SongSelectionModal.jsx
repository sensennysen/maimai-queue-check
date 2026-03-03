import { Modal, Box, LoadingOverlay, Button, Group, Text } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import { useSongDatabase } from '../../../hooks/useSongDatabase';
import SongFilters from './SongFilters';
import SongList from './SongList';

function SongSelectionModal({ opened, onClose, onSelect, multiple = false, initialSelectedSongs = [], onSelectionChange }) {
  const [selectedSongs, setSelectedSongs] = useState(initialSelectedSongs);

  useEffect(() => {
    // Only update if initialSelectedSongs has changed to avoid infinite loops
    // using JSON.stringify for a quick deep comparison of the song objects
    const initialIds = JSON.stringify(initialSelectedSongs.map(s => s.id));
    const currentIds = JSON.stringify(selectedSongs.map(s => s.id));

    if (initialIds !== currentIds) {
      setSelectedSongs(initialSelectedSongs);
    }
  }, [initialSelectedSongs]);

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

        {/* Layout Grid - Copied from SongDatabase for consistency */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '2rem',
          alignItems: 'start',
          marginTop: '2rem'
        }}>
          {/* Desktop: standard grid, Mobile: Stack */}
          <style dangerouslySetInnerHTML={{
            __html: `
                    @media (min-width: 992px) {
                        .song-modal-grid {
                            grid-template-columns: 280px 1fr !important;
                        }
                    }
                 `}} />

          <div className="song-modal-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr)', // Use minmax to prevent overflow
            gap: '2rem',
            alignItems: 'start',
            width: '100%',
            maxWidth: '100%'
          }}>
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
        </div>
      </Box>
    </Modal>
  );
}

export default SongSelectionModal;
