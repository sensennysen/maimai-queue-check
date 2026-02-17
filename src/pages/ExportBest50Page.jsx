import { useState, useEffect, useRef, useCallback } from 'react';
import { Container, Title, Text, Group, Stack, SimpleGrid, Box, Button, Divider, LoadingOverlay, Alert, Loader, Overlay } from '@mantine/core';
import { IconCamera, IconAlertCircle, IconCheck } from '@tabler/icons-react';
import { toPng } from 'html-to-image';
import { ScoreCard } from '../components/maimai/ScoreCard';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import { rolesService } from '../services/supabase';

const EXPORT_WIDTH = 1920;

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
    try {
      setIsExporting(true);

      // Small delay to ensure layout/fonts are settled
      await new Promise(resolve => setTimeout(resolve, 100));

      const dataUrl = await toPng(exportRef.current, {
        backgroundColor: isDark ? '#1a1b1e' : '#ffffff',
        pixelRatio: 1,
        quality: 1,
        width: EXPORT_WIDTH,
      });
      const link = document.createElement('a');
      link.download = `maimai-best50-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      link.click();
      setExportDone(true);
      // Auto-close tab after download starts
      setTimeout(() => window.close(), 500);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  }, [isDark]);

  // Auto-download once data is loaded and all images have rendered
  useEffect(() => {
    if (isLoading || !bestScores || hasAutoDownloaded.current || !exportRef.current) return;

    const waitForImages = () => {
      const images = exportRef.current?.querySelectorAll('img') || [];
      const imageArray = Array.from(images);

      if (imageArray.length === 0) {
        // No images to wait for, trigger download
        hasAutoDownloaded.current = true;
        setTimeout(() => handleDownload(), 300);
        return;
      }

      let loaded = 0;
      const total = imageArray.length;

      const checkAllLoaded = () => {
        loaded++;
        if (loaded >= total) {
          hasAutoDownloaded.current = true;
          setTimeout(() => handleDownload(), 300);
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

    // Small delay to ensure DOM is painted
    const timeoutId = setTimeout(waitForImages, 500);
    return () => clearTimeout(timeoutId);
  }, [isLoading, bestScores, handleDownload]);

  const maimaiName = profileData?.maimai_dx_name;
  const hasScores = bestScores && (bestScores.new?.songs?.length > 0 || bestScores.old?.songs?.length > 0);
  const totalRating = hasScores ? (bestScores.new.totalRating + bestScores.old.totalRating) : 0;

  // Show loading while auth is restoring or data is fetching
  if (authLoading || isLoading) {
    return (
      <Container size="xl" py="xl">
        <Stack align="center" justify="center" h={300} gap="md">
          <Loader size="lg" color="teal" />
          <Text size="xl" fw={700}>Rendering the page...</Text>
          <Text size="sm" c="dimmed">This might take a while so please do not close this tab.</Text>
          <Text size="sm" c="dimmed">It will automatically close once the image starts downloading.</Text>
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

      {/* Capturable area */}
      <Box pos="relative">
        {hasScores && !exportDone && (
          <Overlay blur={2} center backgroundOpacity={0.9} color={isDark ? '#1a1b1e' : '#fff'} zIndex={100}>
            <Stack align="center" gap="md">
              <Loader size="lg" color="teal" />
              <Text size="xl" fw={700}>Rendering the page...</Text>
              <Text size="sm" c="dimmed">This might take a while so please do not close this tab.</Text>
              <Text size="sm" c="dimmed">It will automatically close once the image starts downloading.</Text>
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
            p="xl"
            style={{
              width: `${EXPORT_WIDTH}px`,
              minHeight: '1080px',
              borderRadius: '12px',
              border: `1px solid ${isDark ? '#333' : '#ddd'}`,
              boxSizing: 'border-box',
            }}
          >
            <Stack gap="lg" justify="space-between" style={{ minHeight: '1020px' }}>
              {/* Header */}
              <Group justify="space-between" align="flex-end">
                <Box>
                  {maimaiName && (
                    <Text size="xl" fw={800} style={{ fontSize: '1.8rem' }}>{maimaiName}</Text>
                  )}
                  <Text size="sm" c="dimmed">Best 50 Scores</Text>
                </Box>
                <Box style={{ textAlign: 'right' }}>
                  <Text size="xl" fw={800} style={{ fontSize: '1.8rem' }}>
                    Rating: {totalRating}
                  </Text>
                </Box>
              </Group>

              <Divider />

              {/* Best 15 New */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <Title order={3}>Best 15 (New)</Title>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <Text size="sm" c="dimmed" fw={500}>
                      Avg: {bestScores.new.songs.length > 0 ? Math.round(bestScores.new.totalRating / bestScores.new.songs.length) : 0}
                    </Text>
                    <Text size="sm" fw={700} style={{ color: isDark ? '#fff' : '#000' }}>
                      Total: {bestScores.new.totalRating ?? 0}
                    </Text>
                  </div>
                </div>
                <SimpleGrid cols={5} spacing="sm">
                  {bestScores.new.songs.map((score, index) => (
                    <ScoreCard key={`export-new-${index}`} score={score} />
                  ))}
                </SimpleGrid>
              </div>

              <Divider />

              {/* Best 35 Old */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <Title order={3}>Best 35 (Old)</Title>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <Text size="sm" c="dimmed" fw={500}>
                      Avg: {bestScores.old.songs.length > 0 ? Math.round(bestScores.old.totalRating / bestScores.old.songs.length) : 0}
                    </Text>
                    <Text size="sm" fw={700} style={{ color: isDark ? '#fff' : '#000' }}>
                      Total: {bestScores.old.totalRating ?? 0}
                    </Text>
                  </div>
                </div>
                <SimpleGrid cols={5} spacing="sm">
                  {bestScores.old.songs.map((score, index) => (
                    <ScoreCard key={`export-old-${index}`} score={score} />
                  ))}
                </SimpleGrid>
              </div>

              {/* Branding */}
              <Box>
                <Divider />
                <Text size="xs" c="dimmed" ta="center" mt="sm">
                  Generated by maiPaQueueCheck PH
                </Text>
              </Box>
            </Stack>
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default ExportBest50Page;
