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
const loadViaJsonButton = document.getElementById("load-via-json-button");
const helpButton = document.getElementById("help-button");
const splitUrlButton = document.getElementById("split-url-button");
const saveNewRuleBUtton = document.getElementById("save-new-rule-button");
const ruleEditorHelpButton = document.getElementById("rule-editor-help-button");

const githubToken = document.getElementById("github-token");
const gistUrl = document.getElementById("gist-url");
const allowedDomainsTextarea = document.getElementById(
  "allowed-domains-textarea"
);
const loadViaJsonTextarea = document.getElementById("load-via-json-textarea");
const sampleUrlInput = document.getElementById("sample-url-input");
const hubPageUrlInput = document.getElementById("hub-page-url-input");
const chapterIndexinput = document.getElementById("chapter-index-input");
const nameIndexInput = document.getElementById("name-index-input");

const tableBody = document.getElementById("table-body");
const settingsDiv = document.getElementById("settings-div");
const githubTokenHelpDiv = document.getElementById("github-token-help");
const helpSection = document.getElementById("help-section");
const splitTable = document.getElementById("url-split-table");

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
loadViaJsonButton.addEventListener("click", loadViaJson);
helpButton.addEventListener("click", toggleHelp);
splitUrlButton.addEventListener("click", splitUrl);
saveNewRuleBUtton.addEventListener("click", saveNewRule);
ruleEditorHelpButton.addEventListener("click", toggleRuleEditorHelp);

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

function capitalizeWords(str) {
  return str.replace(/\b\w/g, function (match) {
    return match.toUpperCase();
  });
}

function extractDomain(url) {
  const domainRegex = /^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n]+)/im;
  const matches = url.match(domainRegex);
  if (matches && matches.length > 1) {
    return matches[0];
  }
  return null;
}

function saveNewRule() {
  const chapterIndex = chapterIndexinput.value;
  const nameIndex = nameIndexInput.value;
  const sampleUrl = sampleUrlInput.value;
  const hubUrlValue = hubPageUrlInput.value.replace(/\/+$/, "");
  const hubUrlSplit = hubUrlValue.split("/");
  const hubUrlSplitLength = hubUrlSplit.length;
  const urlDomain = extractDomain(sampleUrl);

  chrome.storage.local.get(null, (result) => {
    chrome.storage.local.set({
      domainParseRules: {
        ...result["domainParseRules"],
        [urlDomain]: {
          chapterIndex: [chapterIndex],
          nameIndex: [nameIndex],
          hubPageLength: [hubUrlSplitLength],
        },
      },
    });
  });

  location.reload();
}

function splitUrl() {
  const ruleEditorSubsection = document.getElementById(
    "rule-editor-subsection"
  );
  ruleEditorSubsection.style.display = "block";

  while (splitTable.rows.length > 0) {
    splitTable.deleteRow(0);
  }

  const urlValue = sampleUrlInput.value.replace(/\/+$/, "");
  const urlSplit = urlValue.split("/");

  const hubUrlValue = hubPageUrlInput.value.replace(/\/+$/, "");
  const hubUrlSplit = hubUrlValue.split("/");

  urlSplit.map((currentValue, index) => {
    const newRow = document.createElement("tr");
    const cell1 = document.createElement("td");
    cell1.textContent = index;
    const cell2 = document.createElement("td");
    cell2.textContent = currentValue;

    newRow.appendChild(cell1);
    newRow.appendChild(cell2);
    splitTable.appendChild(newRow);
  });

  // hubUrlSplit.map((currentValue, index) => {
  //   let currentRow = splitTable.rows[index]
  //   if (currentRow == undefined) {
  //     currentRow = document.createElement("tr");
  //     const cell1 = document.createElement("td");
  //     cell1.textContent = index
  //     const cell2 = document.createElement("td");
  //     cell2.textContent = "<NONE>"
  //     currentRow.appendChild(cell1);
  //     currentRow.appendChild(cell2);
  //     splitTable.appendChild(currentRow)
  //   }
  //   const newCell = document.createElement("td");
  //   newCell.textContent = currentValue
  //   currentRow.appendChild(newCell)
  // })
}

