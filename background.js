// background.js (service worker)

accepted_hosts = ["reaperscans", "asurascans"];

// Add event listener for page navigation
chrome.webNavigation.onCommitted.addListener(function (details) {
  // Check if the navigation is in the main frame
  if (details.frameId === 0) {
    coreLogic(details);
  }
});

// Add event listener for active tab changes
chrome.tabs.onActivated.addListener(function (activeInfo) {
  coreLogic(activeInfo);
});

coreLogic = (activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, function (tab) {
    const currentUrl = tab.url;
    const parts = currentUrl.split("-");
    const partsByBackslash = currentUrl.split("/");
    const currentChapter = parts[parts.length - 1];
    const strippedChapterId = currentChapter.replace(/\/$/, "");
    const chapterIdIsInteger = /^\d+$/.test(strippedChapterId);
    const mainUrl = partsByBackslash[2];
    let comicName = "";
    let comicKey = "";

    if (
      isAcceptedHost(currentUrl, accepted_hosts) &&
      mainUrl.includes("reaperscans") &&
      partsByBackslash.length > 4
    ) {
      comicKey = partsByBackslash[4]
        .replace(/[0-9\s-]/g, "")
        .replace(/chapter/gi, "");
      comicName = partsByBackslash[4]
        .replace(/[0-9\s-]/g, " ")
        .replace(/chapter/gi, "")
        .trim();
      updateBookmark(
        comicKey,
        comicName,
        chapterIdIsInteger,
        strippedChapterId,
        currentUrl
      );
    } else if (
      isAcceptedHost(currentUrl, accepted_hosts) &&
      mainUrl.includes("asurascans") &&
      partsByBackslash.length > 4
    ) {
      comicKey = partsByBackslash[3]
        .replace(/[0-9\s-]/g, "")
        .replace(/chapter/gi, "");
      comicName = partsByBackslash[3]
        .replace(/[0-9\s-]/g, " ")
        .replace(/chapter/gi, "")
        .trim();
      if (comicName == "manga") {
        // This is the comic base page
        comicName = partsByBackslash[4]
          .replace(/[0-9\s-]/g, "")
          .replace(/chapter/gi, "");
      }
      updateBookmark(
        comicKey,
        comicName,
        chapterIdIsInteger,
        strippedChapterId,
        currentUrl
      );
    } else {
      chrome.action.setBadgeText({
        text: "???",
      });
    }
  });
};

updateBookmark = (
  comicKey,
  comicName,
  chapterIdIsInteger,
  strippedChapterId,
  currentUrl
) => {
  const key = comicName;

  chrome.storage.local.get(key, (result) => {
    if (result[key] == undefined && chapterIdIsInteger) {
      // This is for a new comic
      chrome.storage.local.set({
        [comicName]: [strippedChapterId, currentUrl, comicKey],
      });
      chrome.action.setBadgeText({
        text: strippedChapterId,
      });
    } else if (chapterIdIsInteger) {
      // Updating comic
      if (parseInt(strippedChapterId) > parseInt(result[key])) {
        chrome.storage.local.set({
          [comicName]: [strippedChapterId, currentUrl, comicKey],
        });
        chrome.action.setBadgeText({
          text: strippedChapterId,
        });
      } else {
        chrome.action.setBadgeText({
          text: result[key][0],
        });
      }
    }
  });
};

isAcceptedHost = (currentUrl, hostList) => {
  return hostList.some((host) => {
    return currentUrl.includes(host);
  });
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getStorageData") {
    // Retrieve the storage data from chrome.storage.local
    chrome.storage.local.get(null, (storageData) => {
      sendResponse(storageData);
    });
  }
  return true; // Indicates that the response will be sent asynchronously
});

// Listen for messages from the service worker
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "deleteChapter") {
    const currentUrl = message.data[1];

    const currentComicName = currentUrl
      .split("/")[4]
      .replace(/[0-9\s-]/g, " ")
      .replace(/chapter/gi, "")
      .trim();

    chrome.storage.local.remove(message.data[0]);
    if (message.data[0] == currentComicName) {
      chrome.action.setBadgeText({
        text: "???",
      });
    }
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "clearBadgeText") {
    chrome.action.setBadgeText({
      text: "???",
    });
  }
});
