import { useState, useRef, useCallback } from 'react';
import { Modal, Stack, Group, Button, Text, Image, FileButton, Alert, Box, Slider, LoadingOverlay, UnstyledButton } from '@mantine/core';
import IconUpload from '@tabler/icons-react/dist/esm/icons/IconUpload.mjs';
import IconTrash from '@tabler/icons-react/dist/esm/icons/IconTrash.mjs';
import IconAlertCircle from '@tabler/icons-react/dist/esm/icons/IconAlertCircle.mjs';
import IconCheck from '@tabler/icons-react/dist/esm/icons/IconCheck.mjs';
import IconCamera from '@tabler/icons-react/dist/esm/icons/IconCamera.mjs';
import IconRotate from '@tabler/icons-react/dist/esm/icons/IconRotate.mjs';
import Cropper from 'react-easy-crop';
import { userService } from '../../services/supabase';

// Helper to create a cropped image
const getCroppedImg = async (imageSrc, pixelCrop) => {
  const image = new window.Image();
  image.src = imageSrc;
  await new Promise((resolve) => (image.onload = resolve));

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) return null;

  // Set canvas size to the cropped area
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // Draw the cropped portion of the source image onto the canvas
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  // Convert canvas to blob
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/jpeg', 0.95);
  });
};

const ProfilePictureUploadModal = ({ opened, onClose, userId, currentPhotoUrl, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const resetRef = useRef(null);

  const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/bmp'];

  const onCropComplete = useCallback((_croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileChange = (payload) => {
    setError(null);
    setSuccess(false);

    if (!payload) return;

    if (!ALLOWED_TYPES.includes(payload.type)) {
      setError('Invalid file format. Please use JPEG, PNG, or BMP.');
      return;
    }

    if (payload.size > MAX_FILE_SIZE) {
      setError('File is too large. Maximum size is 20MB.');
      return;
    }

    const reader = new FileReader();
    reader.addEventListener('load', () => {
      setImageSrc(reader.result);
      setFile(payload);
    });
    reader.readAsDataURL(payload);
  };

  const handleUpload = async () => {
    if (!imageSrc || !croppedAreaPixels || !userId) return;

    setIsUploading(true);
    setError(null);

    try {
      // 1. Generate cropped blob
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      if (!croppedBlob) throw new Error('Failed to generate cropped image');

      // Create a File from Blob for Supabase
      const croppedFile = new File([croppedBlob], `avatar_${Date.now()}.jpg`, { type: 'image/jpeg' });

      // 2. Upload to storage
      const publicUrl = await userService.uploadProfilePicture(userId, croppedFile);

      // 3. Update database
      await userService.updateProfilePicture(userId, publicUrl);

      // 4. Cleanup old custom photo if it exists
      const oldPath = userService.extractStoragePath(currentPhotoUrl);
      if (oldPath) {
        await userService.deleteProfilePictureFile(oldPath);
      }

      setSuccess(true);
      if (onSuccess) onSuccess(publicUrl);

      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload image.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!window.confirm('Are you sure you want to remove your custom profile picture?')) return;

    setIsUploading(true);
    setError(null);

    try {
      // 1. Delete file from storage if it exists and is a custom upload
      const path = userService.extractStoragePath(currentPhotoUrl);
      if (path) {
        await userService.deleteProfilePictureFile(path);
      }

      // 2. Update database
      await userService.updateProfilePicture(userId, null);
      setSuccess(true);
      if (onSuccess) onSuccess(null);

      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err) {
      console.error('Remove error:', err);
      setError(err.message || 'Failed to remove image.');
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setError(null);
    setSuccess(false);
    if (resetRef.current) resetRef.current();
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      aria-label="Profile Picture"
      size="md"
      radius={24}
      padding={0}
      withCloseButton={false}
      centered
      styles={{
        content: {
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        },
        body: {
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
        },
      }}
    >
      <LoadingOverlay visible={isUploading} zIndex={100} overlayProps={{ radius: 'md', blur: 2 }} />

      {/* ── Fixed Header ─────────────────────────────────────────── */}
      <Box
        className="app-modal-header"
        style={{
          background: 'linear-gradient(135deg, var(--theme-primary), color-mix(in srgb, var(--theme-primary), var(--theme-secondary) 40%))',
          padding: '24px 24px 20px',
          position: 'relative',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        <Group gap="sm" style={{ position: 'relative', zIndex: 1 }}>
          <Box
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.3)',
            }}
          >
            <IconCamera size={18} color="var(--theme-primary-contrast)" strokeWidth={2.2} />
          </Box>
          <Box>
            <Text
              size="lg"
              fw={800}
              style={{
                fontFamily: 'var(--font-heading)',
                color: 'var(--theme-primary-contrast)',
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
              }}
            >
              Profile Picture
            </Text>
            <Text size="xs" style={{ color: 'var(--theme-primary-contrast)', opacity: 0.8, marginTop: 2 }}>
              Update your account avatar
            </Text>
          </Box>
        </Group>

        <UnstyledButton
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            padding: '4px 12px',
            borderRadius: 20,
            background: 'rgba(255,255,255,0.2)',
            color: 'var(--theme-primary-contrast)',
            fontSize: 12,
            fontWeight: 700,
            backdropFilter: 'blur(4px)',
            transition: 'all 0.2s ease',
            zIndex: 10,
          }}
          aria-label="Close"
          className="header-close-pill"
        >
          Cancel
        </UnstyledButton>
      </Box>

      {/* ── Body ─────────────────────────────────────────────────── */}
      <Box style={{ flex: 1, overflowY: 'auto' }}>
        <Stack gap="md" p="lg">
          <Box
            style={{
              borderRadius: 18,
              padding: '16px',
              background: 'var(--theme-surface)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              border: '1px solid var(--theme-border)',
            }}
          >
            <Text size="xs" fw={700} c="dimmed" mb="md" style={{ textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Preview & Crop
            </Text>

            <Box style={{
              position: 'relative',
              height: 280,
              background: 'var(--theme-bg-soft)',
              borderRadius: 14,
              overflow: 'hidden',
              border: '1px dashed var(--theme-border)'
            }}>
              {imageSrc ? (
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                  cropShape="round"
                  showGrid={false}
                />
              ) : currentPhotoUrl ? (
                <Box style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <Image
                    src={currentPhotoUrl}
                    w={180}
                    h={180}
                    radius={100}
                    fit="cover"
                    alt="Profile Preview"
                    fallbackSrc="https://placehold.co/180x180?text=No+Preview"
                    style={{ border: '4px solid var(--theme-surface)', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
                  />
                </Box>
              ) : (
                <Stack align="center" justify="center" gap="xs" style={{ height: '100%' }}>
                  <IconCamera size={42} stroke={1.5} color="var(--theme-border)" />
                  <Text size="xs" fw={600} c="dimmed">Tap 'Select Photo' to start</Text>
                </Stack>
              )}
            </Box>

            {imageSrc && (
              <Stack gap={2} mt="md">
                <Text size="xs" fw={700} c="dimmed">Zoom Level</Text>
                <Slider
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  onChange={setZoom}
                  label={null}
                  styles={{
                    track: { background: 'var(--theme-border)' },
                    bar: { background: 'var(--theme-primary)' },
                    thumb: { border: '2px solid var(--theme-primary)' }
                  }}
                />
              </Stack>
            )}
          </Box>

          {error && (
            <Alert icon={<IconAlertCircle size={18} />} color="red" radius="lg" variant="light">
              <Text size="sm" fw={600}>{error}</Text>
            </Alert>
          )}

          {success && (
            <Alert icon={<IconCheck size={18} />} color="green" radius="lg" variant="light">
              <Text size="sm" fw={600}>Profile picture updated successfully!</Text>
            </Alert>
          )}

          <Group justify="space-between" align="center" gap="md" style={{ flexWrap: 'wrap' }}>
            <Group gap="xs" style={{ flex: '1 1 auto', minWidth: 200 }}>
              <FileButton
                onChange={handleFileChange}
                accept={ALLOWED_TYPES.join(',')}
                resetRef={resetRef}
              >
                {(props) => (
                  <Button 
                    {...props} 
                    leftSection={file ? <IconRotate size={18} /> : <IconUpload size={18} />} 
                    variant="light"
                    radius="xl"
                    style={{ fontWeight: 700, flex: 1 }}
                  >
                    {file ? 'Change' : 'Select Photo'}
                  </Button>
                )}
              </FileButton>
              {currentPhotoUrl && !file && (
                <Button
                  variant="subtle"
                  color="red"
                  onClick={handleRemove}
                  disabled={isUploading}
                  leftSection={<IconTrash size={18} />}
                  radius="xl"
                  style={{ fontWeight: 600, flex: 1 }}
                >
                  Remove
                </Button>
              )}
            </Group>

            <Button
              onClick={handleUpload}
              loading={isUploading}
              disabled={!imageSrc || !!error || success}
              color="var(--theme-primary)"
              radius="xl"
              style={{ fontWeight: 700, paddingLeft: 24, paddingRight: 24, flex: '1 1 auto' }}
            >
              Save Changes
            </Button>
          </Group>
        </Stack>
      </Box>
    </Modal>
  );
};

export default ProfilePictureUploadModal;
