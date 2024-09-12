chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'scrapeLinkedInProfile') {
    // Use more specific selectors to target the desired elements
    const nameElement = document.querySelector('.text-heading-xlarge');
    const headlineElement = document.querySelector('.text-body-medium');
    const addressElement = document.querySelector('div.GeRIYUMtadrnqbyoyAPHLPypbynIxoJOSSHM span.text-body-small');

    // Extract text content and handle potential null values
    const name = nameElement ? nameElement.textContent.trim() : '';
    const headline = headlineElement ? headlineElement.textContent.trim() : '';
    const address = addressElement ? addressElement.textContent.trim() : '';
    const email =  'test@email.com';
    const phone =  '01753151515';


    // Send the profile data back to the popup
    chrome.runtime.sendMessage({
      action: 'sendProfileData',
      profileData: { name, headline, address, email, phone}
    });

    sendResponse({ success: true });
  }
});