let config = null;

// Update the replaceText function to be more robust
function replaceText(node) {
  if (!config || !config.enabled || !config.findText) {
    console.log("Skipping replace - invalid config:", config); // Debug log
    return;
  }

  console.log("Attempting to replace text with config:", config); // Debug log

  try {
    const walker = document.createTreeWalker(
      node,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    let replacementCount = 0;
    let currentNode;
    while ((currentNode = walker.nextNode())) {
      // Skip script and style tags
      if (
        currentNode.parentElement &&
        ["SCRIPT", "STYLE"].includes(currentNode.parentElement.tagName)
      ) {
        continue;
      }

      if (currentNode.nodeValue.includes(config.findText)) {
        const oldValue = currentNode.nodeValue;
        currentNode.nodeValue = currentNode.nodeValue.replaceAll(
          config.findText,
          config.replaceText || ""
        );
        replacementCount++;
        console.log("Replaced text:", {
          old: oldValue,
          new: currentNode.nodeValue,
        }); // Debug log
      }
    }
    console.log(`Completed replacements: ${replacementCount}`); // Debug log
  } catch (error) {
    console.error("Error replacing text:", error);
  }
}

// Handle shadow DOM
function handleShadowDOM(node) {
  if (node.shadowRoot) {
    replaceText(node.shadowRoot);
    observeShadowDOM(node.shadowRoot);
  }
}

// Create observer for dynamic content
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        replaceText(node);
        handleShadowDOM(node);
      }
    });
  });
});

function observeShadowDOM(root) {
  observer.observe(root, {
    childList: true,
    subtree: true,
  });
}

// Initialize
async function init() {
  console.log("Content script initialized"); // Debug log
  const hostname = window.location.hostname;
  console.log("Current hostname:", hostname); // Debug log

  const settings = await chrome.storage.local.get(hostname);
  console.log("Loaded settings:", settings); // Debug log

  config = settings[hostname];

  if (config && config.enabled) {
    console.log("Config is enabled, performing initial replacement"); // Debug log
    // Wait for DOM to be ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        replaceText(document.body);
        observeShadowDOM(document.body);
      });
    } else {
      replaceText(document.body);
      observeShadowDOM(document.body);
    }
  }
}

// Listen for both types of messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Received chrome message:", message); // Debug log
  if (message.type === "UPDATE_CONFIG") {
    config = message.config;
    if (config.enabled) {
      replaceText(document.body);
      observeShadowDOM(document.body);
    }
  }
});

window.addEventListener("message", (event) => {
  console.log("Received window message:", event.data); // Debug log
  // Only accept messages from the same window
  if (event.source !== window) return;

  if (event.data.type === "UPDATE_CONFIG_FROM_EXTENSION") {
    config = event.data.config;
    if (config.enabled) {
      replaceText(document.body);
      observeShadowDOM(document.body);
    }
  }
});

// Start the extension
init();
