chrome.runtime.onInstalled.addListener(() => {
  console.log("Text Replacer Extension installed");
});

// Add listener for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete") {
    console.log("Tab updated:", tab.url);
  }
});
