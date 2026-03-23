import { useMemo } from 'react';
import { Modal, Image, Stack, Text } from '@mantine/core';

export function ImagePreviewModal({ opened, onClose, src, alt, caption }) {
  const resolvedAlt = useMemo(() => alt || caption || 'Image preview', [alt, caption]);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={caption ? <Text fw={700} style={{ fontFamily: 'var(--font-heading)' }}>{caption}</Text> : undefined}
      size="xl"
      radius="md"
      centered
      transitionProps={{ transition: 'fade', duration: 0 }}
      classNames={{ content: 'profile-modal-pop' }}
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 3,
      }}
    >
      <Stack align="center" spacing="sm">
        <Image
          src={src}
          alt={resolvedAlt}
          fit="contain"
          radius="md"
          w="100%"
          mah="80vh"
          withPlaceholder
          fallbackSrc="https://placehold.co/600x400?text=Image+not+found"
        />
      </Stack>
    </Modal>
  );
}

