// DOMContentLoaded event listener to handle initial login state  
document.addEventListener("DOMContentLoaded", () => {  
  chrome.storage.local.get(["isLoggedIn", "token"], (result) => {  
    if (result.isLoggedIn) {  
      showLoggedInState();  
    } else {  
      showLoggedOutState();  
    }  
  });  
});  

// Login button event listener  
document.getElementById("loginButton").addEventListener("click", async () => {  
  const email = document.getElementById("email").value;  
  const password = document.getElementById("password").value;  

  try {  
    const response = await fetch("http://127.0.0.1:8000/api/login", {  
      method: "POST",  
      headers: {  
        "Content-Type": "application/json",  
      },  
      body: JSON.stringify({ email, password }),  
    });  

    const data = await response.json();  

    if (response.ok) {  
      chrome.storage.local.set({ token: data.token, isLoggedIn: true }, () => {  
        console.log("Token stored successfully");  
        document.getElementById("message").textContent = "Login successful!";  
        showLoggedInState();  
      });  
    } else {  
      document.getElementById("message").textContent = `Login failed: ${data.message}`;  
    }  
  } catch (error) {  
    console.error("Login error:", error);  
    document.getElementById("message").textContent = "An error occurred during login.";  
  }  
});  

// Logout button event listener  
document.getElementById("logoutButton").addEventListener("click", async () => {  
  try {  
    // Clear the token and login state  
    await chrome.storage.local.remove(['token', 'isLoggedIn']);  
    console.log("User logged out successfully.");  
    // Update UI  
    document.getElementById("message").textContent = "Logged out successfully!";  
    showLoggedOutState();  
  } catch (error) {  
    console.error("Logout error:", error);  
    document.getElementById("message").textContent = "An error occurred during logout.";  
  }  
});  

// Show the state when the user is logged in  
function showLoggedInState() {  
  // Hide login form elements  
  document.getElementById("email").style.display = "none";  
  document.getElementById("password").style.display = "none";  
  document.getElementById("loginButton").style.display = "none";  
  // Show logout button  
  document.getElementById("logoutButton").style.display = "block";  
  // Show success message  
  document.getElementById("message").textContent = "You are logged in!";  
  createImportButton();
}  

// Show the state when the user is logged out  
function showLoggedOutState() {  
  // Show login form elements  
  document.getElementById("email").style.display = "block";  
  document.getElementById("password").style.display = "block";  
  document.getElementById("loginButton").style.display = "block";  
  // Hide logout button  
  document.getElementById("logoutButton").style.display = "none";  
  // Clear the message  
  document.getElementById("message").textContent = "Please log in.";  
} 

// Function to create the Import button dynamically
function createImportButton() {
  if (!document.getElementById("importButton")) {
    const importButton = document.createElement("button");
    importButton.id = "importButton";
    importButton.textContent = "Import";
    document.body.appendChild(importButton);

    // Add event listener for the Import button
    importButton.addEventListener("click", () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tabId = tabs[0].id;

        chrome.scripting.executeScript(
          {
            target: { tabId: tabId },
            files: ["content.js"], // Content script that scrapes LinkedIn profile
          },
          () => {
            chrome.tabs.sendMessage(tabId, { action: "scrapeLinkedInProfile" });
          }
        );
      });
    });
  }
}

// Listener for scraped data from the content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "sendProfileData") {
    const { name, headline, address, email, phone, photo, url } = request.profileData;

    // Format the scraped data into a leads structure
    const leads = [
      {
        name: name || "No Name Provided",
        url: url || "No url Provided",
        headline: headline || "No Headline Provided",
        address: address || "No Address Provided",
        photo: photo || "No Address Provided",
        email: email || "No Email Provided",
        phone: phone || "No Phone Provided",
        
      },
    ];
    // Check if user is logged in and has a token
    chrome.storage.local.get(["token"], (result) => {
      const token = result.token;
      if (token) {
        // Import leads using the token
        console.log("myt", token);
        importLeads(token, leads);
      } else {
        console.log(token);
        document.getElementById("message").textContent =
          "Please log in to continue.";
      }
    });
  }
});

//let importedLeads = new Set(); 

// function importLeads(token, leads) {
//   const formData = new FormData();
//   leads.forEach((lead, index) => {
//     formData.append(`leads[${index}][name]`, lead.name);
//     formData.append(`leads[${index}][headline]`, lead.headline);
//     formData.append(`leads[${index}][address]`, lead.address);
//     formData.append(`leads[${index}][email]`, lead.email);
//     formData.append(`leads[${index}][phone]`, lead.phone);
//     formData.append(`leads[${index}][photo]`, lead.photo);
//     formData.append(`leads[${index}][url]`, lead.url);
//   });

//   fetch("http://127.0.0.1:8000/api/leads/import", {
//     method: "POST",
//     headers: {
//       Authorization: `Bearer ${token}`, // No Content-Type header for FormData
//     },
//     body: formData,
//   })
//     .then((response) => response.text()) // Using .text() to catch HTML responses
//     .then((data) => {
//       console.log("Response:", data);
//       document.getElementById("message").textContent =
//         "Leads imported successfully!";
//     })
//     .catch((error) => {
//       console.error("Error during lead import:", error);
//       document.getElementById("message").textContent =
//         "An error occurred while importing leads.";
//     });
// }


async function importLeads(token, leads) {
  // Fetch existing leads from the API
  const existingLeads = await fetchExistingLeads(token);

  if (!existingLeads) {
    document.getElementById("message").textContent = "Error fetching existing leads.";
    return;
  }

  // Filter out leads that are already imported (by checking the URL)
  const newLeads = leads.filter(lead => {
    const leadKey = lead.url ? lead.url.trim() : null; // Ensure lead URL is valid

    if (!leadKey) {
      console.warn("Lead with missing or invalid URL skipped:", lead);
      return false; // Skip leads with no valid URL
    }

    // Check if any existing lead has the same URL
    const isLeadAlreadyImported = existingLeads.some(existingLead => {
      const existingLeadUrl = existingLead.url ? existingLead.url.trim() : null;
      return existingLeadUrl === leadKey;
    });

    return !isLeadAlreadyImported; // Only include the lead if it hasn't been imported
  });

  if (newLeads.length === 0) {
    document.getElementById("message").textContent = "No new leads to import.";
    return; // Exit if there are no new leads
  }

  // Prepare the formData with the new leads
  const formData = new FormData();
  newLeads.forEach((lead, index) => {
    formData.append(`leads[${index}][name]`, lead.name);
    formData.append(`leads[${index}][headline]`, lead.headline);
    formData.append(`leads[${index}][address]`, lead.address);
    formData.append(`leads[${index}][email]`, lead.email);
    formData.append(`leads[${index}][phone]`, lead.phone);
    formData.append(`leads[${index}][photo]`, lead.photo);
    formData.append(`leads[${index}][url]`, lead.url);
  });

  // Perform the lead import
  fetch("http://127.0.0.1:8000/api/leads/import", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  })
    .then(response => response.text())
    .then(data => {
      console.log("Response:", data);
      document.getElementById("message").textContent =
        "Leads imported successfully!";
    })
    .catch(error => {
      console.error("Error during lead import:", error);
      document.getElementById("message").textContent =
        "An error occurred while importing leads.";
    });
}

// Helper function to fetch existing leads
async function fetchExistingLeads(token) {
  try {
    const response = await fetch("http://127.0.0.1:8000/api/leads", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch existing leads");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching existing leads:", error);
    return null;
  }
}
