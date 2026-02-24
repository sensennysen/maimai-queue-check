
(async function() {
  /* Clean up existing instance */
  if (document.getElementById('maimai-export-overlay')) {
    document.getElementById('maimai-export-overlay').remove();
  }

  /* Create UI Overlay */
  const overlay = document.createElement('div');
  overlay.id = 'maimai-export-overlay';
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:99999;display:flex;justify-content:center;align-items:center;font-family:sans-serif;color:white;';

  const container = document.createElement('div');
  container.style.cssText = 'background:#222;padding:2rem;border-radius:12px;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,0.5);max-width:90%;width:300px;';

  const titleEl = document.createElement('h2');
  titleEl.innerText = 'maimai Score Export';
  titleEl.style.cssText = 'margin:0 0 1rem 0;font-size:1.2rem;';

  const statusEl = document.createElement('p');
  statusEl.id = 'maimai-export-status';
  statusEl.innerText = 'Ready to fetch scores';
  statusEl.style.cssText = 'margin-bottom:0.5rem;color:#aaa;font-size:0.9rem;word-break: break-all;';

  const warnEl = document.createElement('p');
  warnEl.innerText = 'Please do not close or leave this page while the process is ongoing.';
  warnEl.style.cssText = 'margin-bottom:0.75rem;color:#ffcc00;font-size:0.8rem;font-weight:bold;';

  const codeLabel = document.createElement('label');
  codeLabel.innerText = 'Session code (from maiPaQueueCheck):';
  codeLabel.style.cssText = 'display:block;text-align:left;font-size:0.8rem;color:#aaa;margin-bottom:4px;';
  const tokenInput = document.createElement('input');
  tokenInput.type = 'text';
  tokenInput.placeholder = 'e.g. ABC12XYZ34';
  tokenInput.id = 'maimai-export-token';
  tokenInput.style.cssText = 'width:100%;padding:8px;margin-bottom:1rem;border-radius:6px;border:1px solid #444;background:#333;color:#fff;font-size:1rem;box-sizing:border-box;';
  tokenInput.autocomplete = 'off';

  const fetchBtn = document.createElement('button');
  fetchBtn.innerText = 'Fetch & Send to App';
  fetchBtn.style.cssText = 'background:#007bff;color:white;border:none;padding:10px 20px;border-radius:6px;font-size:1rem;cursor:pointer;width:100%;font-weight:bold;transition:background 0.2s;';

  const closeBtn = document.createElement('button');
  closeBtn.innerText = 'Close';
  closeBtn.style.cssText = 'background:transparent;color:#888;border:none;margin-top:1rem;cursor:pointer;text-decoration:underline;font-size:0.8rem;';
  closeBtn.onclick = () => overlay.remove();

  container.appendChild(titleEl);
  container.appendChild(statusEl);
  container.appendChild(warnEl);
  container.appendChild(codeLabel);
  container.appendChild(tokenInput);
  container.appendChild(fetchBtn);
  container.appendChild(document.createElement('br'));
  container.appendChild(closeBtn);
  overlay.appendChild(container);
  document.body.appendChild(overlay);

  var IMPORT_EDGE_URL = 'https://rcpdjpsirnussiufirqe.supabase.co/functions/v1/receive-import';

  /* Helper to update status */
  const updateStatus = (msg, loading = false) => {
    statusEl.innerText = msg;
    if (loading) {
      fetchBtn.disabled = true;
      fetchBtn.style.background = '#666';
      fetchBtn.innerText = 'Fetching...';
    } else {
      fetchBtn.disabled = false;
      fetchBtn.style.background = '#007bff';
      fetchBtn.innerText = 'Fetch Scores';
    }
  };

  /* Main Logic */
  fetchBtn.onclick = async () => {
    try {
      updateStatus('Initializing...', true);
      const parser = new DOMParser();
      const output = { 
        profile: {}, 
        scores: [], 
        best_fifty: { best_new: [], best_old: [] },
        most_played: [] 
      };

      const endpoint = window.location.origin + '/maimai-mobile';

      // 1. Fetch Profile
      updateStatus('Fetching Profile...');
      const profileResp = await fetch(endpoint + '/playerData/', { credentials: 'include' });
      const profileHtml = await profileResp.text();
      if (profileResp.redirected && profileResp.url.includes('login')) throw new Error('Please log in.');
      
      const profileDoc = parser.parseFromString(profileHtml, 'text/html');
      const playerName = profileDoc.querySelector('.name_block')?.innerText.trim();
      const playerRating = profileDoc.querySelector('.rating_block')?.innerText.trim();
      
      if (!playerName || !playerRating) throw new Error('Profile not found.');

      let statsTxt = "";
      profileDoc.querySelectorAll('.m_5.m_b_5.t_r.f_12, .m_5.f_12.break, .m_5.f_12').forEach(el => {
          if (el.innerText.toLowerCase().match(/play count|プレイ回数|current version/)) {
              statsTxt += el.innerText + "\n";
          }
      });

      const verPCMatch = statsTxt.match(/current version[：:]\s*([\d,]+)/i);
      const totalPCMatch = statsTxt.match(/total play count[：:]\s*([\d,]+)/i);

      output.profile = {
        name: playerName,
        rating: parseInt(playerRating, 10),
        trophy: profileDoc.querySelector('.trophy_block')?.innerText.trim() || "",
        current_version_play_count: verPCMatch ? verPCMatch[1] : "0",
        total_play_count: totalPCMatch ? totalPCMatch[1] : "0",
        icon_url: profileDoc.querySelector('.basic_block.p_10.f_0 .w_112.f_l')?.src || ""
      };

      // 2. Fetch All Scores
      const difficultyMap = [
        { id: 0, name: 'Basic' },
        { id: 1, name: 'Advanced' },
        { id: 2, name: 'Expert' },
        { id: 3, name: 'Master' },
        { id: 4, name: 'Re:Master' }
      ];

      for (const diffObj of difficultyMap) {
        updateStatus(`Fetching ${diffObj.name} scores...`, true);
        const scoreResp = await fetch(endpoint + '/record/musicGenre/search/?genre=99&diff=' + diffObj.id, { credentials: 'include' });
        const scoreHtml = await scoreResp.text();
        const scoreDoc = parser.parseFromString(scoreHtml, 'text/html');
        
        scoreDoc.querySelectorAll('.w_450').forEach(row => {
          const title = row.querySelector('.music_name_block')?.innerText.trim();
          const achievement = row.querySelector('.music_score_block')?.innerText.trim();
          const kindImg = row.querySelector('.music_kind_icon')?.src;
          if (title && achievement) {
            output.scores.push({
              title: title,
              score: parseFloat(achievement.replace('%', '')),
              difficulty: diffObj.name,
              difficulty_id: diffObj.id,
              type: kindImg && kindImg.includes('dx.png') ? 'DX' : 'Standard'
            });
          }
        });
        await new Promise(res => setTimeout(res, 100));
      }

      // 3. Fetch Most Played (Iterate through all difficulties)
      for (const diffObj of difficultyMap) {
        updateStatus(`Fetching Most Played: ${diffObj.name}...`, true);
        const bestResp = await fetch(endpoint + `/record/musicMybest/search/?diff=${diffObj.id}`, { credentials: 'include' });
        const bestHtml = await bestResp.text();
        const bestDoc = parser.parseFromString(bestHtml, 'text/html');
        
        bestDoc.querySelectorAll('.w_450').forEach(entry => {
          const title = entry.querySelector('.music_name_block')?.innerText.trim();
          const playCountInfo = entry.querySelector('.music_score_block.w_215.t_r.f_r.f_12')?.innerText || "";
          const kindImg = entry.querySelector('.music_kind_icon')?.src;
          const pcMatch = playCountInfo.match(/PLAY COUNT[：:]\s*([\d,]+)/i);

          if (title && pcMatch) {
            output.most_played.push({
              title,
              difficulty: diffObj.name,
              play_count: parseInt(pcMatch[1].replace(/,/g, ''), 10),
              type: kindImg && kindImg.includes('dx.png') ? 'DX' : 'Standard'
            });
          }
        });
        await new Promise(res => setTimeout(res, 100));
      }

      // 4. Fetch Rating Target (Best 50)
      updateStatus('Fetching Rating Target...', true);
      const targetResp = await fetch(endpoint + '/home/ratingTargetMusic/', { credentials: 'include' });
      const targetHtml = await targetResp.text();
      const targetDoc = parser.parseFromString(targetHtml, 'text/html');
      const idxInputs = targetDoc.querySelectorAll('input[name="idx"]');
      const b50Jobs = [];

      for (let i = 0; i < Math.min(idxInputs.length, 50); i++) {
        const inp = idxInputs[i];
        const card = inp.closest('.w_450');
        const diffIcon = card?.querySelector('img.h_20.f_l')?.src;
        const sTitle = card?.querySelector('.music_name_block')?.innerText.trim();
        if (inp.value && diffIcon) {
          const dStr = diffIcon.split('_').pop().split('.')[0].toLowerCase();
          b50Jobs.push({ idx: inp.value, diff: dStr, title: sTitle, is_new: i < 15 });
        }
      }

      for (let i = 0; i < b50Jobs.length; i++) {
        const job = b50Jobs[i];
        updateStatus(`Fetching Best 50: ${i+1}/${b50Jobs.length}...`, true);
        const detResp = await fetch(endpoint + `/record/musicDetail/?idx=${encodeURIComponent(job.idx)}`, { credentials: 'include' });
        const detHtml = await detResp.text();
        const detDoc = parser.parseFromString(detHtml, 'text/html');
        const levelDiv = detDoc.getElementById(job.diff);
        
        if (levelDiv) {
            const ach = levelDiv.querySelector('.music_score_block')?.innerText.trim();
            const infoTable = levelDiv.querySelector('table.collapse.f_11');
            const infoRows = infoTable?.querySelectorAll('tr');
            const lp = infoRows?.[0]?.cells[1]?.innerText.trim();
            const pc = infoRows?.[1]?.cells[1]?.innerText.trim();
            const kImg = detDoc.querySelector('.music_kind_icon')?.src;
            const fullSync = !!levelDiv.querySelector('img[src*="music_icon_ap.png"], img[src*="music_icon_app.png"]');

            const finalScore = {
                title: job.title,
                score: ach,
                difficulty: job.diff.charAt(0).toUpperCase() + job.diff.slice(1),
                last_played: lp,
                play_count: pc,
                type: kImg && kImg.includes('dx.png') ? 'DX' : 'Standard',
                isAP: fullSync
            };

            if (job.is_new) output.best_fifty.best_new.push(finalScore);
            else output.best_fifty.best_old.push(finalScore);
        }
        await new Promise(res => setTimeout(res, 100));
      }

      // Send to app via Edge Function
      const token = (tokenInput.value || '').trim();
      if (!token) {
        updateStatus('Enter the session code from maiPaQueueCheck first.', false);
        return;
      }
      if (!IMPORT_EDGE_URL || IMPORT_EDGE_URL.indexOf('__') >= 0) {
        updateStatus('App endpoint not configured. Use the latest bookmarklet from the app.', false);
        return;
      }
      updateStatus('Sending to app...', true);
      const res = await fetch(IMPORT_EDGE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token, payload: output })
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        updateStatus('Error: ' + (json.error || res.statusText || 'Send failed'));
        fetchBtn.disabled = false;
        fetchBtn.innerText = 'Retry';
        fetchBtn.style.background = '#dc3545';
        return;
      }
      updateStatus('Scores sent! Return to maiPaQueueCheck to finish.');
      fetchBtn.innerText = 'Sent!';
      fetchBtn.style.background = '#28a745';
      fetchBtn.disabled = true;
      setTimeout(() => overlay.remove(), 4000);

    } catch (err) {
      console.error(err);
      updateStatus('Error: ' + err.message);
      fetchBtn.disabled = false;
      fetchBtn.innerText = 'Retry';
      fetchBtn.style.background = '#dc3545';
    }
  };
})();