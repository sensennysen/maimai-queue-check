import React from 'react';
import { Tabs, Text, Button, Code, List, Group, CopyButton, ActionIcon, Tooltip, Stack, Anchor, Alert } from '@mantine/core';
import { IconDeviceDesktop, IconDeviceMobile, IconCheck, IconCopy, IconExternalLink, IconInfoCircle } from '@tabler/icons-react';

export const BookmarkletInstructions = () => {
  const bookmarkletCode = `javascript:(async function(){var p=new DOMParser();var out={profile:{},scores:[]};try{var r1=await fetch('https://maimaidx-eng.com/maimai-mobile/playerData/');var t1=await r1.text();var d1=p.parseFromString(t1,'text/html');var n=d1.querySelector('.name_block');var rt=d1.querySelector('.rating_block');var tr=d1.querySelector('.trophy_block');var ic=d1.querySelector('.w_112.f_l');var pc="0";var blocks=d1.querySelectorAll('.m_5.f_12.break');for(var i=0;i<blocks.length;i++){if(blocks[i].innerText.match(/Play Count|プレイ回数/)){pc=blocks[i].innerText.split(':')[1].trim()}}out.profile={name:n?n.innerText.trim():"",rating:rt?parseInt(rt.innerText,10):0,trophy:tr?tr.innerText.trim():"",playCount:pc,iconUrl:ic?ic.src:""};var diffs=[{i:0,n:%27Basic%27},{i:1,n:%27Advanced%27},{i:2,n:%27Expert%27},{i:3,n:%27Master%27},{i:4,n:%27Re:Master%27}];for(var j=0;j<diffs.length;j++){var d=diffs[j];var r2=await fetch(%27https://maimaidx-eng.com/maimai-mobile/record/musicGenre/search/?genre=99&diff=%27+d.i);var t2=await r2.text();var d2=p.parseFromString(t2,%27text/html%27);d2.querySelectorAll(%27.w_450%27).forEach(function(r){var te=r.querySelector(%27.music_name_block%27);var se=r.querySelector(%27.music_score_block%27);var ki=r.querySelector(%27.music_kind_icon%27);if(te&&se){out.scores.push({title:te.innerText.trim(),score:parseFloat(se.innerText.replace(%27%%27,%27%27)),difficulty:d.n,difficultyId:d.i,type:ki&&ki.src.indexOf(%27dx.png%27)>-1?%27DX%27:%27Standard%27})}});await new Promise(function(res){setTimeout(res,200)})}var json=JSON.stringify(out);await navigator.clipboard.writeText(json);alert(%27Success! Copied profile and %27+out.scores.length+%27 scores to clipboard.%27)}catch(e){alert(%27Error: %27+e)}})();`;

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
              Log in to <Anchor href="https://maimaidx-eng.com/maimai-mobile/" target="_blank">maimai DX NET</Anchor>.
            </List.Item>
            <List.Item>
              Click the bookmark you just created.
            </List.Item>
            <List.Item>
              When the alert says "Success!", come back here and paste the data.
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
              Log in to <Anchor href="https://maimaidx-eng.com/maimai-mobile/" target="_blank">maimai DX NET</Anchor>.
            </List.Item>
            <List.Item>
              <strong>To run it:</strong> Type <strong>"maimai Export"</strong> in the address bar and tap the <strong>bookmark suggestion</strong> (star icon).
              <Text size="xs" c="red" mt={4}>
                Do not tap the "Search" result, or it won't work!
              </Text>
            </List.Item>
            <List.Item>
              Wait for the "Success!" alert, then come back here and paste.
            </List.Item>
          </List>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
};
