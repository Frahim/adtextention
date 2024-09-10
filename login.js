document.getElementById('loginButton').addEventListener('click', async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const response = await fetch('http://127.0.0.1:8000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();

    if (response.ok) {
      chrome.storage.local.set({ isLoggedIn: true, token: data.token }, () => {
        document.getElementById('message').textContent = 'Login successful!';

        // Hide login form elements
        document.getElementById('email').style.display = 'none';
        document.getElementById('password').style.display = 'none';
        document.getElementById('loginButton').style.display = 'none';

        // Create and show the Import button
        const importButton = document.createElement('button');
        importButton.id = 'importButton';
        importButton.textContent = 'Import';
        document.body.appendChild(importButton);

        // Add event listener for the Import button        
        importButton.addEventListener('click', () => {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const tabId = tabs[0].id;

            chrome.scripting.executeScript(
              {
                target: { tabId: tabId },
                files: ['content.js']
              },
              () => {
                chrome.tabs.sendMessage(tabId, { action: 'scrapeLinkedInProfile' });
              }
            );
          });
        });
      });
    } else {
      document.getElementById('message').textContent = 'Login failed: ' + data.message;
    }
  } catch (error) {
    console.error('Error:', error);
    document.getElementById('message').textContent = 'An error occurred.';
  }
});

// Listen for scraped data from content script and export it as a JSON file
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'sendProfileData') {
    const { profileData } = request;
    console.log('Received profile data:', profileData);
    // Export the scraped data as a JSON file
    exportToJsonFile(profileData);
  }
});

// Function to export data as a JSON file
function exportToJsonFile(data) {
  const jsonString = JSON.stringify(data, null, 2); // Convert data to JSON string with indentation

  // Create a Blob from the JSON string
  const blob = new Blob([jsonString], { type: 'application/json' });

  // Create a link element for download
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'profileData.json'; // Name the file

  // Append the link, trigger the download, and then remove the link
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

