chrome.runtime.onInstalled.addListener(() => {
  console.log("[SheetExt] Extension installed");
  chrome.contextMenus.create({
    id: "openMission",
    title: "Open Mission Link",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "openMission") {
    var url = tab.url;
    var selection = info.selectionText.trim();
    var match = url.match(/mission\/(\d+)/);

    if (match) {
      var missionId = match[1];
      var targetUrl = 'https://search.tiktok-row.net/garr/fetch_review_ecom/mission_evaluation/mission/' + missionId + '/round/0/task_reviewer/' + selection;
      chrome.tabs.create({ url: targetUrl, active: false });
    } else {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => alert('Mission ID not found in URL!')
      });
    }
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getProductLinks') {
    var tabId = sender.tab.id;
    chrome.scripting.executeScript({
      target: { tabId: tabId, allFrames: true },
      func: extractProductLinksFromFrame
    }).then(function (results) {
      var allLinks = [];
      if (results) {
        results.forEach(function (r) {
          if (r.result) allLinks = allLinks.concat(r.result);
        });
      }
      var seen = {};
      var unique = [];
      allLinks.forEach(function (link) {
        if (!seen[link]) {
          seen[link] = true;
          unique.push(link);
        }
      });
      sendResponse({ links: unique });
    }).catch(function (e) {
      sendResponse({ links: [], error: e.message });
    });
    return true;
  }

  if (message.action === 'openAllProductLinks') {
    var tabId = sender.tab.id;

    chrome.scripting.executeScript({
      target: { tabId: tabId, allFrames: true },
      world: 'MAIN',
      func: function () {
        return new Promise(function (resolve) {
          var captured = [];
          var currentPid = '';
          var currentLi = 0;
          var currentRank = 0;
          var isEcom = /fetch_review_ecom/.test(window.location.href);

          var origOpen = window.open;
          window.open = function (url) {
            if (url) captured.push({ url: String(url), pid: currentPid, li: currentLi, rank: currentRank });
            return { closed: false, close: function () {}, focus: function () {} };
          };

          var origPush = history.pushState;
          history.pushState = function () {
            if (arguments[2]) {
              var u = String(arguments[2]);
              if (u.startsWith('/')) u = window.location.origin + u;
              captured.push({ url: u, pid: currentPid, li: currentLi, rank: currentRank });
            }
            return origPush.apply(this, arguments);
          };

          var origReplace = history.replaceState;
          history.replaceState = function () {
            if (arguments[2]) {
              var u = String(arguments[2]);
              if (u.startsWith('/')) u = window.location.origin + u;
              captured.push({ url: u, pid: currentPid, li: currentLi, rank: currentRank });
            }
            return origReplace.apply(this, arguments);
          };

          var lists = document.querySelectorAll('[class*="productList-"]');
          lists.forEach(function (list, li) {
            for (var rank = 1; rank <= 6; rank++) {
              var root = list.querySelector('[data-rank="' + rank + '"]');
              if (!root) continue;

              currentLi = li;
              currentRank = rank;

              if (!isEcom) {
                var pidEl = root.querySelector('[data-name="pid"]');
                currentPid = pidEl ? pidEl.getAttribute('data-value') : '';
              }

              var el = root.querySelector('[class*="first-"]');
              if (el) el.click();

              currentPid = '';
              currentLi = 0;
              currentRank = 0;
            }
          });

          setTimeout(function () {
            window.open = origOpen;
            history.pushState = origPush;
            history.replaceState = origReplace;
            resolve({ captured: captured, isEcom: isEcom });
          }, 2000);
        });
      }
    }).then(function (results) {
      var allCaptured = [];
      var isEcom = false;

      if (results) {
        results.forEach(function (r) {
          if (r.result) {
            allCaptured = allCaptured.concat(r.result.captured || []);
            if (r.result.isEcom) isEcom = true;
          }
        });
      }

      var seen = {};
      var unique = [];

      if (!isEcom) {
        allCaptured.forEach(function (item) {
          var pid = item.pid || '';
          if (pid && !seen[pid]) {
            seen[pid] = true;
            unique.push(item);
          } else if (!pid && item.url && item.url.length > 1) {
            unique.push(item);
          }
        });
        unique.sort(function (a, b) {
          if (b.li !== a.li) return b.li - a.li;
          return b.rank - a.rank;
        });
      } else {
        allCaptured.forEach(function (item) {
          var url = item.url || '';
          if (url && url.length > 1 && !seen[url]) {
            seen[url] = true;
            unique.push(item);
          }
        });
      }

      var urls = unique.map(function (item) { return item.url; });
      console.log('[SheetExt] Captured', urls.length, 'unique URLs:', urls);

      for (var i = urls.length - 1; i >= 0; i--) {
        chrome.tabs.create({ url: urls[i], active: false });
      }

      sendResponse({ opened: urls.length });
    }).catch(function (e) {
      sendResponse({ error: e.message });
    });

    return true;
  }
});

function extractProductLinksFromFrame() {
  var links = [];
  var cards = document.querySelectorAll('.cardWrapper-Er6cSa');
  if (!cards.length) return links;
  var limit = Math.min(cards.length, 6);
  for (var i = 0; i < limit; i++) {
    var a = cards[i].querySelector('a[href]');
    if (a) {
      links.push(a.href.split('?')[0]);
    }
  }
  return links;
}

