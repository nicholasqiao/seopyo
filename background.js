// background.js (service worker)

accepted_hosts = ["reaperscans", "asurascans"];

let comicName = "";
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
    const halfChapterRegex = /\d+-5/;

    const currentUrl = tab.url;
    const parts = currentUrl.split("-");
    const partsByBackslash = currentUrl.split("/");

    let currentChapter;
    let strippedChapterId;

    if (currentUrl.match(halfChapterRegex)) {
      const match = currentUrl.match(halfChapterRegex)[0].replace(/-/g, ".");
      strippedChapterId = match;
    } else {
      currentChapter = parts[parts.length - 1];
      strippedChapterId = currentChapter.replace(/\/$/, "");
    }

    const validChapterId = /^(\d+|\d*\.\d+)$/.test(strippedChapterId);
    const mainUrl = partsByBackslash[2];

    if (
      // ReaperScans
      isAcceptedHost(currentUrl, accepted_hosts) &&
      mainUrl.includes("reaperscans") &&
      partsByBackslash.length > 4
    ) {
      comicName = partsByBackslash[4]
        .replace(/[0-9\s-]/g, " ")
        .replace(/chapter/gi, "")
        .trim();
      updateBookmark(comicName, validChapterId, strippedChapterId, currentUrl);
    } else if (
      // Asura Scans
      isAcceptedHost(currentUrl, accepted_hosts) &&
      mainUrl.includes("asurascans") &&
      partsByBackslash.length > 4
    ) {
      comicName = partsByBackslash[3]
        .replace(/[0-9\s-]/g, " ")
        .replace(/chapter/gi, "")
        .trim();
      if (comicName == "manga") {
        // This is the comic base page
        comicName = partsByBackslash[4]
          .replace(/[0-9\s-]/g, " ")
          .replace(/chapter/gi, "")
          .trim();
      }
      updateBookmark(comicName, validChapterId, strippedChapterId, currentUrl);
    } else {
      // Show ??? for all non supported pages
      chrome.action.setBadgeText({
        text: "???",
      });
    }
  });
};

updateBookmark = (comicName, validChapterId, strippedChapterId, currentUrl) => {
  const key = comicName;

  chrome.storage.local.get(null, (result) => {
    if (result["webtoons"][key] == undefined && validChapterId) {
      // This is for a new comic
      chrome.storage.local.set({
        webtoons: {
          ...result["webtoons"],
          [key]: [strippedChapterId, currentUrl],
        },
      });
      chrome.action.setBadgeText({
        text: strippedChapterId,
      });
    } else if (validChapterId) {
      // Updating comic
      if (
        parseFloat(strippedChapterId) > parseFloat(result["webtoons"][key][0])
      ) {
        chrome.storage.local.set({
          webtoons: {
            ...result["webtoons"],
            [key]: [strippedChapterId, currentUrl],
          },
        });
        chrome.action.setBadgeText({
          text: strippedChapterId,
        });
      } else {
        chrome.action.setBadgeText({
          text: result["webtoons"][key][0],
        });
      }
    } else {
      chrome.storage.local.get(null, (result) => {
        if (result["webtoons"][key] === undefined) {
          chrome.action.setBadgeText({
            text: "???",
          });
        } else {
          chrome.action.setBadgeText({
            text: result["webtoons"][key][0],
          });
        }
      });
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
    chrome.storage.local.get(null, (storageData) => {
      sendResponse(storageData);
    });
  }
  return true; // Indicates that the response will be sent asynchronously
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "deleteChapter") {
    chrome.storage.local.get(null).then((storageData) => {
      const webtoonData = storageData["webtoons"];
      const webtoonTitle = message.data[0];
      delete webtoonData[webtoonTitle];
      chrome.storage.local.set({ webtoons: webtoonData });
    });

    if (message.data[0] == comicName) {
      chrome.action.setBadgeText({
        text: "???",
      });
    }
  }
});

chrome.runtime.onInstalled.addListener(function (details) {
  if (details.reason === "install") {
    chrome.storage.local.set({
      webtoons: {},
    });
  }
});
