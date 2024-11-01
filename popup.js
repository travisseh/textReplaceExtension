document.addEventListener("DOMContentLoaded", async () => {
  const enableSwitch = document.getElementById("enableSwitch");
  const findText = document.getElementById("findText");
  const replaceText = document.getElementById("replaceText");
  const saveButton = document.getElementById("saveButton");

  // Load saved settings
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const hostname = new URL(tab.url).hostname;

  const settings = await chrome.storage.local.get(hostname);
  if (settings[hostname]) {
    enableSwitch.checked = settings[hostname].enabled;
    findText.value = settings[hostname].findText || "";
    replaceText.value = settings[hostname].replaceText || "";
  }

  saveButton.addEventListener("click", async () => {
    try {
      const config = {
        enabled: enableSwitch.checked,
        findText: findText.value,
        replaceText: replaceText.value,
      };

      console.log("Saving config:", config); // Debug log

      await chrome.storage.local.set({ [hostname]: config });

      const [activeTab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      console.log("Active tab:", activeTab); // Debug log

      try {
        await chrome.scripting.executeScript({
          target: { tabId: activeTab.id },
          function: (config) => {
            console.log("Executing script with config:", config); // Debug log
            window.postMessage(
              {
                type: "UPDATE_CONFIG_FROM_EXTENSION",
                config,
              },
              "*"
            );
          },
          args: [config],
        });
      } catch (error) {
        console.error("Error executing script:", error);
      }

      // Also try direct message
      try {
        await chrome.tabs.sendMessage(activeTab.id, {
          type: "UPDATE_CONFIG",
          config,
        });
      } catch (error) {
        console.error("Error sending direct message:", error);
      }

      saveButton.textContent = "Saved!";
      setTimeout(() => {
        saveButton.textContent = "Save";
      }, 1000);
    } catch (error) {
      console.error("Error in save button click:", error);
      saveButton.textContent = "Error!";
      setTimeout(() => {
        saveButton.textContent = "Save";
      }, 1000);
    }
  });
});
