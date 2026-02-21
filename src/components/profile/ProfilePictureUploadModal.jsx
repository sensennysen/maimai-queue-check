import { useState, useRef, useCallback } from 'react';
import { Modal, Stack, Group, Button, Text, Image, FileButton, Alert, Loader, Box, Slider } from '@mantine/core';
import { IconUpload, IconTrash, IconAlertCircle, IconCheck, IconCamera, IconRotate } from '@tabler/icons-react';
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
      title="Update Profile Picture"
      size="md"
      radius="md"
    >
      <Stack gap="md" py="xs">
        <Text size="sm" c="dimmed">
          Custom profile pictures will be shown instead of your maimai DX icon.
          Max 20MB. Drag and zoom to reposition.
        </Text>

        <Box style={{
          position: 'relative',
          height: 300,
          background: 'var(--mantine-color-gray-0)',
          borderRadius: 'var(--mantine-radius-md)',
          overflow: 'hidden',
          border: '1px dashed var(--mantine-color-gray-3)'
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
                w={200}
                h={200}
                radius={200}
                fit="cover"
                alt="Profile Preview"
                fallbackSrc="https://placehold.co/200x200?text=No+Preview"
              />
            </Box>
          ) : (
            <Stack align="center" justify="center" gap="xs" style={{ height: '100%' }}>
              <IconCamera size={48} stroke={1.5} color="var(--mantine-color-gray-4)" />
              <Text size="sm" c="dimmed">No photo selected</Text>
            </Stack>
          )}

          {isUploading && (
            <Box style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(255,255,255,0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10
            }}>
              <Loader size="lg" />
            </Box>
          )}
        </Box>

        {imageSrc && (
          <Stack gap={4}>
            <Text size="xs" fw={500} c="dimmed">Zoom</Text>
            <Slider
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              onChange={setZoom}
              label={null}
            />
          </Stack>
        )}

        {error && (
          <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
            {error}
          </Alert>
        )}

        {success && (
          <Alert icon={<IconCheck size={16} />} color="green" variant="light">
            Profile picture updated successfully!
          </Alert>
        )}

        <Group justify="space-between">
          <Group gap="xs">
            <FileButton
              onChange={handleFileChange}
              accept={ALLOWED_TYPES.join(',')}
              resetRef={resetRef}
            >
              {(props) => (
                <Button {...props} leftSection={file ? <IconRotate size={18} /> : <IconUpload size={18} />} variant="light">
                  {file ? 'Change Photo' : 'Select Photo'}
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
              >
                Remove
              </Button>
            )}
          </Group>

          <Group gap="xs">
            <Button variant="default" onClick={handleClose}>Cancel</Button>
            <Button
              onClick={handleUpload}
              loading={isUploading}
              disabled={!imageSrc || !!error || success}
              color="blue"
            >
              Upload
            </Button>
          </Group>
        </Group>
      </Stack>
    </Modal>
  );
};

export default ProfilePictureUploadModal;
