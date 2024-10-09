// Example background.js

async function registerUser(email, password) {
    const response = await fetch('http://127.0.0.1:8000/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, name: 'User' }),
    });
    const data = await response.json();
    return data;
  }
  
  async function loginUser(email, password) {
    const response = await fetch('http://127.0.0.1:8000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    return data;
  }
  // chrome.runtime.onInstalled.addListener(() => {
  //   // Check if user is logged in when the extension is installed
  //   chrome.storage.local.get(['isLoggedIn'], (result) => {
  //     if (result.isLoggedIn) {
  //       // If logged in, open the scrape popup
  //       chrome.action.setPopup({ popup: 'popup.html' });
  //     }
  //   });
  // });