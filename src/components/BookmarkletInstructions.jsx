import React from 'react';
import { Tabs, Text, Button, Code, List, Group, CopyButton, ActionIcon, Tooltip, Stack, Anchor, Alert } from '@mantine/core';
import IconDeviceDesktop from '@tabler/icons-react/dist/esm/icons/IconDeviceDesktop.mjs';
import IconDeviceMobile from '@tabler/icons-react/dist/esm/icons/IconDeviceMobile.mjs';
import IconCheck from '@tabler/icons-react/dist/esm/icons/IconCheck.mjs';
import IconCopy from '@tabler/icons-react/dist/esm/icons/IconCopy.mjs';
import IconExternalLink from '@tabler/icons-react/dist/esm/icons/IconExternalLink.mjs';
import IconInfoCircle from '@tabler/icons-react/dist/esm/icons/IconInfoCircle.mjs';

export const BookmarkletInstructions = () => {
  const bookmarkletCode = `javascript:!async function(){const e=document.getElementById("maimai-export-overlay");e&&e.remove();const t=document.createElement("div");t.id="maimai-export-overlay",t.style.cssText="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:99999;display:flex;justify-content:center;align-items:center;font-family:sans-serif;color:white;";const r=document.createElement("div");r.style.cssText="background:#222;padding:2rem;border-radius:12px;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,0.5);max-width:90%;width:300px;";const n=document.createElement("h2");n.innerText="maimai Score Export",n.style.cssText="margin:0 0 1rem 0;font-size:1.2rem;";const i=document.createElement("p");i.id="maimai-export-status",i.innerText="Ready to fetch scores",i.style.cssText="margin-bottom:0.5rem;color:#aaa;font-size:0.9rem;word-break: break-all;";const o=document.createElement("p");o.innerText="Please do not close or leave this page while the process is ongoing.",o.style.cssText="margin-bottom:1.5rem;color:#ffcc00;font-size:0.8rem;font-weight:bold;";const c=document.createElement("button");c.innerText="Fetch Scores",c.style.cssText="background:#007bff;color:white;border:none;padding:10px 20px;border-radius:6px;font-size:1rem;cursor:pointer;width:100%;font-weight:bold;transition:background 0.2s;";const s=document.createElement("button");s.innerText="Close",s.style.cssText="background:transparent;color:#888;border:none;margin-top:1rem;cursor:pointer;text-decoration:underline;font-size:0.8rem;",s.onclick=()=>t.remove(),r.appendChild(n),r.appendChild(i),r.appendChild(o),r.appendChild(c),r.appendChild(document.createElement("br")),r.appendChild(s),t.appendChild(r),document.body.appendChild(t);const a=(e,t=!1)=>{i.innerText=e,t?(c.disabled=!0,c.style.background="#666",c.innerText="Fetching..."):(c.disabled=!1,c.style.background="#007bff",c.innerText="Fetch Scores")};c.onclick=async()=>{try{a("Initializing...",!0);const e=new DOMParser,r={profile:{},scores:[],best_fifty:{best_new:[],best_old:[]},most_played:[]},n=window.location.origin+"/maimai-mobile";a("Fetching Profile...");const i=await fetch(n+"/playerData/",{credentials:"include"}),o=await i.text();if(i.redirected&&i.url.includes("login"))throw new Error("Please log in to maimai DX NET.");const s=e.parseFromString(o,"text/html"),l=s.querySelector(".name_block")?.innerText.trim(),d=s.querySelector(".rating_block")?.innerText.trim();if(!l||!d)throw new Error("Profile not found.");let m="";s.querySelectorAll(".m_5.m_b_5.t_r.f_12, .m_5.f_12.break, .m_5.f_12").forEach(e=>{(e.innerText.toLowerCase().includes("play count")||e.innerText.toLowerCase().includes("プレイ回数")||e.innerText.toLowerCase().includes("current version"))&&(m+=e.innerText+"\\n")});const u=m.match(/current version[：:]\\s*([\\d,]+)/i),p=m.match(/total play count[：:]\\s*([\\d,]+)/i);r.profile={name:l,rating:parseInt(d,10),trophy:s.querySelector(".trophy_block")?.innerText.trim()||"",current_version_play_count:u?u[1]:"0",total_play_count:p?p[1]:"0",icon_url:s.querySelector(".basic_block.p_10.f_0 .w_112.f_l")?.src||""};const f=[{i:0,n:"Basic"},{i:1,n:"Advanced"},{i:2,n:"Expert"},{i:3,n:"Master"},{i:4,n:"Re:Master"}];for(const t of f){a("Fetching "+t.n+" scores...",!0);const i=await fetch(n+"/record/musicGenre/search/?genre=99&diff="+t.i,{credentials:"include"}),o=await i.text();e.parseFromString(o,"text/html").querySelectorAll(".w_450").forEach(e=>{const n=e.querySelector(".music_name_block")?.innerText.trim(),i=e.querySelector(".music_score_block")?.innerText.trim(),o=e.querySelector(".music_kind_icon")?.src;n&&i&&r.scores.push({title:n,score:parseFloat(i.replace("%","")),difficulty:t.n,difficulty_id:t.i,type:o&&o.includes("dx.png")?"DX":"Standard"})}),await new Promise(e=>setTimeout(e,100))}a("Fetching Most Played...",!0);const y=await fetch(n+"/record/musicMybest/search/?genre=99&diff=99",{credentials:"include"}),_=await y.text();e.parseFromString(_,"text/html").querySelectorAll(".w_450").forEach(e=>{const t=e.querySelector(".music_name_block")?.innerText.trim(),n=e.querySelector("img.h_20.f_l")?.src,i=e.querySelector(".music_score_block.w_215.t_r.f_r.f_12"),o=e.querySelector(".music_kind_icon")?.src;if(t&&i){const e=n?.split("_").pop().split(".")[0].toLowerCase()||"unknown",c=i.innerText.replace("PLAY COUNT：","").trim();r.most_played.push({title:t,difficulty:e.charAt(0).toUpperCase()+e.slice(1),play_count:c,type:o&&o.includes("dx.png")?"DX":"Standard"})}}),a("Fetching Rating Target...",!0);const x=await fetch(n+"/home/ratingTargetMusic/",{credentials:"include"}),h=await x.text(),g=e.parseFromString(h,"text/html").querySelectorAll('input[name="idx"]'),b=[];for(let e=0;e<Math.min(g.length,50);e++){const t=g[e].closest(".w_450"),r=t?.querySelector('form[action*="musicDetail"]'),n=g[e].value,i=r?.querySelector("img.h_20.f_l")?.src,o=t?.querySelector(".music_name_block")?.innerText.trim();if(n&&i){const t=i.split("_").pop().split(".")[0].toLowerCase();b.push({idx:n,diff:t,title:o,is_new:e<15})}}for(let t=0;t<b.length;t++){const i=b[t];a("Fetching Best 50 "+(t+1)+"/"+b.length+"...",!0);const o=await fetch(n+"/record/musicDetail/?idx="+encodeURIComponent(i.idx),{credentials:"include"}),c=await o.text(),s=e.parseFromString(c,"text/html"),l=s.getElementById(i.diff);if(l){const e=l.querySelector(".music_score_block")?.innerText.trim(),t=l.querySelector("table.collapse.f_11"),n=t?.querySelectorAll("tr"),o=n?.[0]?.querySelectorAll("td")?.[1]?.innerText.trim(),c=n?.[1]?.querySelectorAll("td")?.[1]?.innerText.trim(),a=s.querySelector(".music_kind_icon")?.src,d=!!l.querySelector('img[src*="music_icon_ap.png"], img[src*="music_icon_app.png"]'),m={title:i.title,score:e,difficulty:i.diff.charAt(0).toUpperCase()+i.diff.slice(1),last_played:o,play_count:c,type:a&&a.includes("dx.png")?"DX":"Standard",isAP:d};i.is_new?r.best_fifty.best_new.push(m):r.best_fifty.best_old.push(m)}await new Promise(e=>setTimeout(e,100))}const w=JSON.stringify(r);await navigator.clipboard.writeText(w),a("Success! Data copied."),c.innerText="Copied!",c.style.background="#28a745",setTimeout(()=>t.remove(),3e3)}catch(e){console.error(e),a("Error: "+e.message),c.disabled=!1,c.innerText="Retry",c.style.background="#dc3545"}}}();`;



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
