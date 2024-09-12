// DOMContentLoaded event listener to handle initial login state
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(['isLoggedIn', 'token'], (result) => {
    if (result.isLoggedIn) {
      showLoggedInState();
    }
  });
});

// Login button event listener
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
      chrome.storage.local.set({ token: data.token, isLoggedIn: true }, () => {
        console.log('Token stored successfully');
        document.getElementById('message').textContent = 'Login successful!';
        showLoggedInState();
      });
    } else {
      document.getElementById('message').textContent = `Login failed: ${data.message}`;
    }
  } catch (error) {
    console.error('Login error:', error);
    document.getElementById('message').textContent = 'An error occurred during login.';
  }
});

// Show the state when the user is logged in
function showLoggedInState() {
  // Hide login form elements
  document.getElementById('email').style.display = 'none';
  document.getElementById('password').style.display = 'none';
  document.getElementById('loginButton').style.display = 'none';

  // Show success message and import button
  document.getElementById('message').textContent = 'You are logged in!';
  createImportButton();
}

// Function to create the Import button dynamically
function createImportButton() {
  if (!document.getElementById('importButton')) {
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
            files: ['content.js'], // Content script that scrapes LinkedIn profile
          },
          () => {
            chrome.tabs.sendMessage(tabId, { action: 'scrapeLinkedInProfile' });
          }
        );
      });
    });
  }
}

// Listener for scraped data from the content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'sendProfileData') {
    const { name, headline, address, email, phone } = request.profileData;

    // Format the scraped data into a leads structure
    const leads = [
      {
        name: name || 'No Name Provided',
        headline: headline || 'No Headline Provided',
        address: address || 'No Address Provided',
        email: email || 'No Email Provided',
        phone: phone || 'No Phone Provided',
      }
    ];

    // Send the leads data to the API
    chrome.storage.local.get(['token'], (result) => {
      const token = result.token;
      if (token) {
        importLeads(token, leads);
      } else {
        console.log('No token found, user needs to log in.');
        document.getElementById('message').textContent = 'Please log in to continue.';
      }
    });
  }
});

//Function to send the leads to the Laravel API
function importLeads(token, leads) {
  // Sanitize the lead data before sending it to the API
  leads.forEach(lead => {
    lead.name = lead.name.replace(/\n|\s+/g, '').replace(/<[^>]*>/g, '');
    lead.headline = lead.headline.replace(/\n|\s+/g, '').replace(/<[^>]*>/g, '');
    lead.address = lead.address.replace(/\n|\s+/g, '').replace(/<[^>]*>/g, '');
  });

  const formattedLeads = { leads };

  //Send a POST request to the Laravel API to import leads
  fetch('http://127.0.0.1:8000/api/leads/import', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`, // Token retrieved from storage
    },
    body: JSON.stringify(formattedLeads),
  })
    .then(response => {
      console.log('Response status:', response.status);
      if (!response.ok) {
        return response.text().then(text => {
          console.log('Response text:', text);
          const errorMessage = text.startsWith('<') ? 'Server Error' : text;
          throw new Error(errorMessage);
        });
      }
      return response.json();
    })
    .then(data => {
      if (data.message === 'Leads imported successfully.') {
        console.log('Leads imported successfully:', data);
        document.getElementById('message').textContent = 'Leads imported successfully!';
      } else {
        console.error('Failed to import leads:', data.message);
        document.getElementById('message').textContent = `Failed to import leads: ${data.message}`;
      }
    })
    .catch(error => {
      console.error('Error during lead import:', error);
      document.getElementById('message').textContent = 'An error occurred while importing leads.';
    });
}

// function importLeads(token, leads) {
//   const formData = new FormData();
//   leads.forEach((lead, index) => {
//     formData.append(`leads[${index}][name]`, lead.name);
//     formData.append(`leads[${index}][headline]`, lead.headline);
//     formData.append(`leads[${index}][address]`, lead.address);
//     formData.append(`leads[${index}][email]`, lead.email);
//     formData.append(`leads[${index}][phone]`, lead.phone);
//   });

//   fetch('http://127.0.0.1:8000/api/leads/import', {
//     method: 'POST',
//     headers: {
//       'Authorization': `Bearer ${token}`, // No Content-Type header for FormData
//     },
//     body: formData,
//   })
//     .then(response => response.text()) // Using .text() to catch HTML responses
//     .then(data => {
//       console.log('Response:', data);
//       document.getElementById('message').textContent = 'Leads imported successfully!';
//     })
//     .catch(error => {
//       console.error('Error during lead import:', error);
//       document.getElementById('message').textContent = 'An error occurred while importing leads.';
//     });
// }