function toggleHelp() {
  if (helpSection.style.display === "none") {
    helpButton.textContent = "Hide Help";
    helpSection.style.display = "block";
  } else {
    helpButton.textContent = "Show Help";
    helpSection.style.display = "none";
  }
}

function toggleRuleEditorHelp() {
  const ruleEditorHelpSection = document.getElementById(
    "rule-editor-help-section"
  );
  if (ruleEditorHelpSection.style.display === "none") {
    ruleEditorHelpSection.style.display = "block";
  } else {
    ruleEditorHelpSection.style.display = "none";
  }
}

function loadViaJson() {
  try {
    JSON.parse(loadViaJsonTextarea.value);
    const jsonData = JSON.parse(loadViaJsonTextarea.value);
    chrome.storage.local.set({ webtoons: jsonData });
    alert("Successfully Loaded From JSON");
    location.reload();
    return true;
  } catch (error) {
    alert("Invalid JSON: " + error.message);
    return false;
  }
}

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
    settingsButton.textContent = "Hide Settings";
    settingsDiv.style.display = "block";
  } else {
    settingsButton.textContent = "Show Settings";
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

  if (window.confirm("Are you sure you want to proceed?")) {
    chrome.runtime.sendMessage({
      action: "deleteChapter",
      data: [chapterName, currentUrl],
    });
    location.reload();
  }
}

function editWebtoon(event) {
  const webtoonId = event.target.getAttribute("data-id");
  const webtoonName = event.target.getAttribute("webtoonName");

  let newWebtoonName = window.prompt("Edit Webtoon Name", webtoonName);

  if (newWebtoonName != null && newWebtoonName != "") {
    chrome.runtime.sendMessage({
      action: "editWebtoon",
      data: [webtoonId, newWebtoonName],
    });

    location.reload();
  }
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

        const currentComicName = await getCurrentComicName();
        if (currentComicName == key) {
          row.className = "currentComic";
        }

        const link = document.createElement("a");
        link.href = `${value[1]}`;
        link.textContent = value[3];
        link.target = "_blank";
        cell1.appendChild(link);

        const editButton = document.createElement("button");
        editButton.className = "bootstrapicon";
        editButton.setAttribute("data-id", key);
        editButton.setAttribute("webtoonName", value[3]);

        const itag = document.createElement("i");
        itag.className = "bi bi-pencil-square";
        itag.setAttribute("data-id", key);
        itag.setAttribute("webtoonName", value[3]);
        itag.addEventListener("click", editWebtoon);
        editButton.appendChild(itag);
        cell1.appendChild(editButton);

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

    // Populate Rule Editor

    const splitTableData = storageData["domainParseRules"];
    const ruleEditorTable = document.getElementById("rule-editor-table");
    // Iterate over the storageData and add rows to the table
    for (const key in splitTableData) {
      if (splitTableData.hasOwnProperty(key)) {
        const value = splitTableData[key];

        const row = document.createElement("tr");
        const cell1 = document.createElement("td");
        const cell2 = document.createElement("td");
        const cell3 = document.createElement("td");
        const cell4 = document.createElement("td");
        const cell5 = document.createElement("td");

        cell1.textContent = key;
        row.appendChild(cell1);

        cell2.textContent = value.chapterIndex;
        row.appendChild(cell2);

        cell3.textContent = value.nameIndex;
        row.appendChild(cell3);

        cell4.textContent = value.hubPageLength;
        row.appendChild(cell4);

        const deleteRuleButton = document.createElement("button");
        deleteRuleButton.textContent = "Delete";
        deleteRuleButton.setAttribute("url-key", key);
        deleteRuleButton.addEventListener("click", deleteRule);
        cell5.appendChild(deleteRuleButton);
        row.appendChild(cell5);

        ruleEditorTable.appendChild(row);
      }
    }
  }
});

function deleteRule(event) {
  if (window.confirm("Are you sure you want to proceed?")) {
    const urlKey = event.target.getAttribute("url-key");

    chrome.storage.local.get(null, (result) => {
      const rules = result["domainParseRules"];
      delete rules[urlKey];
      chrome.storage.local.set({ domainParseRules: rules });
    });

    location.reload();
  }
}

function getCurrentComicName() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get("currentComicName", (result) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(result["currentComicName"]);
      }
    });
  });
}

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
