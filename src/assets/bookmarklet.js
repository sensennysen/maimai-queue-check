
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

  const title = document.createElement('h2');
  title.innerText = 'maimai Score Export';
  title.style.cssText = 'margin:0 0 1rem 0;font-size:1.2rem;';

  const status = document.createElement('p');
  status.id = 'maimai-export-status';
  status.innerText = 'Ready to fetch scores';
  status.style.cssText = 'margin-bottom:1.5rem;color:#aaa;font-size:0.9rem;';

  const btn = document.createElement('button');
  btn.innerText = 'Fetch Scores';
  btn.style.cssText = 'background:#007bff;color:white;border:none;padding:10px 20px;border-radius:6px;font-size:1rem;cursor:pointer;width:100%;font-weight:bold;transition:background 0.2s;';
  
  const closeBtn = document.createElement('button');
  closeBtn.innerText = 'Close';
  closeBtn.style.cssText = 'background:transparent;color:#888;border:none;margin-top:1rem;cursor:pointer;text-decoration:underline;font-size:0.8rem;';
  closeBtn.onclick = () => overlay.remove();

  container.appendChild(title);
  container.appendChild(status);
  container.appendChild(btn);
  container.appendChild(document.createElement('br'));
  container.appendChild(closeBtn);
  overlay.appendChild(container);
  document.body.appendChild(overlay);

  /* Helper to update status */
  const setStatus = (msg, loading = false) => {
    status.innerText = msg;
    if (loading) {
      btn.disabled = true;
      btn.style.background = '#666';
      btn.innerText = 'Fetching...';
    } else {
      btn.disabled = false;
      btn.style.background = '#007bff';
    }
  };

  /* Main Logic */
  btn.onclick = async () => {
    try {
      setStatus('Initializing...', true);
      var p = new DOMParser();
      var out = { profile: {}, scores: [] };

      // Fetch Profile
      setStatus('Fetching Profile...');
      var r1 = await fetch('https://maimaidx-eng.com/maimai-mobile/playerData/');
      var t1 = await r1.text();
      var d1 = p.parseFromString(t1, 'text/html');
      
      var n = d1.querySelector('.name_block');
      var rt = d1.querySelector('.rating_block');
      var tr = d1.querySelector('.trophy_block');
      var ic = d1.querySelector('.w_112.f_l');
      var pc = "0";
      var blocks = d1.querySelectorAll('.m_5.f_12.break');
      for (var i = 0; i < blocks.length; i++) {
        if (blocks[i].innerText.match(/Play Count|プレイ回数/)) {
          pc = blocks[i].innerText.split(':')[1].trim();
        }
      }
      
      out.profile = {
        name: n ? n.innerText.trim() : "",
        rating: rt ? parseInt(rt.innerText, 10) : 0,
        trophy: tr ? tr.innerText.trim() : "",
        playCount: pc,
        iconUrl: ic ? ic.src : ""
      };

      // Fetch Scores
      var diffs = [
        { i: 0, n: 'Basic' },
        { i: 1, n: 'Advanced' },
        { i: 2, n: 'Expert' },
        { i: 3, n: 'Master' },
        { i: 4, n: 'Re:Master' }
      ];

      for (var j = 0; j < diffs.length; j++) {
        var d = diffs[j];
        setStatus('Fetching ' + d.n + ' scores...', true);
        
        var r2 = await fetch('https://maimaidx-eng.com/maimai-mobile/record/musicGenre/search/?genre=99&diff=' + d.i);
        var t2 = await r2.text();
        var d2 = p.parseFromString(t2, 'text/html');
        
        d2.querySelectorAll('.w_450').forEach(function(r) {
          var te = r.querySelector('.music_name_block');
          var se = r.querySelector('.music_score_block');
          var ki = r.querySelector('.music_kind_icon');
          if (te && se) {
            out.scores.push({
              title: te.innerText.trim(),
              score: parseFloat(se.innerText.replace('%', '')),
              difficulty: d.n,
              difficultyId: d.i,
              type: ki && ki.src.indexOf('dx.png') > -1 ? 'DX' : 'Standard'
            });
          }
        });
        
        // Polite delay
        await new Promise(res => setTimeout(res, 200));
      }

      // Success
      var json = JSON.stringify(out);
      await navigator.clipboard.writeText(json);
      
      setStatus('Success! ' + out.scores.length + ' scores copied.');
      btn.innerText = 'Copied to Clipboard!';
      btn.style.background = '#28a745';
      
      setTimeout(() => {
        overlay.remove();
      }, 3000);

    } catch (e) {
      console.error(e);
      setStatus('Error: ' + e.message);
      btn.disabled = false;
      btn.innerText = 'Retry';
      btn.style.background = '#dc3545';
    }
  };
})();