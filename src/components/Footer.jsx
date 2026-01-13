import { Paper, Text, Group, Anchor } from '@mantine/core';
import { IconBrandGithub, IconMail } from '@tabler/icons-react';
import './Footer.css';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <Paper className="footer" p="md" mt="xl" withBorder>
      <Group justify="space-between" align="center">
        <Text size="sm" c="dimmed">
          © {currentYear} Made with ❤️ by Senny
        </Text>
        <Anchor 
          href="mailto:dev.bille.lagarde@gmail.com" 
          size="sm"
          c="dimmed"
        >
          <Group gap="xs">
            <IconMail size={16} />
            <span>dev.bille.lagarde@gmail.com</span>
          </Group>
        </Anchor>
      </Group>
    </Paper>
  );
}

export default Footer;
