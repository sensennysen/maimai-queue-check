import React from 'react';
import { Tabs, Text, Button, Code, List, Group, CopyButton, ActionIcon, Tooltip, Stack, Anchor, Alert } from '@mantine/core';
import IconDeviceDesktop from '@tabler/icons-react/dist/esm/icons/IconDeviceDesktop.mjs';
import IconDeviceMobile from '@tabler/icons-react/dist/esm/icons/IconDeviceMobile.mjs';
import IconCheck from '@tabler/icons-react/dist/esm/icons/IconCheck.mjs';
import IconCopy from '@tabler/icons-react/dist/esm/icons/IconCopy.mjs';
import IconExternalLink from '@tabler/icons-react/dist/esm/icons/IconExternalLink.mjs';
import IconInfoCircle from '@tabler/icons-react/dist/esm/icons/IconInfoCircle.mjs';

export const BookmarkletInstructions = () => {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://maipaqueuecheck.ph';
  const bookmarkletCode = `javascript:!function(){var s=document.createElement("script");s.src="${origin}/bookmarklet.js?v=" + Date.now();document.head.appendChild(s)}();`;


  const bookmarkletRef = React.useRef(null);

  React.useEffect(() => {
    if (bookmarkletRef.current) {
      bookmarkletRef.current.href = bookmarkletCode;
    }
  }, [bookmarkletCode]);

  return (
    <Stack>
      <Alert icon={<IconInfoCircle size={16} />} title="How it works" color="blue">
        This tool needs to run on the <strong>maimai DX NET</strong> website to read your scores.
        It does not send any data to external servers; it only copies your data to your clipboard for you to paste here.
      </Alert>

      <Tabs defaultValue="desktop">
        <Tabs.List>
          <Tabs.Tab value="desktop" leftSection={<IconDeviceDesktop size={14} />}>Desktop</Tabs.Tab>
          <Tabs.Tab value="mobile" leftSection={<IconDeviceMobile size={14} />}>Mobile</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="desktop" pt="md">
          <List type="ordered" spacing="sm">
            <List.Item>
              Drag this button to your bookmarks bar:
              <br />
              <Button
                component="a"
                ref={bookmarkletRef}
                size="xs"
                variant="outline"
                color="pink"
                mt="xs"
                onClick={(e) => e.preventDefault()}
                style={{ cursor: 'move' }}
              >
                maimai Score Export
              </Button>
            </List.Item>
            <List.Item>
              Log in to <Anchor href="https://maimaidx-eng.com/maimai-mobile/" target="_blank">maimai DX NET</Anchor> and navigate to the <strong>Play Data</strong> page.
            </List.Item>
            <List.Item>
              Click the bookmark you just created. <br />
              <strong>An overlay will appear on the page.</strong>
            </List.Item>
            <List.Item>
              Click <strong>"Fetch Scores"</strong> in the overlay to start copying.
            </List.Item>
            <List.Item>
              When the button says "Copied!", come back here and paste the data.
            </List.Item>
          </List>
        </Tabs.Panel>

        <Tabs.Panel value="mobile" pt="md">
          <List type="ordered" spacing="sm">
            <List.Item>
              Copy the bookmarklet code:
              <Group mt="xs">
                <CopyButton value={bookmarkletCode} timeout={2000}>
                  {({ copied, copy }) => (
                    <Button color={copied ? 'teal' : 'blue'} onClick={copy} size="xs" leftSection={copied ? <IconCheck size={16} /> : <IconCopy size={16} />}>
                      {copied ? 'Copied' : 'Copy Code'}
                    </Button>
                  )}
                </CopyButton>
              </Group>
            </List.Item>
            <List.Item>
              Create a new bookmark in your browser (Chrome/Safari) for any page.
            </List.Item>
            <List.Item>
              Edit the new bookmark:
              <List withPadding listStyleType="disc" size="sm" mt={4}>
                <List.Item>Change the Name to <strong>"maimai Export"</strong></List.Item>
                <List.Item>Paste the code you copied into the URL/Address field</List.Item>
              </List>
            </List.Item>
            <List.Item>
              Log in to <Anchor href="https://maimaidx-eng.com/maimai-mobile/" target="_blank">maimai DX NET</Anchor> and navigate to the <strong>Play Data</strong> page.
            </List.Item>
            <List.Item>
              <strong>To run it:</strong> Type <strong>"maimai Export"</strong> in the address bar and tap the <strong>bookmark suggestion</strong> (star icon).
              <Text size="xs" c="red" mt={4}>
                Do not tap the "Search" result, or it won't work!
              </Text>
            </List.Item>
            <List.Item>
              Tap <strong>"Fetch Scores"</strong> in the overlay that appears.
            </List.Item>
            <List.Item>
              Wait for the "Copied!" message, then come back here and paste.
            </List.Item>
          </List>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
};
