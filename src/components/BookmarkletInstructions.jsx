import React from 'react';
import { Tabs, Text, Button, Code, List, Group, CopyButton, ActionIcon, Tooltip, Stack, Anchor, Alert } from '@mantine/core';
import IconDeviceDesktop from '@tabler/icons-react/dist/esm/icons/IconDeviceDesktop.mjs';
import IconDeviceMobile from '@tabler/icons-react/dist/esm/icons/IconDeviceMobile.mjs';
import IconCheck from '@tabler/icons-react/dist/esm/icons/IconCheck.mjs';
import IconCopy from '@tabler/icons-react/dist/esm/icons/IconCopy.mjs';
import IconExternalLink from '@tabler/icons-react/dist/esm/icons/IconExternalLink.mjs';
import IconInfoCircle from '@tabler/icons-react/dist/esm/icons/IconInfoCircle.mjs';

export const BookmarkletInstructions = () => {
  const bookmarkletCode = `javascript:!async function(){document.getElementById("maimai-export-overlay")&&document.getElementById("maimai-export-overlay").remove();const overlay=document.createElement("div");overlay.id="maimai-export-overlay",overlay.style.cssText="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:99999;display:flex;justify-content:center;align-items:center;font-family:sans-serif;color:white;";const box=document.createElement("div");box.style.cssText="background:#222;padding:2rem;border-radius:12px;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,0.5);max-width:90%;width:300px;";const titleEl=document.createElement("h2");titleEl.innerText="maimai Score Export",titleEl.style.cssText="margin:0 0 1rem 0;font-size:1.2rem;";const statusEl=document.createElement("p");statusEl.id="maimai-export-status",statusEl.innerText="Ready to fetch scores",statusEl.style.cssText="margin-bottom:1.5rem;color:#aaa;font-size:0.9rem;word-break: break-all;";const actionBtn=document.createElement("button");actionBtn.innerText="Fetch Scores",actionBtn.style.cssText="background:#007bff;color:white;border:none;padding:10px 20px;border-radius:6px;font-size:1rem;cursor:pointer;width:100%;font-weight:bold;transition:background 0.2s;";const closeBtn=document.createElement("button");closeBtn.innerText="Close",closeBtn.style.cssText="background:transparent;color:#888;border:none;margin-top:1rem;cursor:pointer;text-decoration:underline;font-size:0.8rem;",closeBtn.onclick=()=>overlay.remove(),box.appendChild(titleEl),box.appendChild(statusEl),box.appendChild(actionBtn),box.appendChild(document.createElement("br")),box.appendChild(closeBtn),overlay.appendChild(box),document.body.appendChild(overlay);const updateStatus=(msg,loading=!1)=>{statusEl.innerText=msg,loading?(actionBtn.disabled=!0,actionBtn.style.background="#666",actionBtn.innerText="Fetching..."):(actionBtn.disabled=!1,actionBtn.style.background="#007bff",actionBtn.innerText="Fetch Scores")};actionBtn.onclick=async()=>{try{updateStatus("Initializing...",!0);const parser=new DOMParser,res={profile:{},scores:[],best_fifty:{best_new:[],best_old:[]},most_played:[]},base=window.location.origin+"/maimai-mobile";updateStatus("Fetching Profile...");const pReq=await fetch(base+"/playerData/",{credentials:"include"}),pTxt=await pReq.text();if(pReq.redirected&&pReq.url.includes("login"))throw new Error("Please log in to maimai DX NET.");const pDoc=parser.parseFromString(pTxt,"text/html"),pName=pDoc.querySelector(".name_block")?.innerText.trim(),pRating=pDoc.querySelector(".rating_block")?.innerText.trim();if(!pName||!pRating)throw new Error("Profile not found.");const playInfo=pDoc.querySelector(".m_5.m_b_5.t_r.f_12")?.innerText||"";const curBuildMatch=playInfo.match(/current version：([\\d,]+)/);const totalMatch=playInfo.match(/total play count：([\\d,]+)/);res.profile={name:pName,rating:parseInt(pRating,10),trophy:pDoc.querySelector(".trophy_block")?.innerText.trim()||"",current_version_play_count:curBuildMatch?curBuildMatch[1]:"0",total_play_count:totalMatch?totalMatch[1]:"0",icon_url:pDoc.querySelector(".basic_block.p_10.f_0 .w_112.f_l")?.src||""};const diffs=[{i:0,n:"Basic"},{i:1,n:"Advanced"},{i:2,n:"Expert"},{i:3,n:"Master"},{i:4,n:"Re:Master"}];for(const d of diffs){updateStatus("Fetching "+d.n+" scores...",!0);const sReq=await fetch(base+"/record/musicGenre/search/?genre=99&diff="+d.i,{credentials:"include"}),sTxt=await sReq.text(),sDoc=parser.parseFromString(sTxt,"text/html");sDoc.querySelectorAll(".w_450").forEach(t=>{const name=t.querySelector(".music_name_block")?.innerText.trim(),score=t.querySelector(".music_score_block")?.innerText.trim(),kind=t.querySelector(".music_kind_icon")?.src;name&&score&&res.scores.push({title:name,score:parseFloat(score.replace("%","")),difficulty:d.n,difficulty_id:d.i,type:kind&&kind.includes("dx.png")?"DX":"Standard"})});await new Promise(r=>setTimeout(r,100))}updateStatus("Fetching Most Played...",!0);const mReq=await fetch(base+"/record/musicMybest/search/?genre=99&diff=99",{credentials:"include"}),mTxt=await mReq.text(),mDoc=parser.parseFromString(mTxt,"text/html");mDoc.querySelectorAll(".w_450").forEach(t=>{const name=t.querySelector(".music_name_block")?.innerText.trim(),img=t.querySelector("img.h_20.f_l")?.src,playCountEl=t.querySelector(".music_score_block.w_215.t_r.f_r.f_12"),kind=t.querySelector(".music_kind_icon")?.src;if(name&&playCountEl){const diffCode=img?.split("_").pop().split(".")[0].toLowerCase()||"unknown",playCount=playCountEl.innerText.replace("PLAY COUNT：","").trim();res.most_played.push({title:name,difficulty:diffCode.charAt(0).toUpperCase()+diffCode.slice(1),play_count:playCount,type:kind&&kind.includes("dx.png")?"DX":"Standard"})}});updateStatus("Fetching Rating Target...",!0);const tReq=await fetch(base+"/home/ratingTargetMusic/",{credentials:"include"}),tTxt=await tReq.text(),tDoc=parser.parseFromString(tTxt,"text/html"),idxInputs=tDoc.querySelectorAll('input[name="idx"]');const targetList=[];for(let i=0;i<Math.min(idxInputs.length,50);i++){const block=idxInputs[i].closest(".w_450"),form=block?.querySelector('form[action*="musicDetail"]'),idx=idxInputs[i].value,img=form?.querySelector("img.h_20.f_l")?.src,title=block?.querySelector(".music_name_block")?.innerText.trim();if(idx&&img){const diff=img.split("_").pop().split(".")[0].toLowerCase();targetList.push({idx:idx,diff:diff,title:title,is_new:i<15})}}for(let i=0;i<targetList.length;i++){const s=targetList[i];updateStatus("Fetching Best 50 "+(i+1)+"/"+targetList.length+"...",!0);const dReq=await fetch(base+"/record/musicDetail/?idx="+encodeURIComponent(s.idx),{credentials:"include"}),dTxt=await dReq.text(),dDoc=parser.parseFromString(dTxt,"text/html"),dBlock=dDoc.getElementById(s.diff);if(dBlock){const score=dBlock.querySelector(".music_score_block")?.innerText.trim(),table=dBlock.querySelector("table.collapse.f_11"),rows=table?.querySelectorAll("tr"),date=rows?.[0]?.querySelectorAll("td")?.[1]?.innerText.trim(),cnt=rows?.[1]?.querySelectorAll("td")?.[1]?.innerText.trim(),kind=dDoc.querySelector(".music_kind_icon")?.src;const songRes={title:s.title,score:score,difficulty:s.diff.charAt(0).toUpperCase()+s.diff.slice(1),last_played:date,play_count:cnt,type:kind&&kind.includes("dx.png")?"DX":"Standard"};s.is_new?res.best_fifty.best_new.push(songRes):res.best_fifty.best_old.push(songRes)}await new Promise(r=>setTimeout(r,100))}const out=JSON.stringify(res);await navigator.clipboard.writeText(out),updateStatus("Success! Data copied."),actionBtn.innerText="Copied!",actionBtn.style.background="#28a745",setTimeout(()=>overlay.remove(),3e3)}catch(err){console.error(err),updateStatus("Error: "+err.message),actionBtn.disabled=!1,actionBtn.innerText="Retry",actionBtn.style.background="#dc3545"}}}();`;



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
