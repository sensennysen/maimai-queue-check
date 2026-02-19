import React from 'react';
import { Tabs, Text, Button, Code, List, Group, CopyButton, ActionIcon, Tooltip, Stack, Anchor, Alert } from '@mantine/core';
import IconDeviceDesktop from '@tabler/icons-react/dist/esm/icons/IconDeviceDesktop.mjs';
import IconDeviceMobile from '@tabler/icons-react/dist/esm/icons/IconDeviceMobile.mjs';
import IconCheck from '@tabler/icons-react/dist/esm/icons/IconCheck.mjs';
import IconCopy from '@tabler/icons-react/dist/esm/icons/IconCopy.mjs';
import IconExternalLink from '@tabler/icons-react/dist/esm/icons/IconExternalLink.mjs';
import IconInfoCircle from '@tabler/icons-react/dist/esm/icons/IconInfoCircle.mjs';

export const BookmarkletInstructions = () => {
  const bookmarkletCode = `javascript:!async function(){document.getElementById("maimai-export-overlay")&&document.getElementById("maimai-export-overlay").remove();const e=document.createElement("div");e.id="maimai-export-overlay",e.style.cssText="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:99999;display:flex;justify-content:center;align-items:center;font-family:sans-serif;color:white;";const r=document.createElement("div");r.style.cssText="background:#222;padding:2rem;border-radius:12px;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,0.5);max-width:90%;width:300px;";const t=document.createElement("h2");t.innerText="maimai Score Export",t.style.cssText="margin:0 0 1rem 0;font-size:1.2rem;";const n=document.createElement("p");n.id="maimai-export-status",n.innerText="Ready to fetch scores",n.style.cssText="margin-bottom:1.5rem;color:#aaa;font-size:0.9rem;word-break: break-all;";const o=document.createElement("button");o.innerText="Fetch Scores",o.style.cssText="background:#007bff;color:white;border:none;padding:10px 20px;border-radius:6px;font-size:1rem;cursor:pointer;width:100%;font-weight:bold;transition:background 0.2s;";const i=document.createElement("button");i.innerText="Close",i.style.cssText="background:transparent;color:#888;border:none;margin-top:1rem;cursor:pointer;text-decoration:underline;font-size:0.8rem;",i.onclick=()=>e.remove(),r.appendChild(t),r.appendChild(n),r.appendChild(o),r.appendChild(document.createElement("br")),r.appendChild(i),e.appendChild(r),document.body.appendChild(e);const a=(e,r=!1)=>{n.innerText=e,r?(o.disabled=!0,o.style.background="#666",o.innerText="Fetching..."):(o.disabled=!1,o.style.background="#007bff")};o.onclick=async()=>{try{a("Initializing...",!0);var t=new DOMParser,i={profile:{},scores:[]};const v=window.location.origin+"/maimai-mobile";a("Fetching Profile...");var c=await fetch(v+"/playerData/",{credentials:"include"}),l=await c.text();if(c.redirected&&c.url.includes("login"))throw new Error("Redirected to login page. Please log in.");if(l.includes("Enter SEGA ID")||l.includes("submit_btn"))throw new Error("Login page detected. Please log in.");if(l.includes("Maintenance")||l.includes("maintenance"))throw new Error("Maintenance detected.");if(l.includes("Error")&&l.includes("error_block"))throw new Error("Error page detected (e.g. Aime not registered or expired session).");var s=t.parseFromString(l,"text/html"),d=s.querySelector(".name_block"),m=s.querySelector(".rating_block");if(!d||!m){const e=s.querySelector("title"),r=e?e.innerText:"No Title",t=s.body?s.body.innerText.substring(0,100).replace(/\\n/g," "):"No Body";throw new Error('Parse Error. Title: "'+r+'". Body: "'+t+'"')}for(var p=s.querySelector(".trophy_block"),u=s.querySelector(".basic_block.p_10.f_0"),x=u?u.querySelector(".w_112.f_l"):null,g="0",y=s.querySelectorAll(".m_5.f_12.break"),b=0;b<y.length;b++)y[b].innerText.match(/Play Count|プレイ回数/)&&(g=y[b].innerText.split(":")[1].trim());i.profile={name:d?d.innerText.trim():"",rating:m?parseInt(m.innerText,10):0,trophy:p?p.innerText.trim():"",playCount:g,iconUrl:x?x.src:""};for(var h=[{i:0,n:"Basic"},{i:1,n:"Advanced"},{i:2,n:"Expert"},{i:3,n:"Master"},{i:4,n:"Re:Master"}],f=0;f<h.length;f++){var w=h[f];a("Fetching "+w.n+" scores...",!0);var T=await fetch(v+"/record/musicGenre/search/?genre=99&diff="+w.i,{credentials:"include"}),k=await T.text();t.parseFromString(k,"text/html").querySelectorAll(".w_450").forEach(function(e){var r=e.querySelector(".music_name_block"),t=e.querySelector(".music_score_block"),n=e.querySelector(".music_kind_icon");r&&t&&i.scores.push({title:r.innerText.trim(),score:parseFloat(t.innerText.replace("%","")),difficulty:w.n,difficultyId:w.i,type:n&&n.src.indexOf("dx.png")>-1?"DX":"Standard"})}),await new Promise(e=>setTimeout(e,200))}var E=JSON.stringify(i);try{await navigator.clipboard.writeText(E),a("Success! "+i.scores.length+" scores copied."),o.innerText="Copied to Clipboard!",o.style.background="#28a745",setTimeout(()=>{e.parentNode&&e.parentNode.removeChild(e)},3e3)}catch(t){console.error("Clipboard failed",t),n.innerHTML="Clipboard write failed.<br>Please copy below:";const i=document.createElement("textarea");i.value=E,i.style.width="100%",i.style.height="100px",i.style.marginTop="10px",i.onclick=e=>e.stopPropagation(),r.querySelector("textarea")||r.insertBefore(i,o),o.innerText="Close",o.onclick=()=>e.remove()}}catch(e){console.error(e),a("Error: "+e.message),o.disabled=!1,o.innerText="Retry",o.style.background="#dc3545"}}}();`;

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
