// popup.js

// DOM elements
const clearButton = document.getElementById("clear-button");
const listButton = document.getElementById("list-button");
const urlDisplay = document.getElementById("url-display");
const tableBody = document.getElementById("table-body");

// Event listener for login button
clearButton.addEventListener("click", clear);
listButton.addEventListener("click", showall);

function clear() {
  chrome.storage.local.clear(() => {
    console.log("Storage cleared");
  });
}

function showall() {
  chrome.storage.local.get(null, function (items) {
    console.log(items);
  });
}

// Get the current URL
chrome.tabs.query(
  {
    active: true,
    currentWindow: true,
  },
  function (tabs) {
    const currentUrl = tabs[0].url;
    urlDisplay.textContent = `Current URL: ${currentUrl}`;
  }
);

self.addEventListener("message", async (event) => {
  if (event.data.action === "getStorageData") {
    // Send a message to the background script to request storage data
    const storageData = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: "getStorageData" }, (response) => {
        resolve(response);
      });
    });

    // Clear existing table rows
    tableBody.innerHTML = "";

    // Iterate over the storageData and add rows to the table
    for (const key in storageData) {
      if (storageData.hasOwnProperty(key)) {
        const value = storageData[key];

        const row = document.createElement("tr");
        const cell1 = document.createElement("td");
        const cell2 = document.createElement("td");
        const cell3 = document.createElement("td");

        cell1.textContent = key;
        cell2.textContent = value;
        cell3.textContent = "action";

        row.appendChild(cell1);
        row.appendChild(cell2);
        row.appendChild(cell3);

        tableBody.appendChild(row);
      }
    }
  }
});

// Triggering the event with data containing the 'action' property
const eventData = {
  action: "getStorageData",
};

// Dispatching the event with the data
self.dispatchEvent(
  new MessageEvent("message", {
    data: eventData,
  })
);
