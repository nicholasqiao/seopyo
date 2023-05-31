// popup.js

// DOM elements
const clearButton = document.getElementById("clear-button");
const listButton = document.getElementById("list-button");
const urlDisplay = document.getElementById("url-display");

// Event listener for login button
clearButton.addEventListener("click", clear);
listButton.addEventListener("click", showall);

function clear() {
  chrome.storage.local.clear(() => {
    console.log("Storage cleared");
  });
}

function showall() {
  chrome.storage.local.get(null, function(items) {
    console.log(items);
  });
}

// Get the current URL
chrome.tabs.query({
  active: true,
  currentWindow: true
}, function(tabs) {
  const currentUrl = tabs[0].url;
  urlDisplay.textContent = `Current URL: ${currentUrl}`;
});