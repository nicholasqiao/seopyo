// popup.js

// DOM elements
const clearButton = document.getElementById("clear-button");
const listButton = document.getElementById("list-button");
const settingsButton = document.getElementById("settings-button");
const saveGithubInfoButton = document.getElementById("save-github-info-button");
const loadGistDataButton = document.getElementById("load-gist-data-button");
const saveGistDataButton = document.getElementById("save-gist-data-button");
const githubTokenHelpButton = document.getElementById(
  "github-token-help-button"
);
const showGithubTokenButton = document.getElementById(
  "show-github-token-button"
);
const saveAllowedDomainsButton = document.getElementById(
  "save-allowed-domains-button"
);
const copyAllStorageButton = document.getElementById("copy-all-storage-button");

const githubToken = document.getElementById("github-token");
const gistUrl = document.getElementById("gist-url");
const allowedDomainsTextarea = document.getElementById(
  "allowed-domains-textarea"
);

const tableBody = document.getElementById("table-body");
const settingsDiv = document.getElementById("github-info");
const githubTokenHelpDiv = document.getElementById("github-token-help");

clearButton.addEventListener("click", clearStorage);
listButton.addEventListener("click", listStorage);
settingsButton.addEventListener("click", toggleSettings);
saveGithubInfoButton.addEventListener("click", saveGithubSettings);
loadGistDataButton.addEventListener("click", loadGistData);
saveGistDataButton.addEventListener("click", saveGistData);
showGithubTokenButton.addEventListener("click", toggleGithubTokenVisibility);
githubTokenHelpButton.addEventListener("click", toggleGithubTokenHelp);
saveAllowedDomainsButton.addEventListener("click", saveAllowedDomains);
copyAllStorageButton.addEventListener("click", copyAllStorageToClipboard);

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

function copyAllStorageToClipboard() {
  chrome.storage.local.get(null, function (items) {
    navigator.clipboard
      .writeText(JSON.stringify(items["webtoons"]))
      .then(() => {
        alert("Text copied to clipboard");
      })
      .catch((error) => {
        alert("Error copying text to clipboard:", error);
      });
  });
}

function saveAllowedDomains() {
  const allowedDomainsText = allowedDomainsTextarea.value;
  const domainListArray = allowedDomainsText.split(",");
  let cleanedDomainListArray = [];

  domainListArray.forEach((url) => {
    if (url != "") {
      url.trim();
      var domain = url.match(
        /^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n]+)/im
      )[1];
      cleanedDomainListArray.push(domain);
    }
  });

  chrome.storage.local.set({
    allowedDomains: [allowedDomainsText, cleanedDomainListArray],
  });
}

function toggleGithubTokenVisibility() {
  if (githubToken.type === "text") {
    githubToken.setAttribute("type", "password");
  } else {
    githubToken.setAttribute("type", "text");
  }
}

function saveGithubSettings() {
  chrome.storage.local.set({ githubToken: githubToken.value });
  chrome.storage.local.set({ gistUrl: gistUrl.value });

  location.reload();
}

function toggleSettings() {
  if (settingsDiv.style.display === "none") {
    settingsDiv.style.display = "block";
  } else {
    settingsDiv.style.display = "none";
  }
}

function toggleGithubTokenHelp() {
  if (githubTokenHelpDiv.style.display === "none") {
    githubTokenHelpDiv.style.display = "block";
  } else {
    githubTokenHelpDiv.style.display = "none";
  }
}

function listStorage() {
  chrome.storage.local.get(null, function (items) {
    console.log(items);
  });
}

function clearStorage() {
  if (window.confirm("Are you sure you want to proceed?")) {
    chrome.storage.local.set({ webtoons: {} });
    location.reload();
  }
}

function deleteChapter(event) {
  const chapterName = event.target.getAttribute("data-id");
  const currentUrl = event.target.getAttribute("current-url");

  chrome.runtime.sendMessage({
    action: "deleteChapter",
    data: [chapterName, currentUrl],
  });
  location.reload();
}

