// background.js (service worker)

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

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    coreLogic({ tabId: tabId });
  }
});

function coreLogic(activeInfo) {
  chrome.tabs.get(activeInfo.tabId, async function (tab) {
    const halfChapterRegex = /\d+-\d+/;
    const currentUrl = tab.url;
    const partsByBackslash = currentUrl.replace(/\/+$/, "").split("/");

    let validChapterId;
    let strippedChapterId;

    if ((await urlIsInAllowedList(currentUrl)) && partsByBackslash.length > 3) {
      chrome.storage.local.get(null, (result) => {
        let urlDomain;

        const domainRegex =
          /^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n]+)/im;
        const matches = currentUrl.match(domainRegex);
        if (matches && matches.length > 1) {
          urlDomain = matches[0];
        }

        const chapterIndex =
          result["domainParseRules"][urlDomain].chapterIndex.toString();
        const nameIndex =
          result["domainParseRules"][urlDomain].nameIndex.toString();
        const hubPageLength =
          result["domainParseRules"][urlDomain].hubPageLength.toString();

        if (
          partsByBackslash.length >= chapterIndex &&
          partsByBackslash.length != hubPageLength
        ) {
          let strippedChapterId;
          let currentChapter;

          const currentSegment = partsByBackslash[chapterIndex];

          if (currentSegment.match(halfChapterRegex)) {
            // Decimal Chapter
            const match = currentSegment
              .match(halfChapterRegex)[0]
              .replace(/-/g, ".");
            strippedChapterId = match;
          } else {
            // Whole Chapter
            currentChapter = partsByBackslash[chapterIndex];

            const regex = /chapter-(\d+)/;
            const regex2 = /-(\d+)/;
            const match = currentChapter.match(regex);
            const match2 = currentChapter.match(regex2);

            if (match && match.length > 1) {
              const number = match[1];
              strippedChapterId = number;
            }

            if (match2 && match2.length > 1) {
              const number = match2[1];
              strippedChapterId = number;
            }
          }

          const removePeriodsName = partsByBackslash[nameIndex].split(".")[0];
          const regex = /^(.*?)chapter/i;
          const result = removePeriodsName.match(regex);
          let everythingBeforeChapter;

          if (result && result.length > 1) {
            everythingBeforeChapter = result[1];
          } else {
            everythingBeforeChapter = removePeriodsName;
          }

          comicName = capitalizeWords(
            everythingBeforeChapter
              .replace(/^-?\d+|\d+-$/, "")
              .replace(/-/g, " ")
              .replace(/chapter/gi, "")
              .trim()
          );

          validChapterId = /^(\d+|\d*\.\d+)$/.test(strippedChapterId);

          chrome.storage.local.set({ currentComicName: comicName });

          updateBookmark(
            comicName,
            validChapterId,
            strippedChapterId,
            currentUrl
          );
        } else {
          if (partsByBackslash.length > nameIndex) {
            const removePeriodsName =
              partsByBackslash[hubPageLength - 1].split(".")[0];
            const regex = /^(.*?)chapter/i;
            const result = removePeriodsName.match(regex);
            let everythingBeforeChapter;
            if (result && result.length > 1) {
              everythingBeforeChapter = result[1];
            } else {
              everythingBeforeChapter = removePeriodsName;
            }

            comicName = capitalizeWords(
              everythingBeforeChapter
                .replace(/^-?\d+|\d+-$/, "")
                .replace(/-/g, " ")
                .replace(/chapter/gi, "")
                .replace(/\?.*$/, "")
                .trim()
            );
            chrome.storage.local.set({ currentComicName: comicName });
            updateBookmark(
              comicName,
              validChapterId,
              strippedChapterId,
              currentUrl
            );
          }
        }
      });
    } else {
      chrome.storage.local.set({ currentComicName: "" });
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
          [key]: [strippedChapterId, currentUrl, true, comicName],
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
            [key]: [
              strippedChapterId,
              currentUrl,
              result["webtoons"][key][2],
              result["webtoons"][key][3],
            ],
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

urlIsInAllowedList = (currentUrl) => {
  return new Promise((resolve) => {
    chrome.storage.local.get("domainParseRules", (result) => {
      const allowedDomainsArray = Object.keys(result["domainParseRules"]);
      resolve(
        allowedDomainsArray.some((domain) => {
          return currentUrl.includes(domain);
        })
      );
    });
  });
};

capitalizeWords = (str) => {
  return str.replace(/\b\w/g, function (match) {
    return match.toUpperCase();
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

  if (message.action === "editWebtoon") {
    chrome.storage.local.get(null).then((storageData) => {
      const webtoonId = message.data[0];
      const newWebtoonName = message.data[1];

      let webtoonData = storageData["webtoons"][webtoonId];
      webtoonData[3] = newWebtoonName;

      chrome.storage.local.set({
        webtoons: {
          ...storageData["webtoons"],
          [webtoonId]: webtoonData,
        },
      });
    });
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
      domainParseRules: {}
    });
  }
});
