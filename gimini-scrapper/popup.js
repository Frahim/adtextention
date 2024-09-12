document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(['isLoggedIn'], (result) => {
    if (result.isLoggedIn) {
      // User is logged in, enable the button
      document.getElementById('scrapeButton').disabled = false;
    } else {
      // User is not logged in, disable the button
      document.getElementById('scrapeButton').disabled = true;
    }
  });

  document.getElementById('scrapeButton').addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: "scrape" });
    });
  });

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "dataScraped") {
      const resultDiv = document.getElementById('result');
      resultDiv.textContent = JSON.stringify(request.data, null, 2);
    }
  });
});
