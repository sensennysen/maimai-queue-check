
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

  const inputGroup = document.createElement('div');
  inputGroup.style.cssText = 'display:flex;gap:8px;margin-bottom:1rem;';

  const tokenInput = document.createElement('input');
  tokenInput.type = 'text';
  tokenInput.placeholder = 'e.g. ABC12XYZ34';
  tokenInput.id = 'maimai-export-token';
  tokenInput.style.cssText = 'flex:1;padding:8px;border-radius:6px;border:1px solid #444;background:#333;color:#fff;font-size:1rem;box-sizing:border-box;user-select:text;-webkit-user-select:text;';
  tokenInput.autocomplete = 'off';
  tokenInput.setAttribute('inputmode', 'text');

  const pasteBtn = document.createElement('button');
  pasteBtn.innerText = 'Paste';
  pasteBtn.style.cssText = 'background:#444;color:white;border:1px solid #555;padding:8px 12px;border-radius:6px;font-size:0.8rem;cursor:pointer;font-weight:bold;transition:background 0.2s;';
  pasteBtn.onmouseover = () => pasteBtn.style.background = '#555';
  pasteBtn.onmouseout = () => pasteBtn.style.background = '#444';
  pasteBtn.onclick = async () => {
    try {
      const text = await navigator.clipboard.readText();
      tokenInput.value = text.trim();
    } catch (err) {
      console.error('Clipboard error:', err);
      // Fallback: focus and let user try native paste if API fails
      tokenInput.focus();
    }
  };

  inputGroup.appendChild(tokenInput);
  inputGroup.appendChild(pasteBtn);

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
  container.appendChild(inputGroup);
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
      const parseFraction = (txt) => {
        if (!txt) return { left: null, right: null };
        const m = String(txt).trim().match(/^\s*([\d,]+)\s*\/\s*([\d,]+)\s*$/);
        if (!m) return { left: null, right: null };
        return {
          left: parseInt(m[1].replace(/,/g, ''), 10),
          right: parseInt(m[2].replace(/,/g, ''), 10)
        };
      };
      const extractIconValue = (imgSrc, candidates) => {
        if (!imgSrc) return null;
        const src = String(imgSrc);
        for (const c of candidates) {
          if (src.includes(`_${c}`)) return c;
        }
        return null;
      };
      const output = { 
        profile: {}, 
        scores: [], 
        best_fifty: { best_new: [], best_old: [] },
        most_played: [],
        circle: null,
        recent_plays: []
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

      // 1b. Fetch Circle
      updateStatus('Fetching Circle...');
      const circleResp = await fetch(endpoint + '/circle/', { credentials: 'include' });
      const circleHtml = await circleResp.text();
      const circleDoc = parser.parseFromString(circleHtml, 'text/html');
      const circleNamePart = circleDoc.querySelector('.circle_profile_circle_name span')?.innerText.trim();
      if (circleNamePart) {
        output.circle = { circle_name: circleNamePart };
      }

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
          const dxScoreTxt = row.querySelector('div.music_score_block.w_190.t_r.f_l.f_12')?.innerText?.trim();
          const dxScoreFrac = parseFraction(dxScoreTxt);
          const iconImgs = Array.from(row.querySelectorAll('img.h_30.f_r'));
          const comboAchievement = iconImgs
            .map(img => extractIconValue(img.getAttribute('src') || img.src, ['app', 'ap', 'fcp', 'fc']))
            .find(v => v) || null;
          const syncAchievement = iconImgs
            .map(img => extractIconValue(img.getAttribute('src') || img.src, ['fdxp', 'fdx', 'fsp', 'fs']))
            .find(v => v) || null;
          if (title && achievement) {
            output.scores.push({
              title: title,
              score: parseFloat(achievement.replace('%', '')),
              difficulty: diffObj.name,
              difficulty_id: diffObj.id,
              type: kindImg && kindImg.includes('dx.png') ? 'DX' : 'Standard',
              dxScore: dxScoreFrac.left,
              totalDxScore: dxScoreFrac.right,
              comboAchievement,
              syncAchievement
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
            const syncType = extractIconValue(
              levelDiv.querySelector('img.h_45.m_r_10.v_t')?.getAttribute('src') ||
                levelDiv.querySelector('img.h_45.m_r_10.v_t')?.src,
              ['fdxp', 'fdx', 'fsp', 'fs']
            );
            const comboAchievement = extractIconValue(
              levelDiv.querySelector('img.h_45.v_t')?.getAttribute('src') ||
                levelDiv.querySelector('img.h_45.v_t')?.src,
              ['fc', 'fcp', 'ap', 'app']
            );
            const dxScoreTxt = levelDiv.querySelector('div.music_score_block.w_310.m_r_0.d_ib.t_r.f_12')?.innerText?.trim();
            const dxScoreFrac = parseFraction(dxScoreTxt);
            const dxStarSrc =
              levelDiv.querySelector('img.w_80.p_l_10.f_r')?.getAttribute('src') ||
              levelDiv.querySelector('img.w_80.p_l_10.f_r')?.src ||
              '';
            const dxStarMatch = String(dxStarSrc).match(/music_icon_dxstar_detail_(\d)/i);
            const dxStar = dxStarMatch ? Math.max(0, Math.min(5, parseInt(dxStarMatch[1], 10))) : 0;

            const finalScore = {
                title: job.title,
                score: ach,
                difficulty: job.diff.charAt(0).toUpperCase() + job.diff.slice(1),
                last_played: lp,
                play_count: pc,
                type: kImg && kImg.includes('dx.png') ? 'DX' : 'Standard',
                syncType: syncType || null,
                comboAchievement: comboAchievement || null,
                dxScore: dxScoreFrac.left,
                totalDxScore: dxScoreFrac.right,
                dxStar,
                isAP: comboAchievement === 'ap' || comboAchievement === 'app'
            };

            if (job.is_new) output.best_fifty.best_new.push(finalScore);
            else output.best_fifty.best_old.push(finalScore);
        }
        await new Promise(res => setTimeout(res, 100));
      }

      // 5. Fetch Recent Plays
      updateStatus('Fetching Recent Play list...', true);
      const recordResp = await fetch(endpoint + '/record/', { credentials: 'include' });
      const recordHtml = await recordResp.text();
      const recordDoc = parser.parseFromString(recordHtml, 'text/html');
      const recentIdxInputs = recordDoc.querySelectorAll('form.m_t_5.t_r input[name="idx"]');
      const recentPool = Array.from(recentIdxInputs).slice(0, 50).map(inp => inp.value);

      for (let i = 0; i < recentPool.length; i++) {
        const rIdx = recentPool[i];
        updateStatus(`Fetching Recent Play ${i+1}/${recentPool.length}...`, true);
        const playResp = await fetch(endpoint + `/record/playlogDetail/?idx=${encodeURIComponent(rIdx)}`, { credentials: 'include' });
        const playHtml = await playResp.text();
        const playDoc = parser.parseFromString(playHtml, 'text/html');

        const masterContainer = playDoc.querySelector('.playlog_master_container');
        if (!masterContainer) continue;

        const subTitleSpans = playDoc.querySelectorAll('.sub_title span');
        const trackNumber = subTitleSpans[0]?.innerText?.trim() || "";
        const playedAt = subTitleSpans[subTitleSpans.length - 1]?.innerText?.trim() || "";

        const titleBlock = masterContainer.querySelector('.basic_block.m_5.m_t_17.m_r_60');
        const songTitle = titleBlock ? Array.from(titleBlock.childNodes)
          .filter(node => node.nodeType === Node.TEXT_NODE)
          .map(node => node.textContent.trim())
          .join('') : "";

        const achievementBlock = masterContainer.querySelector('.playlog_achievement_txt');
        let achievementStr = "0";
        if (achievementBlock) {
          const baseAch = achievementBlock.childNodes[0]?.textContent?.trim() || "0";
          const decAch = achievementBlock.querySelector('span')?.innerText?.trim() || ".0000%";
          achievementStr = baseAch + decAch;
        }
        
        const dxScoreBlock = masterContainer.querySelector('.playlog_score_block .white');
        const dxScoreFrac = parseFraction(dxScoreBlock?.innerText);

        const badgeImgs = Array.from(masterContainer.querySelectorAll('img.h_35.m_5.f_l'))
          .filter(img => !img.src.includes('_dummy'));
        const comboBadge = badgeImgs.find(img => img.src.includes('fc') || img.src.includes('ap')) ? extractIconValue(badgeImgs.find(img => img.src.includes('fc') || img.src.includes('ap')).src, ['ap', 'app', 'fcp', 'fc']) : null;
        const syncBadge = badgeImgs.find(img => img.src.includes('fs') || img.src.includes('sync')) ? extractIconValue(badgeImgs.find(img => img.src.includes('fs') || img.src.includes('sync')).src, ['fdxp', 'fdx', 'fsp', 'fs', 'sync']) : null;

        const notesTable = playDoc.querySelector('.playlog_notes_detail');
        const detailBlock = notesTable ? notesTable.closest('.p_5') : playDoc.querySelector('.p_5');
        const notes = { tap: {}, hold: {}, slide: {}, touch: {}, break: {} };
        if (notesTable) {
          const rows = notesTable.querySelectorAll('tr');
          // Row 0 is header
          // Row 1: Tap, Row 2: Hold, Row 3: Slide, Row 4: Touch, Row 5: Break
          const rowMap = { 1: 'tap', 2: 'hold', 3: 'slide', 4: 'touch', 5: 'break' };
          
          for (let r = 1; r <= 5; r++) {
            const row = rows[r];
            if (!row) continue;
            
            const cells = row.querySelectorAll('td');
            if (cells.length < 5) continue;
            
            const typeKey = rowMap[r];
            const parseVal = (cell) => {
              const cleaned = (cell.textContent || "").replace(/[^\d]/g, '');
              return cleaned ? parseInt(cleaned, 10) : 0;
            };
            
            const cp = parseVal(cells[0]);
            const p = parseVal(cells[1]);
            const gr = parseVal(cells[2]);
            const gd = parseVal(cells[3]);
            const ms = parseVal(cells[4]);
            
            notes[typeKey] = {
              critical_perfect: cp,
              perfect: p,
              great: gr,
              good: gd,
              miss: ms,
              total: (cp + p + gr + gd + ms)
            };
          }
        }

        const flBlock = playDoc.querySelector('.playlog_fl_block');
        const flDivs = flBlock?.querySelectorAll('.w_96.f_l.t_r') || [];
        const fastCount = flDivs.length > 0 ? (parseInt(flDivs[0].querySelector('.p_t_5')?.innerText.replace(/[^\d]/g, ''), 10) || 0) : 0;
        const lateCount = flDivs.length > 1 ? (parseInt(flDivs[1].querySelector('.p_t_5')?.innerText.replace(/[^\d]/g, ''), 10) || 0) : 0;

        const ratingBlock = detailBlock?.querySelector('.rating_block');
        const ratingDeltaBlock = detailBlock?.querySelector('span.f_l.f_11.v_t');
        
        const scoreBlocks = detailBlock?.querySelectorAll('.playlog_score_block') || [];
        const comboFrac = parseFraction(scoreBlocks[0]?.querySelector('.white')?.innerText);
        const syncFrac = parseFraction(scoreBlocks[1]?.querySelector('.white')?.innerText);

        const diffImg = playDoc.querySelector('.playlog_diff')?.src;
        const rankImg = masterContainer.querySelector('.playlog_scorerank')?.src;
        const kindImg = masterContainer.querySelector('.playlog_music_kind_icon')?.src;
        const jacketUrl = masterContainer.querySelector('.music_img')?.src || "";

        output.recent_plays.push({
          track_number: trackNumber,
          played_at: playedAt,
          title: songTitle,
          jacket_url: jacketUrl,
          difficulty: diffImg ? diffImg.split('/').pop().split('.')[0].replace('diff_', '') : 'unknown',
          chart_type: kindImg && kindImg.includes('dx.png') ? 'DX' : 'Standard',
          level: masterContainer.querySelector('.playlog_level_icon')?.innerText?.trim() || "",
          achievement: parseFloat(achievementStr.replace('%', '')),
          score_rank: rankImg ? rankImg.split('/').pop().split('.')[0].split('?')[0] : 'd',
          dx_score: dxScoreFrac.left,
          dx_score_total: dxScoreFrac.right,
          combo_badge: comboBadge,
          sync_badge: syncBadge,
          rating: ratingBlock ? parseInt(ratingBlock.innerText, 10) : null,
          rating_delta: ratingDeltaBlock ? parseInt(ratingDeltaBlock.innerText.replace(/[()]/g, ''), 10) : null,
          max_combo: comboFrac.left,
          max_combo_total: comboFrac.right,
          max_sync: syncFrac.left,
          max_sync_total: syncFrac.right,
          fast_count: fastCount,
          late_count: lateCount,
          notes: notes,
          scraped_at: new Date().toISOString()
        });

        await new Promise(res => setTimeout(res, 300));
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