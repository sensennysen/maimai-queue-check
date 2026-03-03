import { useState } from 'react';
import {
  Container,
  Paper,
  Title,
  TextInput,
  Textarea,
  Select,
  Button,
  Stack,
  Text,
  Group,
  ActionIcon,
  FileInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useNavigate } from 'react-router-dom';
import IconArrowLeft from '@tabler/icons-react/dist/esm/icons/IconArrowLeft.mjs';
import IconPaperclip from '@tabler/icons-react/dist/esm/icons/IconPaperclip.mjs';
import { contactService } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';

const ContactPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      reportType: '',
      description: '',
      email: '',
      attachment: null,
    },
    validate: {
      reportType: (value) => (value ? null : 'Please select a report type'),
      description: (value) => (value ? null : 'Please provide a description'),
      email: (value) => {
        if (user) return null; // Email not required if logged in (we use user_id)
        return /^\S+@\S+$/.test(value) ? null : 'Invalid email';
      },
      attachment: (value) => {
        if (!value) return null;
        if (value.size > 50 * 1024 * 1024) return 'File size must be less than 50MB';
        return null;
      },
    },
  });

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      await contactService.submitReport({
        report_type: values.reportType,
        description: values.description,
        email: user ? user.email : values.email, // Use user email if logged in, otherwise form value
        user_id: user ? user.id : null,
        file: values.attachment,
      });

      notifications.show({
        title: 'Report Submitted',
        message: 'Thank you for your feedback! We will review it shortly.',
        color: 'green',
      });

      navigate('/'); // Redirect to main page
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to submit report',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size="sm" py={0}>
      <Paper p="xl" withBorder radius="md">
        <Stack gap="lg">
          <Group>
            <ActionIcon variant="subtle" onClick={() => navigate('/')}>
              <IconArrowLeft size={18} />
            </ActionIcon>
            <Title order={2}>Contact Us</Title>
          </Group>

          <Text c="secondary" size="lg" mb="xl">
            Have a bug report or a suggestion? We'd love to hear from you.
          </Text>

          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="md">
              <Select
                label="What would you like to report?"
                placeholder="Select one"
                data={[
                  { value: 'bug', label: 'Bug Report' },
                  { value: 'issue', label: 'General Issue' },
                  { value: 'suggestion', label: 'Suggestion/Feature Request' },
                ]}
                required
                {...form.getInputProps('reportType')}
              />

              {!user && (
                <TextInput
                  label="Your Email"
                  placeholder="your@email.com"
                  required
                  {...form.getInputProps('email')}
                />
              )}

              <Textarea
                label="Description"
                placeholder="Please describe your issue or suggestion in detail..."
                minRows={5}
                required
                {...form.getInputProps('description')}
              />

              <FileInput
                label="Attachment (Optional)"
                placeholder="Upload image or video (max 50MB)"
                leftSection={<IconPaperclip size={16} />}
                accept="image/*,video/*"
                {...form.getInputProps('attachment')}
              />

              <Group justify="flex-end" mt="md">
                <Button variant="light" onClick={() => navigate('/')}>
                  Cancel
                </Button>
                <Button type="submit" loading={loading}>
                  Submit Report
                </Button>
              </Group>
            </Stack>
          </form>
        </Stack>
      </Paper>
    </Container>
  );
};

export default ContactPage;
