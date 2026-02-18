import { Modal, Box, LoadingOverlay } from '@mantine/core';
import { useSongDatabase } from '../../../hooks/useSongDatabase';
import SongFilters from './SongFilters';
import SongList from './SongList';

function SongSelectionModal({ opened, onClose, onSelect }) {
  const {
    loading,
    filters,
    setFilters,
    filteredSongs,
    categories,
    versions,
    levels,
    internalLevels
  } = useSongDatabase();

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Select a Song"
      size="90%"
      padding="xl"
      styles={{
        body: { minHeight: '60vh' }
      }}
    >
      <Box pos="relative">
        <LoadingOverlay visible={loading} zIndex={100} overlayProps={{ radius: "sm", blur: 2 }} />

        {/* Layout Grid - Copied from SongDatabase for consistency */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '2rem',
          alignItems: 'start'
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
            gridTemplateColumns: '1fr',
            gap: '2rem',
            alignItems: 'start',
            width: '100%'
          }}>
            <div style={{ position: 'relative' }}>
              <SongFilters
                filters={filters}
                onFilterChange={setFilters}
                categories={categories}
                versions={versions}
                levels={levels}
                internalLevels={internalLevels}
              />
            </div>

            <div style={{ minWidth: 0 }}>
              <SongList
                key={JSON.stringify(filters)}
                songs={filteredSongs}
                loading={loading}
                onSongSelect={(song) => {
                  onSelect(song);
                  onClose();
                }}
              />
            </div>
          </div>
        </div>
      </Box>
    </Modal>
  );
}

export default SongSelectionModal;
