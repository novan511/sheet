console.log("[SheetExt] content.js loaded on", location.href);

if (window.__sheetExtLoaded) {
  console.log("[SheetExt] Already loaded, skipping");
} else {
window.__sheetExtLoaded = true;

(async () => {
try {
  const target = document.documentElement;
  if (!target) { console.error("[SheetExt] No documentElement!"); return; }
  console.log("[SheetExt] target found:", target.tagName);

  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  let isDragging = false;

  let savedPos = null;
  try { savedPos = JSON.parse(localStorage.getItem('sheet_ext_btn_pos')); } catch(e) {}

  const btn = document.createElement('div');
  btn.id = 'sheet-ext-floating-btn';
  Object.assign(btn.style, {
    position: 'fixed',
    top: (savedPos && savedPos.top) || '20px',
    right: (savedPos && savedPos.right) || '20px',
    bottom: (savedPos && savedPos.bottom) || 'auto',
    left: (savedPos && savedPos.left) || 'auto',
    width: '56px',
    height: '56px',
    background: '#007AFF',
    color: '#fff',
    borderRadius: '50%',
    textAlign: 'center',
    lineHeight: '56px',
    cursor: 'pointer',
    zIndex: '2147483647',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    border: 'none',
    boxShadow: '0 4px 16px rgba(0,122,255,0.4), 0 2px 8px rgba(0,0,0,0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    userSelect: 'none'
  });
  btn.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="10.5" cy="10.5" r="7.5"/><line x1="15.5" y1="15.5" x2="21" y2="21"/></svg>';

  console.log("[SheetExt] btn created");

  const panel = document.createElement('div');
  panel.id = 'sheet-ext-panel';
  Object.assign(panel.style, {
    position: 'absolute',
    top: 'calc(100% + 12px)',
    right: '0',
    width: '360px',
    background: '#fff',
    border: '1px solid rgba(0,0,0,0.12)',
    borderRadius: '18px',
    padding: '20px',
    zIndex: '2147483647',
    boxShadow: '0 12px 40px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.08)',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    color: '#000',
    display: 'none',
    pointerEvents: 'none'
  });

  const categoriesDiv = document.createElement('div');
  categoriesDiv.id = 'sheet-ext-categories';

  const title = document.createElement('h4');
  title.textContent = 'Cari Data Sheet';
  Object.assign(title.style, { margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: 'rgba(0,0,0,0.78)' });

  const input = document.createElement('input');
  input.type = 'text';
  input.id = 'sheet-ext-input';
  input.placeholder = 'Masukkan kata pencarian...';
  input.autocomplete = 'off';
  Object.assign(input.style, {
    width: 'calc(100% - 20px)', padding: '10px', marginBottom: '10px',
    border: '1px solid rgba(0,0,0,0.1)', borderRadius: '10px',
    background: 'rgba(118,118,128,0.12)', fontSize: '15px',
    fontFamily: 'inherit', color: '#000', outline: 'none', boxSizing: 'border-box'
  });

  const searchBtn = document.createElement('button');
  searchBtn.id = 'sheet-ext-search-btn';
  searchBtn.textContent = 'Cari Data';
  Object.assign(searchBtn.style, {
    width: '100%', padding: '10px', backgroundColor: '#007AFF',
    color: 'white', border: 'none', borderRadius: '10px',
    cursor: 'pointer', fontSize: '15px', fontWeight: '500', fontFamily: 'inherit'
  });

  const resultsDiv = document.createElement('div');
  resultsDiv.id = 'sheet-ext-results';
  Object.assign(resultsDiv.style, {
    marginTop: '10px', maxHeight: '300px', overflowY: 'auto', fontSize: '13px'
  });

  panel.appendChild(categoriesDiv);
  panel.appendChild(title);
  panel.appendChild(input);
  panel.appendChild(searchBtn);
  panel.appendChild(resultsDiv);
  btn.appendChild(panel);
  target.appendChild(btn);

  console.log("[SheetExt] UI appended to DOM");

  function getPageCategories() {
    const categories = [];
    try {
      const selects = document.querySelectorAll('select');
      for (const select of selects) {
        const label = (select.closest('label') ? select.closest('label').textContent : (select.getAttribute('aria-label') || '')).trim();
        if (/category/i.test(label)) {
          const options = Array.from(select.options).map(function(o) { return { value: o.value, text: o.textContent.trim() }; });
          if (options.length) categories.push({ label: label || 'Category', options: options, selected: select.value });
        }
      }
    } catch(e) { console.log("[SheetExt] cat error:", e.message); }
    return categories;
  }

  function renderCategories() {
    if (!categoriesDiv) return;
    try {
      const cats = getPageCategories();
      if (!cats.length) { categoriesDiv.innerHTML = ''; return; }
      categoriesDiv.innerHTML = cats.map(function(c) {
        return '<div style="margin-bottom:10px;">' +
          '<div style="font-size:12px;color:#666;margin-bottom:4px;">' + c.label + '</div>' +
          '<div style="display:flex;gap:6px;flex-wrap:wrap;">' +
          c.options.map(function(o) {
            var bg = o.value === c.selected ? '#007AFF' : 'rgba(118,118,128,0.12)';
            var clr = o.value === c.selected ? '#fff' : 'rgba(0,0,0,0.72)';
            return '<span style="font-size:11px;padding:4px 6px;border-radius:999px;background:' + bg + ';color:' + clr + ';">' + o.text + '</span>';
          }).join('') +
          '</div></div>';
      }).join('');
    } catch(e) { console.log("[SheetExt] renderCat error:", e.message); }
  }

  renderCategories();
  try {
    new MutationObserver(function() { renderCategories(); }).observe(document.documentElement, { subtree: true, childList: true });
  } catch(e) { console.log("[SheetExt] observer error:", e.message); }

  btn.addEventListener('click', function(e) {
    if (isDragging) return;
    if (panel.contains(e.target)) return;
    var isVisible = panel.style.display === 'block';
    panel.style.display = isVisible ? 'none' : 'block';
    panel.style.pointerEvents = isVisible ? 'none' : 'auto';
    if (!isVisible) input.focus();
  });

  panel.addEventListener('click', function(e) { e.stopPropagation(); });

  document.addEventListener('click', function(e) {
    if (!btn.contains(e.target)) {
      panel.style.display = 'none';
      panel.style.pointerEvents = 'none';
    }
  });

  btn.addEventListener('mousedown', function(e) {
    if (panel.contains(e.target)) return;
    if (e.button !== 0) return;
    e.preventDefault();
    isDragging = false;
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', onRelease);
  });

  function onDrag(e) {
    isDragging = true;
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    btn.style.top = (btn.offsetTop - pos2) + "px";
    btn.style.right = "auto";
    btn.style.bottom = "auto";
    btn.style.left = (btn.offsetLeft - pos1) + "px";
  }

  function onRelease() {
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', onRelease);
    localStorage.setItem('sheet_ext_btn_pos', JSON.stringify({
      top: btn.style.top, right: btn.style.right,
      bottom: btn.style.bottom, left: btn.style.left
    }));
    setTimeout(function() { isDragging = false; }, 50);
  }

  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') searchBtn.click();
  });

  searchBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    var inputKata = input.value.toLowerCase().trim();
    resultsDiv.innerHTML = '<i style="color:#888;">Memuat data...</i>';
    searchBtn.disabled = true;
    searchBtn.textContent = 'Memuat...';

    var sheetId = '1lxYuu_b0NvMaUrlvhkIHEid3WIqoZ9rjMxoA-9gXOJs';
    var csvUrl = 'https://docs.google.com/spreadsheets/d/' + sheetId + '/gviz/tq?tqx=out:csv&sheet=Category';

    fetch(csvUrl).then(function(response) {
      return response.text();
    }).then(function(csvText) {
      var rows = csvText.trim().split('\n').map(function(line) {
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

      var filteredData = dataRows.filter(function(row) {
        var l2 = (row[1] || '').toLowerCase();
        var l3 = (row[2] || '').toLowerCase();
        return inputKata === '' || l2.indexOf(inputKata) !== -1 || l3.indexOf(inputKata) !== -1;
      });

      resultsDiv.innerHTML = '';
      if (filteredData.length === 0) {
        resultsDiv.innerHTML = '<b>Tidak ada data yang cocok.</b>';
        return;
      }

      filteredData.forEach(function(row) {
        var item = document.createElement('div');
        item.style.cssText = 'border-bottom:1px solid rgba(118,118,128,0.14); padding:6px 0; color:rgba(0,0,0,0.72);';
        var l1 = row[0] || '-';
        var l2 = row[1] || '-';
        var l3 = row[2] || '-';
        item.innerHTML = '<b>' + l1 + '</b> &gt; ' + l2 + ' &gt; ' + l3;
        resultsDiv.appendChild(item);
      });
    }).catch(function(error) {
      resultsDiv.innerHTML = '<span style="color:red;">Error. Pastikan Sheet bersifat Publik.</span>';
      console.error("[SheetExt]", error);
    }).finally(function() {
      searchBtn.disabled = false;
      searchBtn.textContent = 'Cari Data';
    });
  });

  console.log("[SheetExt] UI created successfully on", location.href);

} catch(err) {
  console.error("[SheetExt] FATAL ERROR:", err.message, err.stack);
}
})();
}
