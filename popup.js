// popup.js

// DOM elements
const clearButton = document.getElementById("clear-button");
const listButton = document.getElementById("list-button");
const tableBody = document.getElementById("table-body");

// Event listener for login button
clearButton.addEventListener("click", clear);

let currentUrl;
chrome.tabs.query(
  {
    active: true,
    currentWindow: true,
  },
  function (tabs) {
    currentUrl = tabs[0].url;
  }
);

function clear() {
  chrome.storage.local.clear();
  chrome.runtime.sendMessage({
    action: "clearBadgeText",
  });
  location.reload();
}

function deleteChapter(event) {
  // Get the value of the data-id attribute
  const chapterName = event.target.getAttribute("data-id");
  const currentUrl = event.target.getAttribute("current-url");
  // Perform other actions based on the buttonId or other data
  chrome.runtime.sendMessage({
    action: "deleteChapter",
    data: [chapterName, currentUrl],
  });
  location.reload();
}

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

        const link = document.createElement("a");
        link.href = `${value[1]}`;
        link.textContent = key;
        link.target = "_blank";
        cell1.appendChild(link);

        cell2.textContent = value[0];

        const deleteChapterButton = document.createElement("button");
        deleteChapterButton.textContent = "Delete";
        deleteChapterButton.id = "myButton";
        deleteChapterButton.className = "btn";
        deleteChapterButton.setAttribute("data-id", key);
        deleteChapterButton.setAttribute("current-url", currentUrl);
        deleteChapterButton.addEventListener("click", deleteChapter);
        cell3.appendChild(deleteChapterButton);

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
