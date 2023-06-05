// popup.js

// DOM elements
const clearButton = document.getElementById("clear-button");
const listButton = document.getElementById("list-button");
const settingsButton = document.getElementById("settings-button");
const saveGithubInfoButton = document.getElementById("save-github-info-button");
const loadGistDataButton = document.getElementById("load-gist-data-button");
const saveGistDataButton = document.getElementById("save-gist-data-button");
const githubTokenHelpButton = document.getElementById("github-token-help-button");
const showGithubTokenButton = document.getElementById(
  "show-github-token-button"
);

const githubToken = document.getElementById("github-token");
const gistUrl = document.getElementById("gist-url");

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
  chrome.storage.local.get("webtoons", function(items) {
    console.log(items)
  });
}

function clearStorage() {
  chrome.storage.local.set({ "webtoons": {} })
  location.reload();
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
        chrome.storage.local.set({ "webtoons": jsonObject });
      })
      .catch((error) => {
        console.log(error);
      });
  });

  location.reload();
}

function saveGistData() {
  chrome.storage.local.get(null, (result) => {
    const webtoonData = result["webtoons"];
    const gistUrl = result["gistUrl"];
    const githubToken = result["githubToken"];

    if (result["gistUrl"] === undefined || result["gistUrl"] === "") {
      // No gist -> Create and paste data

      fetch("https://api.github.com/gists", {
        method: "POST",
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: "Bearer " + githubToken,
          "X-GitHub-Api-Version": "2022-11-28",
        },
        body: JSON.stringify({
          description: "Example of a gist",
          public: false,
          files: {
            "README.md": JSON.stringify(webtoonData),
          },
        }),
      })
        .then((response) => {
          if (response.status != 201) {
            alert(`${response.status} - Potential incorrect Github token`);
          }
          return response.json();
        })
        .then((data) => {
          chrome.storage.local.set({ gistUrl: data.id });
        })
        .catch((error) => {
          console.log("Error:", error);
        });
    }

    else {
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
            content: JSON.stringify(webtoonData),
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
          alert("Successfully Saved Data")
        })
        .catch((error) => {
          console.log("Error:", error);
        });
    }
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
});

self.dispatchEvent(
  new MessageEvent("message", {
    data: { action: "getStorageData"},
  })
);

self.dispatchEvent(new MessageEvent("checkForStoredValues"));
