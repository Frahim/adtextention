chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {  
  if (request.action === 'scrapeLinkedInProfile') {  
    // Selecting the elements  
    const nameElement = document.querySelector('.text-heading-xlarge');  
    const headlineElement = document.querySelector('div.qnjjEEJhkjURkMsZbnvpaTBqGnADaYg div.text-body-medium');  
    const addressElement = document.querySelector('div.qnjjEEJhkjURkMsZbnvpaTBqGnADaYg span.text-body-small');   

    // Extracting text content  
    const name = nameElement ? nameElement.textContent.trim() : '';  
    const headline = headlineElement ? headlineElement.textContent.trim() : '';      
    const address = addressElement ? addressElement.innerText.trim() : null;
    const url = window.location.href;
    const email = 'test@email.com';  
    const phone = '01753151515';  

    // Get the profile image URL  
    const imageElement = document.querySelector('.pv-top-card-profile-picture__image--show'); // Change the selector to target the correct profile image  
    const photo = imageElement ? imageElement.src : '';  
    console.log(photo);  
    // Get the current URL of the LinkedIn profile  
    //const url = window.location.href;  

    // Send the profile data back to the popup  
    chrome.runtime.sendMessage({  
      action: 'sendProfileData',  
      profileData: { name, headline, address, url, email, phone, photo } // Include the image URL  
    });  

    // Trigger the image download  
    // if (profileImageUrl) {  
    //   downloadImage(profileImageUrl, `${name}-profile-image.jpg`); // Customize the filename as needed  
    // }  

    sendResponse({ success: true });  
    console.log("Profile data received:", request.profileData);  
  }  
});  