chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'scrapeLinkedInProfile') {
    const name = document.querySelector('.text-heading-xlarge')?.textContent;
    const headline = document.querySelector('.text-body-medium')?.textContent;

    // Send the profile data back to the popup
    chrome.runtime.sendMessage({
      action: 'sendProfileData',
      profileData: { name, headline }
    });
  }
});