function loadGistData() {
  chrome.storage.local.get(null, (result) => {
    const token = result["githubToken"];
    const gistId = result["gistUrl"];
    const localWebtoonData = result["webtoons"];

    fetch(`https://api.github.com/gists/${gistId}`, {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        const jsonObject = JSON.parse(data.files["README.md"].content);
        const updatedWebtoonData = { ...localWebtoonData, ...jsonObject };

        chrome.storage.local.set({ webtoons: updatedWebtoonData });
        alert("Successfully Loaded From Gist");

        location.reload();
      })
      .catch((error) => {
        console.log(error);
      });
  });
}

function saveGistData() {
  chrome.storage.local.get(null, (result) => {
    const webtoonData = result["webtoons"];
    const filteredWebtoons = Object.fromEntries(
      Object.entries(webtoonData).filter(([key, value]) => value[2])
    );

    const gistUrl = result["gistUrl"];
    const githubToken = result["githubToken"];

    if (result["gistUrl"] === undefined || result["gistUrl"] === "") {
      // No gist -> Create and paste data
      const url = "https://api.github.com/gists";
      const token = githubToken;

      const headers = {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
      };

      const data = {
        description: "Example of a gist",
        public: false,
        files: {
          "README.md": {
            content: JSON.stringify(filteredWebtoons),
          },
        },
      };

      fetch(url, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(data),
      })
        .then((response) => {
          if (response.status === 201) {
            return response.json();
          } else {
            alert(`${response.status} Error - Check credentials`);
            throw new Error(`Error: ${response.status}`);
          }
        })
        .then((data) => {
          chrome.storage.local.set({ gistUrl: data.id });
          alert("Successfully Saved + Updated Gist URL");
          location.reload();
        })
        .catch((error) => {
          console.error(error);
        });
    } else {
      // Gist already created
      const url = "https://api.github.com/gists/" + gistUrl;
      const token = githubToken;

      const headers = {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
      };

      const data = {
        description: "An updated gist description",
        files: {
          "README.md": {
            content: JSON.stringify(filteredWebtoons),
          },
        },
      };

      fetch(url, {
        method: "PATCH",
        headers: headers,
        body: JSON.stringify(data),
      })
        .then((response) => {
          return response.json();
        })
        .then((data) => {
          alert("Successfully Saved Data");
        })
        .catch((error) => {
          console.log("Error:", error);
        });
    }
  });
}

function toggleInclude(event) {
  const chapterName = event.target.getAttribute("data-id");

  chrome.runtime.sendMessage({
    action: "toggleIncludeWebtoon",
    data: [chapterName],
  });
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
    const webtoonData = storageData["webtoons"];
    // Iterate over the storageData and add rows to the table
    for (const key in webtoonData) {
      if (webtoonData.hasOwnProperty(key)) {
        const value = webtoonData[key];
        const row = document.createElement("tr");
        const cell1 = document.createElement("td");
        const cell2 = document.createElement("td");
        const cell3 = document.createElement("td");
        const cell4 = document.createElement("td");

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

        const checkboxToInclude = document.createElement("input");
        if (value[2]) {
          checkboxToInclude.checked = true;
        }
        checkboxToInclude.type = "checkbox";
        checkboxToInclude.setAttribute("data-id", key);
        checkboxToInclude.addEventListener("click", toggleInclude);
        cell4.appendChild(checkboxToInclude);

        row.appendChild(cell1);
        row.appendChild(cell2);
        row.appendChild(cell3);
        row.appendChild(cell4);

        tableBody.appendChild(row);
      }
    }
  }
});

self.addEventListener("checkForStoredValues", async (event) => {
  chrome.storage.local.get("githubToken", function (items) {
    if (items["githubToken"] !== undefined) {
      githubToken.value = items["githubToken"];
    }
  });

  chrome.storage.local.get("gistUrl", function (items) {
    if (items["gistUrl"] !== undefined) {
      gistUrl.value = items["gistUrl"];
    }
  });

  chrome.storage.local.get("allowedDomains", function (items) {
    if (items["allowedDomains"] !== undefined) {
      allowedDomainsTextarea.value = items["allowedDomains"][0];
    }
  });
});

self.dispatchEvent(
  new MessageEvent("message", {
    data: { action: "getStorageData" },
  })
);

self.dispatchEvent(new MessageEvent("checkForStoredValues"));
