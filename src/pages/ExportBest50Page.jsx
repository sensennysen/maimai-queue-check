import { useState, useEffect, useRef, useCallback } from 'react';
import { Container, Title, Text, Group, Stack, SimpleGrid, Box, Button, Divider, LoadingOverlay, Alert, Loader, Overlay, Avatar } from '@mantine/core';
import IconCamera from '@tabler/icons-react/dist/esm/icons/IconCamera.mjs';
import IconAlertCircle from '@tabler/icons-react/dist/esm/icons/IconAlertCircle.mjs';
import IconCheck from '@tabler/icons-react/dist/esm/icons/IconCheck.mjs';
import { toPng } from 'html-to-image';
import { notifications } from '@mantine/notifications';
import { ScoreCard } from '../components/maimai/ScoreCard';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import { rolesService } from '../services/supabase';

const EXPORT_WIDTH = 2560;
const EXPORT_HEIGHT = 2100;

const ExportBest50Page = () => {
  const { user, loading: authLoading } = useAuth();
  const { isDark } = useTheme();
  const exportRef = useRef(null);
  const hasFetched = useRef(false);
  const hasAutoDownloaded = useRef(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [exportDone, setExportDone] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [bestScores, setBestScores] = useState(null);

  // Fetch data once when user is available
  useEffect(() => {
    if (!user?.id || hasFetched.current) return;
    hasFetched.current = true;

    const loadData = async () => {
      try {
        setIsLoading(true);
        const data = await rolesService.getUserRoles(user.id);
        setProfileData(data);
        if (data?.maimai_best_scores) {
          setBestScores(data.maimai_best_scores);
        }
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [user?.id]);

  const handleDownload = useCallback(async () => {
    if (!exportRef.current) return;
    const objectUrls = [];

    try {
      setIsExporting(true);

      // --- CORS Bypass: Image Localizer ---
      // Find all images in the exportable area
      const images = exportRef.current.querySelectorAll('img');
      const imageArray = Array.from(images);

      // Localize images by fetching through a proxy and creating ObjectURLs
      await Promise.all(imageArray.map(async (img) => {
        const originalSrc = img.src;
        if (!originalSrc ||
          originalSrc.startsWith('data:') ||
          originalSrc.startsWith('blob:') ||
          originalSrc.includes(window.location.host)) return;

        try {
          // Use corsproxy.io to bypass CORS
          const proxyUrl = `https://corsproxy.io/?url=${encodeURIComponent(originalSrc)}`;
          const response = await fetch(proxyUrl);
          if (!response.ok) throw new Error('Proxy fetch failed');
          const blob = await response.blob();
          const localUrl = URL.createObjectURL(blob);

          // Store original and new URLs for cleanup
          objectUrls.push({ img, originalSrc, localUrl });

          // Swap src to local URL
          img.src = localUrl;
          // Ensure the image is loaded after the swap
          await new Promise((resolve) => {
            if (img.complete) resolve();
            else {
              img.onload = resolve;
              img.onerror = resolve;
            }
          });
        } catch (e) {
          console.warn(`Failed to localize image: ${originalSrc}`, e);
        }
      }));

      // Small delay to ensure layout/fonts are settled after image swaps
      await new Promise(resolve => setTimeout(resolve, 300));

      const dataUrl = await toPng(exportRef.current, {
        backgroundColor: isDark ? '#1a1b1e' : '#ffffff',
        pixelRatio: 2,
        quality: 1,
        width: EXPORT_WIDTH,
        height: EXPORT_HEIGHT,
        cacheBust: false,
        // Filter out cross-origin stylesheets that cause SecurityError
        filter: (node) => {
          if (node.tagName === 'LINK' && node.rel === 'stylesheet') {
            try {
              return !node.href.includes('fonts.googleapis.com');
            } catch {
              return false;
            }
          }
          return true;
        },
      });

      const maimaiName = profileData?.maimai_dx_name || 'maimai';
      const date = new Date().toISOString().slice(0, 10);
      const link = document.createElement('a');
      link.download = `${maimaiName}_Best50_${date}.png`;
      link.href = dataUrl;
      link.click();
      setExportDone(true);

      // Auto-close tab after download starts
      setTimeout(() => window.close(), 1000);
    } catch (err) {
      console.error('Export failed:', err);
      notifications.show({
        title: 'Export Failed',
        message: 'Something went wrong while generating the image. Some assets might be blocked by your browser/network.',
        color: 'red',
        icon: <IconAlertCircle size={16} />,
      });
    } finally {
      // --- Cleanup ---
      objectUrls.forEach(({ img, originalSrc, localUrl }) => {
        img.src = originalSrc;
        URL.revokeObjectURL(localUrl);
      });
      setIsExporting(false);
    }
  }, [isDark, profileData?.maimai_dx_name]);

  // Auto-download once data is loaded and all images have rendered
  useEffect(() => {
    if (isLoading || !bestScores || hasAutoDownloaded.current || !exportRef.current) return;

    const waitForImages = () => {
      const images = exportRef.current?.querySelectorAll('img') || [];
      const imageArray = Array.from(images);

      if (imageArray.length === 0) {
        // No images to wait for, trigger download
        hasAutoDownloaded.current = true;
        setTimeout(() => handleDownload(), 500);
        return;
      }

      let loaded = 0;
      const total = imageArray.length;

      const checkAllLoaded = () => {
        loaded++;
        if (loaded >= total) {
          hasAutoDownloaded.current = true;
          setTimeout(() => handleDownload(), 500);
        }
      };

      imageArray.forEach((img) => {
        if (img.complete) {
          checkAllLoaded();
        } else {
          img.addEventListener('load', checkAllLoaded, { once: true });
          img.addEventListener('error', checkAllLoaded, { once: true });
        }
      });
    };

    // Defensive fallback timeout: if images take too long (5s), just trigger the export anyway
    const fallbackTimeoutId = setTimeout(() => {
      if (!hasAutoDownloaded.current) {
        console.warn('waitForImages timed out, triggering export with potentially missing images');
        hasAutoDownloaded.current = true;
        handleDownload();
      }
    }, 5000);

    // Small delay to ensure DOM is painted
    const timeoutId = setTimeout(waitForImages, 500);
    return () => {
      clearTimeout(timeoutId);
      clearTimeout(fallbackTimeoutId);
    };
  }, [isLoading, bestScores, handleDownload]);

  const maimaiName = profileData?.maimai_dx_name;
  const hasScores = bestScores && (bestScores.best_new?.songs?.length > 0 || bestScores.best_old?.songs?.length > 0);
  const totalRating = bestScores?.total_rating || 0;

  // Show loading while auth is restoring or data is fetching
  if (authLoading || isLoading) {
    return (
      <Container size="xl" py="xl">
        <Stack align="center" justify="center" h={300} gap="md">
          <Loader size="lg" color="teal" />
          <Text size="xl" fw={700}>Preparing your Best 50 snapshot...</Text>
          <Text size="sm" c="secondary">The page will automatically download and potentially close itself.</Text>
        </Stack>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container size="xl" py="xl">
        <Alert icon={<IconAlertCircle size={16} />} title="Not Logged In" color="red">
          Please log in to export your Best 50.
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid py="md" px="md">
      {/* Controls - not captured */}
      <Group justify="space-between" mb="lg">
        <Group gap="md">
          <Title order={2}>Best 50 Export Preview</Title>
          {exportDone && (
            <Text size="sm" c="teal" fw={500}>
              <IconCheck size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              Image downloaded!
            </Text>
          )}
        </Group>
        <Group gap="md">
          <Button variant="subtle" color="gray" onClick={() => window.history.back()}>
            Back to Profile
          </Button>
          <Button
            leftSection={<IconCamera size={18} />}
            color="teal"
            onClick={handleDownload}
            loading={isExporting}
            disabled={!hasScores}
            size="lg"
          >
            Download as Image
          </Button>
        </Group>
      </Group>

      {/* Capturable area */}
      <Box pos="relative">
        {hasScores && !exportDone && (
          <Overlay blur={2} center backgroundOpacity={0.9} color={isDark ? '#1a1b1e' : '#fff'} zIndex={100}>
            <Stack align="center" gap="md">
              <Loader size="lg" color="teal" />
              <Text size="xl" fw={700}>Capturing image...</Text>
              <Text size="sm" c="secondary">Please wait while we generate your Best 50.</Text>
            </Stack>
          </Overlay>
        )}
        {!hasScores ? (
          <Alert icon={<IconAlertCircle size={16} />} title="No Data" color="blue">
            No score data found. Import your scores on the Profile page first.
          </Alert>
        ) : (
          <Box
            ref={exportRef}
            style={{
              width: `${EXPORT_WIDTH}px`,
              height: `${EXPORT_HEIGHT}px`,
              backgroundColor: isDark ? '#1a1b1e' : '#ffffff',
              borderRadius: '16px',
              border: `1px solid ${isDark ? '#333' : '#ddd'}`,
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              padding: '60px',
              paddingBottom: '80px',
            }}
          >
            <Stack gap="xl" style={{ flexGrow: 1 }}>
              {/* Header */}
              <Group justify="space-between" align="center">
                <Group align="center" gap="md">
                  <Avatar
                    src={profileData?.display_photo_url || profileData?.dx_display_photo_url}
                    size={120}
                    radius="md"
                    fallbackSrc="https://placehold.co/120x120?text=maimai"
                  />
                  <Box>
                    {maimaiName && (
                      <Text size="xl" fw={900} style={{ fontSize: '2.5rem', lineHeight: 1.1 }}>{maimaiName}</Text>
                    )}
                    <Text size="xl" c="secondary" fw={700} style={{ fontSize: '1.5rem' }}>Best 50 Scores</Text>
                  </Box>
                </Group>
                <Box style={{ textAlign: 'right' }}>
                  <Text size="xl" c="secondary" fw={700} style={{ fontSize: '1.2rem', marginBottom: -5 }}>
                    RATING
                  </Text>
                  <Text size="xl" fw={900} style={{ fontSize: '3rem', lineHeight: 1 }}>
                    {totalRating}
                  </Text>
                  <Text size="md" c="secondary" fw={700} mt={8}>
                    Exported: {new Date().toLocaleDateString('en-GB')}
                  </Text>
                </Box>
              </Group>

              <Divider />

              {/* Best 15 New */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <Title order={3}>Best 15 (New)</Title>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <Text size="lg" c="secondary" fw={600}>
                      Avg: {bestScores.best_new.songs.length > 0 ? Math.round(bestScores.best_new.total_rating / bestScores.best_new.songs.length) : 0}
                    </Text>
                    <Text size="lg" fw={800} style={{ color: isDark ? '#fff' : '#000' }}>
                      Total: {bestScores.best_new.total_rating ?? 0}
                    </Text>
                  </div>
                </div>
                <SimpleGrid cols={5} spacing="md">
                  {bestScores.best_new.songs.map((score, index) => (
                    <ScoreCard key={`export-new-${index}`} score={score} isExport />
                  ))}
                </SimpleGrid>
              </div>

              <Divider />

              {/* Best 35 Old */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <Title order={3}>Best 35 (Old)</Title>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <Text size="lg" c="secondary" fw={600}>
                      Avg: {bestScores.best_old.songs.length > 0 ? Math.round(bestScores.best_old.total_rating / bestScores.best_old.songs.length) : 0}
                    </Text>
                    <Text size="lg" fw={800} style={{ color: isDark ? '#fff' : '#000' }}>
                      Total: {bestScores.best_old.total_rating ?? 0}
                    </Text>
                  </div>
                </div>
                <SimpleGrid cols={5} spacing="md">
                  {bestScores.best_old.songs.map((score, index) => (
                    <ScoreCard key={`export-old-${index}`} score={score} isExport />
                  ))}
                </SimpleGrid>
              </div>

              {/* Branding */}
              <Box>
                <Divider />
                <Text size="sm" c="secondary" ta="center" mt="xl" fw={600}>
                  Generated by maiPaQueueCheck PH - v1.8.1
                </Text>
              </Box>
              <Box h={60} />
            </Stack>
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default ExportBest50Page;