function extractOpenAllLinksFromFrame() {
  var links = [];

  var productListCount = document.querySelectorAll('[class*="productList-"]').length;
  if (!productListCount) {
    console.log('[SheetExt] No productList containers found');
    return links;
  }

  console.log('[SheetExt] Found', productListCount, 'productList containers');

  var clickTasks = [];
  for (var c = 0; c < productListCount; c++) {
    for (var rank = 1; rank <= 6; rank++) {
      clickTasks.push({ ci: c, rank: rank });
    }
  }

  clickTasks.forEach(function (task, idx) {
    setTimeout(function () {
      var containers = document.querySelectorAll('[class*="productList-"]');
      var container = containers[task.ci];
      if (!container) return;
      var root = container.querySelector('[data-rank="' + task.rank + '"]');
      if (!root) return;
      var firstEl = root.querySelector('[class*="first-"]');
      if (firstEl) {
        firstEl.click();
        console.log('[SheetExt] Clicked rank', task.rank, 'in container', task.ci);
      }
    }, idx * 500);
  });

  console.log('[SheetExt] Scheduled', clickTasks.length, 'clicks with 500ms delay');
  return links;
}

// Inject interceptor at PAGE START (before SPA loads)
chrome.webNavigation.onCommitted.addListener(async (details) => {
  if (details.frameId !== 0) return;
  if (!details.url) return;
  const isTarget = details.url.includes('search.tiktok-row.net') || details.url.includes('search.tiktok-eu.net');
  if (!isTarget) return;
  try {
    await chrome.scripting.executeScript({
      target: { tabId: details.tabId },
      world: 'MAIN',
      func: interceptorFunc,
      injectImmediately: true
    });
  } catch (e) {}
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete') return;
  if (!tab.url) return;
  const isTarget = tab.url.includes('search.tiktok-row.net') || tab.url.includes('search.tiktok-eu.net');
  if (!isTarget) return;
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      world: 'MAIN',
      func: interceptorFunc
    });
  } catch (e) {}
});

function interceptorFunc() {
  if (window.__sheetExtInterceptor) return;
  window.__sheetExtInterceptor = true;
  console.log('[SheetExt] Interceptor injected in MAIN world');

  function storeData(obj) {
    window.__sheetExtDebugData = obj;
    try {
      document.documentElement.setAttribute('data-sheetext-debug', JSON.stringify(obj));
      console.log('[SheetExt] Stored debug data:', JSON.stringify(obj).substring(0, 150));
    } catch (e) {}
  }

  function tryCapture(text) {
    if (!text || text.length < 30) return;
    var hasDebug = text.indexOf('query_ecom_category') !== -1 || text.indexOf('debug_req_info') !== -1;
    if (!hasDebug) return;
    console.log('[SheetExt] Found debug keywords in response, length:', text.length);
    try {
      var obj = JSON.parse(text);
      if (obj && obj.debug_req_info && obj.debug_req_info.query_ecom_category) {
        storeData(obj.debug_req_info);
      } else if (obj && obj.query_ecom_category) {
        storeData(obj);
      } else if (obj && obj.data && obj.data.debug_req_info) {
        storeData(obj.data.debug_req_info);
      } else {
        console.log('[SheetExt] Keywords found but structure mismatch:', Object.keys(obj).join(', '));
      }
    } catch (e) { console.log('[SheetExt] Parse error:', e.message); }
  }

  var origFetch = window.fetch;
  if (origFetch) {
    window.fetch = function () {
      return origFetch.apply(this, arguments).then(function (resp) {
        try {
          resp.clone().text().then(function (text) {
            if (text && text.length > 30 && (text.indexOf('query_ecom_category') !== -1 || text.indexOf('debug_req_info') !== -1)) {
              console.log('[SheetExt] Fetch captured, len:', text.length);
              tryCapture(text);
            }
          }).catch(function () {});
        } catch (e) {}
        return resp;
      });
    };
  }

  var origOpen = XMLHttpRequest.prototype.open;
  var origSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function () {
    this.__url = arguments[1] || '';
    return origOpen.apply(this, arguments);
  };
  XMLHttpRequest.prototype.send = function () {
    var self = this;
    this.addEventListener('load', function () {
      try {
        var url = self.__url || '';
        console.log('[SheetExt] XHR response:', url.substring(0, 80), 'len:', (self.responseText || '').length);
        tryCapture(self.responseText);
      } catch (e) {}
    });
    return origSend.apply(this, arguments);
  };

  var pollCount = 0;
  var poll = setInterval(function () {
    pollCount++;
    if (window.__sheetExtDebugData || pollCount > 60) {
      clearInterval(poll);
      return;
    }
    try {
      var html = document.documentElement.innerHTML || '';
      if (html.indexOf('query_ecom_category') !== -1) {
        var idx = html.indexOf('"query_ecom_category"');
        if (idx === -1) idx = html.indexOf('query_ecom_category');
        if (idx !== -1) {
          var start = idx;
          for (var j = idx; j >= Math.max(0, idx - 500); j--) {
            if (html[j] === '{') { start = j; break; }
          }
          var depth = 0, end = -1;
          for (var k = start; k < html.length && k < start + 100000; k++) {
            if (html[k] === '{') depth++;
            else if (html[k] === '}') { depth--; if (depth === 0) { end = k + 1; break; } }
          }
          if (end !== -1) {
            try {
              var parsed = JSON.parse(html.substring(start, end));
              if (parsed && parsed.query_ecom_category) {
                storeData(parsed);
                clearInterval(poll);
              } else if (parsed && parsed.debug_req_info && parsed.debug_req_info.query_ecom_category) {
                storeData(parsed.debug_req_info);
                clearInterval(poll);
              }
            } catch (e) {}
          }
        }
      }
    } catch (e) {}
  }, 500);
}
