chrome.runtime.onInstalled.addListener(() => {
  console.log("[Pencari Data Sheet] Extension installed");
});

async function injectContentScript(tabId, url) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId, allFrames: true },
      files: ["content.js"],
      world: "MAIN"
    });
    console.log("[Pencari Data Sheet] Injected into", url);
  } catch (e) {
    console.log("[Pencari Data Sheet] Inject failed:", e.message);
  }
}

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete") return;
  if (!tab.url) return;

  const isTarget = tab.url.includes("search.tiktok-row.net") || tab.url.includes("docs.google.com") || tab.url.includes("google.com");
  if (!isTarget) return;

  await injectContentScript(tabId, tab.url);
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (!tab.url) return;
    const isTarget = tab.url.includes("search.tiktok-row.net") || tab.url.includes("docs.google.com") || tab.url.includes("google.com");
    if (!isTarget) return;
    await injectContentScript(tab.id, tab.url);
  } catch (e) {}
});
