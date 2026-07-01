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

  // ── Wrapper (fixed, contains button + panel as siblings) ──
  var wrap = document.createElement('div');
  wrap.id = 'sheet-ext-wrap';
  wrap.style.cssText = [
    'position:fixed',
    'z-index:2147483647',
    'top:' + ((savedPos && savedPos.top) || '20px'),
    'left:' + ((savedPos && savedPos.left) || 'auto'),
    'right:' + ((savedPos && savedPos.right) || '20px'),
    'bottom:' + ((savedPos && savedPos.bottom) || 'auto'),
    'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif',
    'line-height:1.4'
  ].join(';');

  // ── Floating Button ──
  var btn = document.createElement('div');
  btn.id = 'sheet-ext-btn';
  btn.style.cssText = [
    'width:48px',
    'height:48px',
    'background:linear-gradient(135deg,#007AFF,#005EC4)',
    'color:#fff',
    'border-radius:50%',
    'display:flex',
    'align-items:center',
    'justify-content:center',
    'cursor:pointer',
    'box-shadow:0 4px 16px rgba(0,122,255,0.35),0 2px 6px rgba(0,0,0,0.12)',
    'transition:transform 0.15s,box-shadow 0.15s',
    'user-select:none',
    '-webkit-user-select:none'
  ].join(';');
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
  panel.style.cssText = [
    'display:none',
    'position:absolute',
    'bottom:calc(100% + 10px)',
    'right:0',
    'width:360px',
    'max-height:70vh',
    'overflow-y:auto',
    'background:#fff',
    'border:1px solid rgba(0,0,0,0.08)',
    'border-radius:14px',
    'padding:16px',
    'box-shadow:0 12px 40px rgba(0,0,0,0.12),0 4px 12px rgba(0,0,0,0.06)',
    'color:#000',
    'pointer-events:none',
    'opacity:0',
    'transform:translateY(8px)',
    'transition:opacity 0.18s,transform 0.18s'
  ].join(';');

  // ── Panel Header ──
  var header = document.createElement('div');
  header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;';

  var title = document.createElement('div');
  title.textContent = 'Cari Data Sheet';
  title.style.cssText = 'font-size:14px;font-weight:700;color:#1e293b;letter-spacing:-0.01em;';

  var closeBtn = document.createElement('div');
  closeBtn.innerHTML = '&times;';
  closeBtn.style.cssText = [
    'width:24px',
    'height:24px',
    'display:flex',
    'align-items:center',
    'justify-content:center',
    'border-radius:6px',
    'cursor:pointer',
    'font-size:16px',
    'color:#94a3b8',
    'transition:background 0.15s,color 0.15s'
  ].join(';');
  closeBtn.addEventListener('mouseenter', function () {
    closeBtn.style.background = 'rgba(0,0,0,0.06)';
    closeBtn.style.color = '#1e293b';
  });
  closeBtn.addEventListener('mouseleave', function () {
    closeBtn.style.background = 'none';
    closeBtn.style.color = '#94a3b8';
  });
  closeBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    hidePanel();
  });

  header.appendChild(title);
  header.appendChild(closeBtn);

  // ── Categories ──
  var categoriesDiv = document.createElement('div');
  categoriesDiv.id = 'sheet-ext-categories';

  // ── Input ──
  var input = document.createElement('input');
  input.type = 'text';
  input.id = 'sheet-ext-input';
  input.placeholder = 'Masukkan kata pencarian...';
  input.autocomplete = 'off';
  input.style.cssText = [
    'width:100%',
    'padding:8px 12px',
    'margin-bottom:8px',
    'border:1px solid #e2e8f0',
    'border-radius:8px',
    'background:#f8fafc',
    'font-size:13px',
    'font-family:inherit',
    'color:#1e293b',
    'outline:none',
    'box-sizing:border-box',
    'transition:border-color 0.15s'
  ].join(';');
  input.addEventListener('focus', function () { input.style.borderColor = '#007AFF'; });
  input.addEventListener('blur', function () { input.style.borderColor = '#e2e8f0'; });

  // ── Search Button ──
  var searchBtn = document.createElement('button');
  searchBtn.id = 'sheet-ext-search-btn';
  searchBtn.textContent = 'Cari Data';
  searchBtn.style.cssText = [
    'width:100%',
    'padding:8px',
    'background:#007AFF',
    'color:#fff',
    'border:none',
    'border-radius:8px',
    'cursor:pointer',
    'font-size:13px',
    'font-weight:600',
    'font-family:inherit',
    'transition:background 0.15s'
  ].join(';');
  searchBtn.addEventListener('mouseenter', function () { searchBtn.style.background = '#005EC4'; });
  searchBtn.addEventListener('mouseleave', function () { searchBtn.style.background = '#007AFF'; });

  // ── Results ──
  var resultsDiv = document.createElement('div');
  resultsDiv.id = 'sheet-ext-results';
  resultsDiv.style.cssText = 'margin-top:10px;max-height:280px;overflow-y:auto;font-size:12px;color:#475569;';

  // ── Assemble Panel ──
  panel.appendChild(header);
  panel.appendChild(categoriesDiv);
  panel.appendChild(input);
  panel.appendChild(searchBtn);
  panel.appendChild(resultsDiv);

  // ── Assemble Wrapper ──
  wrap.appendChild(panel);
  wrap.appendChild(btn);
  target.appendChild(wrap);

  // ── Panel show/hide ──
  function showPanel() {
    panel.style.display = 'block';
    panel.style.pointerEvents = 'auto';
    // Force reflow then animate
    panel.offsetHeight;
    panel.style.opacity = '1';
    panel.style.transform = 'translateY(0)';
    input.focus();
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
    if (panel.style.display === 'block' && panel.style.opacity === '1') {
      hidePanel();
    } else {
      showPanel();
    }
  }

  // ── Button click (toggle panel) ──
  btn.addEventListener('click', function (e) {
    if (dragMoved) return;
    e.stopPropagation();
    togglePanel();
  });

  // ── Prevent panel clicks from closing ──
  panel.addEventListener('click', function (e) {
    e.stopPropagation();
  });

  // ── Click outside to close ──
  document.addEventListener('click', function (e) {
    if (!wrap.contains(e.target)) {
      hidePanel();
    }
  });

  // ── Keyboard: Escape to close ──
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

    var newTop = wrap.offsetTop - pos2;
    var newLeft = wrap.offsetLeft - pos1;

    // Clamp to viewport
    var ww = window.innerWidth;
    var wh = window.innerHeight;
    newTop = Math.max(0, Math.min(newTop, wh - 48));
    newLeft = Math.max(0, Math.min(newLeft, ww - 48));

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
    // Reset dragMoved after a tick so click handler can read it
    setTimeout(function () { dragMoved = false; }, 100);
  }

  // ── Search ──
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') searchBtn.click();
  });

  searchBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    var inputKata = input.value.toLowerCase().trim();
    resultsDiv.innerHTML = '<i style="color:#94a3b8;">Memuat data...</i>';
    searchBtn.disabled = true;
    searchBtn.textContent = 'Memuat...';
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
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim().replace(/^"|"$/g, ''));
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim().replace(/^"|"$/g, ''));
        return result;
      });
      var dataRows = rows.slice(1);

      var filteredData = dataRows.filter(function (row) {
        var l2 = (row[1] || '').toLowerCase();
        var l3 = (row[2] || '').toLowerCase();
        return inputKata === '' || l2.indexOf(inputKata) !== -1 || l3.indexOf(inputKata) !== -1;
      });

      resultsDiv.innerHTML = '';
      if (filteredData.length === 0) {
        resultsDiv.innerHTML = '<div style="text-align:center;padding:12px 0;color:#94a3b8;">Tidak ada data yang cocok.</div>';
        return;
      }

      filteredData.forEach(function (row) {
        var item = document.createElement('div');
        item.style.cssText = 'border-bottom:1px solid rgba(0,0,0,0.06);padding:6px 0;color:#334155;';
        var l1 = row[0] || '-';
        var l2 = row[1] || '-';
        var l3 = row[2] || '-';
        item.innerHTML = '<strong style="color:#1e293b;">' + l1 + '</strong> <span style="color:#94a3b8;">›</span> ' + l2 + ' <span style="color:#94a3b8;">›</span> ' + l3;
        resultsDiv.appendChild(item);
      });
    }).catch(function (error) {
      resultsDiv.innerHTML = '<div style="color:#ef4444;text-align:center;padding:12px 0;">Error. Pastikan Sheet bersifat Publik.</div>';
      console.error("[SheetExt]", error);
    }).finally(function () {
      searchBtn.disabled = false;
      searchBtn.textContent = 'Cari Data';
      searchBtn.style.opacity = '1';
    });
  });

  // ── Categories ──
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
          }).join('') +
          '</div></div>';
      }).join('');
    } catch (e) {}
  }

  renderCategories();
  try {
    new MutationObserver(function () { renderCategories(); }).observe(document.documentElement, { subtree: true, childList: true });
  } catch (e) {}

  console.log("[SheetExt] UI ready on", location.href);

} catch (err) {
  console.error("[SheetExt] FATAL ERROR:", err.message, err.stack);
}
})();
}
