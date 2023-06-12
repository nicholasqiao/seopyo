// background.js (service worker)

const KEYWORDS_TO_SKIP = ["manga", "comic", "comics", "webtoon", "webtoons"];

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

function coreLogic(activeInfo) {
  chrome.tabs.get(activeInfo.tabId, async function (tab) {
    const halfChapterRegex = /\d+-5/;

    const currentUrl = tab.url;
    const parts = currentUrl.split("-");
    const partsByBackslash = currentUrl.split("/");

    if (await urlIsInAllowedList(currentUrl)) {
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

      if (
        partsByBackslash.length > 3 &&
        shouldSkipKeyword(partsByBackslash[3], KEYWORDS_TO_SKIP)
      ) {
        comicName = returnComicName(partsByBackslash[4]);
      } else {
        comicName = returnComicName(partsByBackslash[3]);
      }
      updateBookmark(comicName, validChapterId, strippedChapterId, currentUrl);
    } else {
      chrome.action.setBadgeText({
        text: "???",
      });
    }
  });
}

updateBookmark = (comicName, validChapterId, strippedChapterId, currentUrl) => {
  const key = comicName;

  chrome.storage.local.get(null, (result) => {
    if (result["webtoons"][key] == undefined && validChapterId) {
      // This is for a new comic
      chrome.storage.local.set({
        webtoons: {
          ...result["webtoons"],
          [key]: [strippedChapterId, currentUrl, true],
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
            [key]: [strippedChapterId, currentUrl, true],
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

shouldSkipKeyword = (currentKeyword, KEYWORDS_TO_SKIP) => {
  return KEYWORDS_TO_SKIP.some((keyword) => {
    return currentKeyword.includes(keyword);
  });
};

urlIsInAllowedList = (currentUrl) => {
  return new Promise((resolve) => {
    chrome.storage.local.get("allowedDomains", (result) => {
      const allowedDomainsArray = result["allowedDomains"][1];

      resolve(
        allowedDomainsArray.some((domain) => {
          return currentUrl.includes(domain);
        })
      );
    });
  });
};

returnComicName = (urlSegment) => {
  return urlSegment
    .replace(/^\d+|\d+$/g, "")
    .replace(/-/g, " ")
    .replace(/chapter/gi, "")
    .trim();
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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "toggleIncludeWebtoon") {
    chrome.storage.local.get(null).then((storageData) => {
      const webtoonData = storageData["webtoons"];
      const webtoonTitle = message.data[0];

      webtoonData[webtoonTitle][2] = !webtoonData[webtoonTitle][2];
      chrome.storage.local.set({ webtoons: webtoonData });
    });
  }
});

chrome.runtime.onInstalled.addListener(function (details) {
  if (details.reason === "install") {
    chrome.storage.local.set({
      webtoons: {},
    });
  }
});
