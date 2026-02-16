import React from 'react';
import { Tabs, Text, Button, Code, List, Group, CopyButton, ActionIcon, Tooltip, Stack, Anchor, Alert } from '@mantine/core';
import { IconDeviceDesktop, IconDeviceMobile, IconCheck, IconCopy, IconExternalLink, IconInfoCircle } from '@tabler/icons-react';

export const BookmarkletInstructions = () => {
  const bookmarkletCode = `javascript:(function(){if(document.getElementById('maimai-export-overlay')){document.getElementById('maimai-export-overlay').remove()}const e=document.createElement('div');e.id='maimai-export-overlay';e.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:99999;display:flex;justify-content:center;align-items:center;font-family:sans-serif;color:white;';const t=document.createElement('div');t.style.cssText='background:#222;padding:2rem;border-radius:12px;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,0.5);max-width:90%;width:300px;';const n=document.createElement('h2');n.innerText='maimai Score Export';n.style.cssText='margin:0 0 1rem 0;font-size:1.2rem;';const r=document.createElement('p');r.id='maimai-export-status';r.innerText='Ready to fetch scores';r.style.cssText='margin-bottom:1.5rem;color:#aaa;font-size:0.9rem;word-break:break-all;';const a=document.createElement('button');a.innerText='Fetch Scores';a.style.cssText='background:#007bff;color:white;border:none;padding:10px 20px;border-radius:6px;font-size:1rem;cursor:pointer;width:100%;font-weight:bold;transition:background 0.2s;';const l=document.createElement('button');l.innerText='Close';l.style.cssText='background:transparent;color:#888;border:none;margin-top:1rem;cursor:pointer;text-decoration:underline;font-size:0.8rem;';l.onclick=()=>e.remove();t.appendChild(n);t.appendChild(r);t.appendChild(a);t.appendChild(document.createElement('br'));t.appendChild(l);e.appendChild(t);document.body.appendChild(e);const i=(e,t=false)=>{r.innerText=e;if(t){a.disabled=true;a.style.background='#666';a.innerText='Fetching...'}else{a.disabled=false;a.style.background='#007bff'}};a.onclick=async()=>{try{i('Initializing...',true);var n=new DOMParser,r={profile:{},scores:[]};const o=window.location.origin+'/maimai-mobile';i('Fetching Profile...');var c=await fetch(o+'/playerData/');if(c.redirected&&c.url.includes('login')){throw new Error('Not logged in. Please log in first.')}var s=await c.text();if(s.includes('Enter SEGA ID')||s.includes('submit_btn')){throw new Error('Not logged in. Please log in first.')}var d=n.parseFromString(s,'text/html');var u=d.querySelector('.name_block');var m=d.querySelector('.rating_block');if(!u||!m){throw new Error('Could not parse profile. Are you logged in?')}var p=d.querySelector('.trophy_block');var f=d.querySelector('.w_112.f_l');var h='0';var g=d.querySelectorAll('.m_5.f_12.break');for(var y=0;y<g.length;y++){if(g[y].innerText.match(/Play Count|プレイ回数/)){h=g[y].innerText.split(':')[1].trim()}}r.profile={name:u?u.innerText.trim():'',rating:m?parseInt(m.innerText,10):0,trophy:p?p.innerText.trim():'',playCount:h,iconUrl:f?f.src:''};var x=[{i:0,n:'Basic'},{i:1,n:'Advanced'},{i:2,n:'Expert'},{i:3,n:'Master'},{i:4,n:'Re:Master'}];for(var b=0;b<x.length;b++){var v=x[b];i('Fetching '+v.n+' scores...',true);var w=await fetch(o+'/record/musicGenre/search/?genre=99&diff='+v.i);var E=await w.text();var k=n.parseFromString(E,'text/html');k.querySelectorAll('.w_450').forEach(function(e){var t=e.querySelector('.music_name_block');var n=e.querySelector('.music_score_block');var o=e.querySelector('.music_kind_icon');if(t&&n){r.scores.push({title:t.innerText.trim(),score:parseFloat(n.innerText.replace('%','')),difficulty:v.n,difficultyId:v.i,type:o&&o.src.indexOf('dx.png')>-1?'DX':'Standard'})}});await new Promise(e=>setTimeout(e,200))}var C=JSON.stringify(r);try{await navigator.clipboard.writeText(C);i('Success! '+r.scores.length+' scores copied.');a.innerText='Copied to Clipboard!';a.style.background='#28a745';setTimeout(()=>{if(e.parentNode)e.parentNode.removeChild(e)},3000)}catch(e){console.error('Clipboard failed',e);r.innerHTML='Clipboard write failed (mobile restriction?).<br>Please copy manualy:';const n=document.createElement('textarea');n.value=C;n.style.width='100%';n.style.height='100px';n.style.marginTop='10px';t.insertBefore(n,a);a.innerText='Close';a.onclick=()=>e.remove()}}catch(e){console.error(e);i('Error: '+e.message);a.disabled=false;a.innerText='Retry';a.style.background='#dc3545'}}})();`;

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
              Log in to <Anchor href="https://maimaidx-eng.com/maimai-mobile/" target="_blank">maimai DX NET</Anchor>.
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
