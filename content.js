console.log("[SheetExt] content.js loaded on", location.href);

if (window.__sheetExtLoaded) {
  console.log("[SheetExt] Already loaded, skipping");
} else {
window.__sheetExtLoaded = true;

(function () {
try {
  var target = document.documentElement;
  if (!target) return;

  var isDragging = false;
  var dragMoved = false;
  var startX = 0, startY = 0;
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

  var savedPos = null;
  try { savedPos = JSON.parse(localStorage.getItem('sheet_ext_btn_pos')); } catch (e) {}

  function esc(s) {
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function normalizeText(s) {
    return (s || '').toLowerCase().trim().replace(/ /g, '').replace(/-/g, '').replace(/'/g, '').replace(/&/g, '');
  }

  // ── Wrapper ──
  var wrap = document.createElement('div');
  wrap.id = 'sheet-ext-wrap';
  wrap.style.cssText = 'position:fixed;z-index:2147483647;top:' +
    ((savedPos && savedPos.top) || '20px') + ';left:' +
    ((savedPos && savedPos.left) || 'auto') + ';right:' +
    ((savedPos && savedPos.right) || '20px') + ';bottom:' +
    ((savedPos && savedPos.bottom) || 'auto') +
    ';font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;line-height:1.4;';

  // ── Floating Button ──
  var btn = document.createElement('div');
  btn.id = 'sheet-ext-btn';
  btn.style.cssText = 'width:48px;height:48px;background:linear-gradient(135deg,#007AFF,#005EC4);color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 4px 16px rgba(0,122,255,0.35),0 2px 6px rgba(0,0,0,0.12);transition:transform 0.15s,box-shadow 0.15s;user-select:none;-webkit-user-select:none;';
  btn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="10.5" cy="10.5" r="7.5"/><line x1="15.5" y1="15.5" x2="21" y2="21"/></svg>';

  btn.addEventListener('mouseenter', function () {
    btn.style.transform = 'scale(1.08)';
    btn.style.boxShadow = '0 6px 20px rgba(0,122,255,0.45),0 3px 8px rgba(0,0,0,0.15)';
  });
  btn.addEventListener('mouseleave', function () {
    btn.style.transform = 'scale(1)';
    btn.style.boxShadow = '0 4px 16px rgba(0,122,255,0.35),0 2px 6px rgba(0,0,0,0.12)';
  });

  // ── Panel ──
  var panel = document.createElement('div');
  panel.id = 'sheet-ext-panel';
  panel.style.cssText = 'display:none;position:absolute;bottom:calc(100% + 10px);right:0;width:360px;max-height:70vh;overflow-y:auto;background:#fff;border:1px solid rgba(0,0,0,0.08);border-radius:14px;padding:16px;box-shadow:0 12px 40px rgba(0,0,0,0.12),0 4px 12px rgba(0,0,0,0.06);color:#000;pointer-events:none;opacity:0;transform:translateY(8px);transition:opacity 0.18s,transform 0.18s;';

  // ── Panel Header ──
  var header = document.createElement('div');
  header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;';

  var title = document.createElement('div');
  title.textContent = 'Category Finder';
  title.style.cssText = 'font-size:14px;font-weight:700;color:#1e293b;letter-spacing:-0.01em;';

  var closeBtn = document.createElement('div');
  closeBtn.innerHTML = '&times;';
  closeBtn.style.cssText = 'width:24px;height:24px;display:flex;align-items:center;justify-content:center;border-radius:6px;cursor:pointer;font-size:16px;color:#94a3b8;transition:background 0.15s,color 0.15s;';
  closeBtn.addEventListener('mouseenter', function () { closeBtn.style.background = 'rgba(0,0,0,0.06)'; closeBtn.style.color = '#1e293b'; });
  closeBtn.addEventListener('mouseleave', function () { closeBtn.style.background = 'none'; closeBtn.style.color = '#94a3b8'; });
  closeBtn.addEventListener('click', function (e) { e.stopPropagation(); hidePanel(); });

  header.appendChild(title);
  header.appendChild(closeBtn);

  // ── API Debug Info Section ──
  var debugSection = document.createElement('div');
  debugSection.id = 'sheet-ext-debug';
  debugSection.style.cssText = 'margin-bottom:12px;padding:10px 12px;background:linear-gradient(135deg,#f8f9fa,#eef2ff);border:1px solid rgba(0,0,0,0.06);border-radius:10px;font-size:11px;color:#475569;line-height:1.6;';

  var debugTitle = document.createElement('div');
  debugTitle.style.cssText = 'font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;display:flex;align-items:center;justify-content:space-between;';
  debugTitle.innerHTML = '<span>API Debug Info</span>';

  var refreshBtn = document.createElement('span');
  refreshBtn.textContent = '\u21BB Refresh';
  refreshBtn.style.cssText = 'cursor:pointer;color:#007AFF;font-weight:600;font-size:10px;text-transform:none;letter-spacing:0;';
  refreshBtn.addEventListener('mouseenter', function () { refreshBtn.style.textDecoration = 'underline'; });
  refreshBtn.addEventListener('mouseleave', function () { refreshBtn.style.textDecoration = 'none'; });
  refreshBtn.addEventListener('click', function (e) { e.stopPropagation(); scrapeAndRenderDebug(); });
  debugTitle.appendChild(refreshBtn);

  var debugContent = document.createElement('div');
  debugContent.id = 'sheet-ext-debug-content';
  debugContent.textContent = 'Loading info...';
  debugSection.appendChild(debugTitle);
  debugSection.appendChild(debugContent);

  // ── Extract Keyword from header-query ──
  function extractQueryKeyword() {
    try {
      var headerQuery = document.querySelector('[class*="header-query"], [id*="header-query"]');
      if (!headerQuery) {
        var allSpans = document.querySelectorAll('span');
        for (var i = 0; i < allSpans.length; i++) {
          var style = allSpans[i].getAttribute('style') || '';
          if (style.indexOf('cursor: pointer') !== -1) {
            var txt = allSpans[i].textContent.trim();
            if (txt && txt.length > 2 && txt.length < 200) {
              var copyIcon = allSpans[i].querySelector('[aria-label="copy"], .anticon-copy');
              if (copyIcon) return txt;
            }
          }
        }
      } else {
        var span = headerQuery.querySelector('span[style*="cursor"]');
        if (span) return span.textContent.trim();
        return headerQuery.textContent.trim();
      }
    } catch (e) {}
    return '';
  }

  // ── Preview Buttons ──
  var previewSection = document.createElement('div');
  previewSection.style.cssText = 'margin-top:8px;';

  var previewKeywordLabel = document.createElement('div');
  previewKeywordLabel.style.cssText = 'font-size:10px;color:#94a3b8;margin-bottom:6px;display:flex;align-items:center;gap:4px;word-break:break-all;';
  previewKeywordLabel.innerHTML = '<span style="color:#64748b;font-weight:600;">Keyword:</span> <span id="sheet-ext-preview-kw" style="color:#1e293b;">-</span>';
  previewSection.appendChild(previewKeywordLabel);

  var previewBtnsRow = document.createElement('div');
  previewBtnsRow.style.cssText = 'display:flex;gap:6px;';

  var shopeeBtn = document.createElement('button');
  shopeeBtn.textContent = 'Shopee';
  shopeeBtn.style.cssText = 'flex:1;padding:6px 8px;background:#ee4d2d;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:11px;font-weight:600;font-family:inherit;transition:background 0.15s;';
  shopeeBtn.addEventListener('mouseenter', function () { shopeeBtn.style.background = '#d44320'; });
  shopeeBtn.addEventListener('mouseleave', function () { shopeeBtn.style.background = '#ee4d2d'; });
  shopeeBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    var kw = extractQueryKeyword();
    if (!kw) return;
    updatePreviewKeyword(kw);
    var rect = shopeeBtn.getBoundingClientRect();
    openSearchPopup('Shopee', 'https://shopee.co.id/search?keyword=' + encodeURIComponent(kw), rect);
  });

  var googleBtn = document.createElement('button');
  googleBtn.textContent = 'Google';
  googleBtn.style.cssText = 'flex:1;padding:6px 8px;background:#4285f4;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:11px;font-weight:600;font-family:inherit;transition:background 0.15s;';
  googleBtn.addEventListener('mouseenter', function () { googleBtn.style.background = '#3367d6'; });
  googleBtn.addEventListener('mouseleave', function () { googleBtn.style.background = '#4285f4'; });
  googleBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    var kw = extractQueryKeyword();
    if (!kw) return;
    updatePreviewKeyword(kw);
    var rect = googleBtn.getBoundingClientRect();
    openSearchPopup('Google', 'https://www.google.com/search?hl=id-ID&gl=id&q=' + encodeURIComponent(kw), rect);
  });

  var demandBtn = document.createElement('button');
  demandBtn.textContent = 'Demand';
  demandBtn.style.cssText = 'flex:1;padding:6px 8px;background:#10b981;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:11px;font-weight:600;font-family:inherit;transition:background 0.15s;';
  demandBtn.addEventListener('mouseenter', function () { demandBtn.style.background = '#059669'; });
  demandBtn.addEventListener('mouseleave', function () { demandBtn.style.background = '#10b981'; });
  demandBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    var kw = extractQueryKeyword();
    if (!kw) return;
    updatePreviewKeyword(kw);
    var rect = demandBtn.getBoundingClientRect();
    openSearchPopup('Demand', 'https://www.google.com/search?hl=id-ID&gl=id&q=' + encodeURIComponent(kw + ' adalah'), rect, 1000);
  });

  previewBtnsRow.appendChild(shopeeBtn);
  previewBtnsRow.appendChild(googleBtn);
  previewBtnsRow.appendChild(demandBtn);
  previewSection.appendChild(previewBtnsRow);

  debugSection.appendChild(previewSection);

  // ── Preview state ──
  var previewPopupWin = null;

  function updatePreviewKeyword(kw) {
    var el = document.getElementById('sheet-ext-preview-kw');
    if (el) el.textContent = kw;
  }

  function openSearchPopup(title, url, btnRect, customWidth) {
    if (previewPopupWin && !previewPopupWin.closed) {
      previewPopupWin.location.href = url;
      previewPopupWin.focus();
      return;
    }
    var pw = customWidth || 520, ph = 500;
    var screenW = screen.availWidth || screen.width;
    var screenH = screen.availHeight || screen.height;
    var top = Math.round((screenH - ph) / 2);
    var left = Math.round((screenW - pw) / 2);
    if (btnRect) {
      left = Math.round(btnRect.left + btnRect.width / 2 - pw / 2);
      top = Math.round(btnRect.bottom + 8);
      left = Math.max(0, Math.min(left, screenW - pw));
      top = Math.max(0, Math.min(top, screenH - ph));
    }
    previewPopupWin = window.open(
      url,
      'sheet_preview_' + title.toLowerCase(),
      'width=' + pw + ',height=' + ph + ',top=' + top + ',left=' + left + ',resizable=yes,scrollbars=yes'
    );
    if (!previewPopupWin) {
      alert('Popup blocked. Allow popups for this extension.');
    }
  }

  // ── Dynamic keyword polling (lightweight) ──
  var _lastKw = '';
  function pollKeyword() {
    var kw = extractQueryKeyword();
    if (kw && kw !== _lastKw) {
      _lastKw = kw;
      updatePreviewKeyword(kw);
    }
  }
  pollKeyword();
  setInterval(pollKeyword, 3000);

  // ── Debug scraping ──
  var isEvalPage = /search\.tiktok-(?:row|eu)\.net/.test(location.href) || /searchfriends\.bytelemon\.com/.test(location.href);
  if (!isEvalPage) debugSection.style.display = 'none';

  function scrapeAndRenderDebug() {
    var info = [];
    var url = location.href;

    var missionMatch = url.match(/mission[_/]evaluation\/?(\d+)?/);
    var missionId = missionMatch ? missionMatch[1] : null;
    var urlObj = null;
    try { urlObj = new URL(url); } catch (e) {}
    var tenant = urlObj ? (urlObj.searchParams.get('tenant') || '-') : '-';

    var urlLine = 'Tenant: <strong>' + esc(tenant) + '</strong>';
    if (missionId) urlLine += ' &middot; Mission: <strong>' + esc(missionId) + '</strong>';
    info.push(urlLine);

    var cats = extractDebugCategories();
    if (cats.length) {
      var catHtml = cats.map(function (c, i) {
        return '<div style="padding:2px 0;display:flex;gap:6px;">' +
          '<span style="color:#94a3b8;font-weight:600;min-width:20px;">L' + (i + 1) + '</span>' +
          '<span style="color:#1e293b;font-weight:' + (i === 0 ? '600' : '400') + ';">' + esc(c) + '</span></div>';
      }).join('');
      info.push('<div style="margin-top:4px;">' + catHtml + '</div>');
    } else {
      info.push('<div style="color:#94a3b8;font-style:italic;margin-top:2px;">Category: (not found)</div>');
    }

    info.push('<div style="margin-top:4px;color:#94a3b8;">Scraped: ' + new Date().toLocaleTimeString() + '</div>');
    debugContent.innerHTML = info.join('');
  }

  function extractDebugCategories() {
    try {
      // Find all .object-key elements and look for "query_ecom_category"
      var keyNodes = document.querySelectorAll('.object-key');
      for (var i = 0; i < keyNodes.length; i++) {
        var keyEl = keyNodes[i];
        // Key structure: <span class="object-key"><span>"</span><span>query_ecom_category</span><span>"</span></span>
        var innerSpans = keyEl.querySelectorAll(':scope > span');
        var keyText = '';
        for (var s = 0; s < innerSpans.length; s++) {
          var t = innerSpans[s].textContent.trim();
          if (t !== '"' && t !== '') { keyText = t; break; }
        }
        if (keyText !== 'query_ecom_category') continue;

        // Found key — navigate to parent .object-key-val, then find "category" inside
        var parentKV = keyEl.closest('.object-key-val');
        if (!parentKV) continue;

        // Find nested .object-key-val with key "category"
        var innerKVs = parentKV.querySelectorAll('.object-key-val');
        for (var j = 0; j < innerKVs.length; j++) {
          var innerKey = innerKVs[j].querySelector('.object-key');
          if (!innerKey) continue;
          var innerSpans2 = innerKey.querySelectorAll(':scope > span');
          var innerKeyText = '';
          for (var s2 = 0; s2 < innerSpans2.length; s2++) {
            var t2 = innerSpans2[s2].textContent.trim();
            if (t2 !== '"' && t2 !== '') { innerKeyText = t2; break; }
          }
          if (innerKeyText !== 'category') continue;

          // Found "category" — extract actual category names from text content
          var cats = [];
          var nodeText = innerKVs[j].textContent || '';
          // Match all quoted strings, filter out keys and indices
          var quoted = nodeText.match(/"([^"]{3,100})"/g);
          if (quoted) {
            for (var q = 0; q < quoted.length; q++) {
              var c = quoted[q].replace(/"/g, '');
              // Skip: "category", numeric-only indices like "0","1","2"
              if (c === 'category' || /^\d+$/.test(c)) continue;
              if (cats.indexOf(c) === -1) cats.push(c);
            }
          }
          if (cats.length) {
            console.log('[SheetExt] Categories found:', cats);
            return cats;
          }
          break;
        }

        // If no "category" sub-key found, try extracting from query_ecom_category node directly
        var fullText = parentKV.textContent || '';
        var catMatch = fullText.match(/"category"\s*\[([\s\S]*?)\]/);
        if (catMatch) {
          var items = catMatch[1].match(/"([^"]{2,80})"/g);
          if (items) {
            var result = items.map(function(s) { return s.replace(/"/g, ''); });
            console.log('[SheetExt] Categories from regex:', result);
            return result;
          }
        }
      }
    } catch (e) { console.log('[SheetExt] DOM scrape error:', e.message); }

    // Fallback: MAIN world bridge
    try {
      var attr = document.documentElement.getAttribute('data-sheetext-debug');
      if (attr) {
        var data = JSON.parse(attr);
        var catArr = null;
        if (data && Array.isArray(data.query_ecom_category) && data.query_ecom_category[0]) {
          catArr = data.query_ecom_category[0].category;
        } else if (data && data.debug_req_info && Array.isArray(data.debug_req_info.query_ecom_category) && data.debug_req_info.query_ecom_category[0]) {
          catArr = data.debug_req_info.query_ecom_category[0].category;
        }
        if (catArr && catArr.length) return catArr;
      }
    } catch (e) {}

    return [];
  }

  // ── Search ──
  var categoriesDiv = document.createElement('div');
  categoriesDiv.id = 'sheet-ext-categories';

  var input = document.createElement('input');
  input.type = 'text';
  input.id = 'sheet-ext-input';
  input.placeholder = 'Enter search keyword...';
  input.autocomplete = 'off';
  input.style.cssText = 'width:100%;padding:8px 12px;margin-bottom:8px;border:1px solid #e2e8f0;border-radius:8px;background:#f8fafc;font-size:13px;font-family:inherit;color:#1e293b;outline:none;box-sizing:border-box;transition:border-color 0.15s;';
  input.addEventListener('focus', function () { input.style.borderColor = '#007AFF'; });
  input.addEventListener('blur', function () { input.style.borderColor = '#e2e8f0'; });

  var searchBtn = document.createElement('button');
  searchBtn.id = 'sheet-ext-search-btn';
  searchBtn.textContent = 'Search Data';
  searchBtn.style.cssText = 'width:100%;padding:8px;background:#007AFF;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;font-family:inherit;transition:background 0.15s;';
  searchBtn.addEventListener('mouseenter', function () { searchBtn.style.background = '#005EC4'; });
  searchBtn.addEventListener('mouseleave', function () { searchBtn.style.background = '#007AFF'; });

  var isFetchEcomPage = /fetch_review_ecom/.test(location.href);

  var openAllBtn = document.createElement('button');
  openAllBtn.textContent = 'Open All (6L + 6R)';
  openAllBtn.style.cssText = 'display:none;width:100%;padding:8px;margin-top:6px;background:#7c3aed;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;font-family:inherit;transition:background 0.15s;';
  openAllBtn.addEventListener('mouseenter', function () { openAllBtn.style.background = '#6d28d9'; });
  openAllBtn.addEventListener('mouseleave', function () { openAllBtn.style.background = '#7c3aed'; });
  openAllBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    openAllBtn.disabled = true;
    openAllBtn.textContent = 'Opening links...';
    openAllBtn.style.opacity = '0.7';

    chrome.runtime.sendMessage({ action: 'openAllProductLinks' }, function (resp) {
      openAllBtn.disabled = false;
      openAllBtn.textContent = 'Open All';
      openAllBtn.style.opacity = '1';

      if (chrome.runtime.lastError) {
        alert('Error: ' + chrome.runtime.lastError.message);
        return;
      }
      if (!resp || resp.error) {
        alert('Failed: ' + (resp ? resp.error : 'no response'));
        return;
      }
      if (resp.clicked) {
        console.log('[SheetExt] Open All done - clicked elements directly');
      } else {
        console.log('[SheetExt] Open All done - opened', resp.opened, 'links');
      }
    });
  });

  var openPidBtn = document.createElement('button');
  openPidBtn.textContent = 'Buka Semua PID';
  openPidBtn.style.cssText = 'display:none;width:100%;padding:8px;margin-top:6px;background:#7c3aed;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;font-family:inherit;transition:background 0.15s;';
  openPidBtn.addEventListener('mouseenter', function () { openPidBtn.style.background = '#6d28d9'; });
  openPidBtn.addEventListener('mouseleave', function () { openPidBtn.style.background = '#7c3aed'; });
  openPidBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    openPidBtn.disabled = true;
    openPidBtn.textContent = 'Searching links...';
    openPidBtn.style.opacity = '0.7';

    try {
      chrome.runtime.sendMessage({ action: 'getProductLinks' }, function (resp) {
        if (chrome.runtime.lastError) {
          alert('Error: ' + chrome.runtime.lastError.message);
          openPidBtn.disabled = false;
      openPidBtn.textContent = 'Open All PID';
          openPidBtn.style.opacity = '1';
          return;
        }
        openPidBtn.disabled = false;
        openPidBtn.textContent = 'Buka Semua PID';
        openPidBtn.style.opacity = '1';

        if (!resp || !resp.links || !resp.links.length) {
          alert('No product links found.');
          return;
        }
        resp.links.forEach(function (href) { window.open(href, '_blank'); });
      });
    } catch (err) {
      openPidBtn.disabled = false;
      openPidBtn.textContent = 'Buka Semua PID';
      openPidBtn.style.opacity = '1';
      alert('Failed to get links: ' + err.message);
    }
  });

  var resultsDiv = document.createElement('div');
  resultsDiv.id = 'sheet-ext-results';
  resultsDiv.style.cssText = 'margin-top:10px;max-height:280px;overflow-y:auto;font-size:12px;color:#475569;';

  // ── Assemble Panel ──
  panel.appendChild(header);
  panel.appendChild(debugSection);
  panel.appendChild(categoriesDiv);
  panel.appendChild(input);
  panel.appendChild(searchBtn);
  panel.appendChild(openAllBtn);
  panel.appendChild(openPidBtn);
  panel.appendChild(resultsDiv);

  wrap.appendChild(panel);
  wrap.appendChild(btn);
  target.appendChild(wrap);

  // ── Panel show/hide ──
  var lastDebugScrape = 0;

  function showPanel() {
    panel.style.display = 'block';
    panel.style.pointerEvents = 'auto';
    panel.offsetHeight;
    panel.style.opacity = '1';
    panel.style.transform = 'translateY(0)';
    input.focus();
    var now = Date.now();
    if (now - lastDebugScrape > 2000) {
      lastDebugScrape = now;
      scrapeAndRenderDebug();
    }
  }

  function hidePanel() {
    panel.style.opacity = '0';
    panel.style.transform = 'translateY(8px)';
    panel.style.pointerEvents = 'none';
    setTimeout(function () {
      if (panel.style.opacity === '0') panel.style.display = 'none';
    }, 180);
  }

  function togglePanel() {
    if (panel.style.display === 'block' && panel.style.opacity === '1') hidePanel();
    else showPanel();
  }

  btn.addEventListener('click', function (e) {
    if (dragMoved) return;
    e.stopPropagation();
    togglePanel();
  });

  panel.addEventListener('click', function (e) { e.stopPropagation(); });

  document.addEventListener('click', function (e) {
    if (!wrap.contains(e.target)) hidePanel();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') hidePanel();
  });

  // ── Drag ──
  btn.addEventListener('mousedown', function (e) {
    if (e.button !== 0) return;
    e.preventDefault();
    dragMoved = false;
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', onRelease);
  });

  function onDrag(e) {
    var dx = e.clientX - startX;
    var dy = e.clientY - startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragMoved = true;
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    var newTop = Math.max(0, Math.min(wrap.offsetTop - pos2, window.innerHeight - 48));
    var newLeft = Math.max(0, Math.min(wrap.offsetLeft - pos1, window.innerWidth - 48));
    wrap.style.top = newTop + 'px';
    wrap.style.left = newLeft + 'px';
    wrap.style.right = 'auto';
    wrap.style.bottom = 'auto';
  }

  function onRelease() {
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', onRelease);
    isDragging = false;
    try {
      localStorage.setItem('sheet_ext_btn_pos', JSON.stringify({
        top: wrap.style.top, left: wrap.style.left,
        right: wrap.style.right, bottom: wrap.style.bottom
      }));
    } catch (e) {}
    setTimeout(function () { dragMoved = false; }, 100);
  }

  // ── Search Action ──
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') searchBtn.click();
  });

  searchBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    var normalizedSearch = normalizeText(input.value);
    resultsDiv.innerHTML = '<div style="text-align:center;padding:12px 0;color:#94a3b8;">Loading data...</div>';
    searchBtn.disabled = true;
    searchBtn.textContent = 'Loading...';
    searchBtn.style.opacity = '0.7';

    var sheetId = '1lxYuu_b0NvMaUrlvhkIHEid3WIqoZ9rjMxoA-9gXOJs';
    var csvUrl = 'https://docs.google.com/spreadsheets/d/' + sheetId + '/gviz/tq?tqx=out:csv&sheet=Category';

    fetch(csvUrl).then(function (response) {
      return response.text();
    }).then(function (csvText) {
      var rows = csvText.trim().split('\n').map(function (line) {
        var result = [];
        var current = '';
        var inQuotes = false;
        for (var i = 0; i < line.length; i++) {
          var char = line[i];
          if (char === '"') { inQuotes = !inQuotes; }
          else if (char === ',' && !inQuotes) { result.push(current.trim().replace(/^"|"$/g, '')); current = ''; }
          else { current += char; }
        }
        result.push(current.trim().replace(/^"|"$/g, ''));
        return result;
      });
      var dataRows = rows.slice(1);

      var filteredData = normalizedSearch === '' ? dataRows : dataRows.filter(function (row) {
        return normalizeText(row[0]).indexOf(normalizedSearch) !== -1 ||
               normalizeText(row[1]).indexOf(normalizedSearch) !== -1 ||
               normalizeText(row[2]).indexOf(normalizedSearch) !== -1;
      });

      resultsDiv.innerHTML = '';
      if (filteredData.length === 0) {
        resultsDiv.innerHTML = '<div style="text-align:center;padding:16px 0;color:#94a3b8;">No matching data found.</div>';
        return;
      }

      var countDiv = document.createElement('div');
      countDiv.style.cssText = 'font-size:10px;color:#94a3b8;margin-bottom:6px;padding-bottom:6px;border-bottom:1px solid rgba(0,0,0,0.06);';
      countDiv.textContent = filteredData.length + ' results found';
      resultsDiv.appendChild(countDiv);

      filteredData.forEach(function (row) {
        var item = document.createElement('div');
        item.style.cssText = 'border-bottom:1px solid rgba(0,0,0,0.06);padding:6px 0;color:#334155;font-size:12px;';
        item.innerHTML = '<strong style="color:#1e293b;">' + esc(row[0] || '-') + '</strong> <span style="color:#cbd5e1;">›</span> ' + esc(row[1] || '-') + ' <span style="color:#cbd5e1;">›</span> ' + esc(row[2] || '-');
        resultsDiv.appendChild(item);
      });
    }).catch(function (error) {
      resultsDiv.innerHTML = '<div style="color:#ef4444;text-align:center;padding:16px 0;">Error. Make sure the Sheet is Public.</div>';
      console.error("[SheetExt]", error);
    }).finally(function () {
      searchBtn.disabled = false;
  searchBtn.textContent = 'Search Data';
      searchBtn.style.opacity = '1';
    });
  });

  // ── Page Categories ──
  function getPageCategories() {
    var categories = [];
    try {
      var selects = document.querySelectorAll('select');
      for (var s = 0; s < selects.length; s++) {
        var select = selects[s];
        var label = (select.closest('label') ? select.closest('label').textContent : (select.getAttribute('aria-label') || '')).trim();
        if (/category/i.test(label)) {
          var options = [];
          for (var o = 0; o < select.options.length; o++) {
            options.push({ value: select.options[o].value, text: select.options[o].textContent.trim() });
          }
          if (options.length) categories.push({ label: label || 'Category', options: options, selected: select.value });
        }
      }
    } catch (e) {}
    return categories;
  }

  function renderCategories() {
    if (!categoriesDiv) return;
    try {
      var cats = getPageCategories();
      if (!cats.length) { categoriesDiv.innerHTML = ''; return; }
      categoriesDiv.innerHTML = cats.map(function (c) {
        return '<div style="margin-bottom:8px;">' +
          '<div style="font-size:10px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:4px;">' + c.label + '</div>' +
          '<div style="display:flex;gap:4px;flex-wrap:wrap;">' +
          c.options.map(function (o) {
            var active = o.value === c.selected;
            return '<span style="font-size:11px;padding:3px 8px;border-radius:999px;background:' + (active ? '#007AFF' : '#f1f5f9') + ';color:' + (active ? '#fff' : '#475569') + ';font-weight:' + (active ? '600' : '400') + ';">' + o.text + '</span>';
          }).join('') + '</div></div>';
      }).join('');
    } catch (e) {}
  }

  renderCategories();
  try {
    new MutationObserver(function () { renderCategories(); }).observe(document.documentElement, { subtree: true, childList: true });
  } catch (e) {}

  if (isFetchEcomPage || /\/fetch_review\//.test(location.href)) {
    openAllBtn.style.display = 'block';
    openPidBtn.style.display = 'none';
  }

  console.log("[SheetExt] UI ready on", location.href);

} catch (err) {
  console.error("[SheetExt] FATAL ERROR:", err.message, err.stack);
}
})();
}
