let isOn = false;
let panelLogCount = 0;

chrome.storage.local.get(['batchedUrls'], function (result) {
  // check if batched urls are stored in session storage and process them if so
  if (result && result.batchedUrls && result.batchedUrls !== "[]") {
    isOn = true;
    // hide url input and show batched urls
    document.getElementById("urlInput").classList.add("hidden");
    document.getElementById("batch").classList.remove("hidden");
    // get urls from session storage
    let urls = JSON.parse(result.batchedUrls);
    let urlsString = "";
    // update textarea with (remaining) urls in batch
    for (let i = 0; i < urls.length; i++) {
      urlsString += urls[i] + "\n";
    }
    document.getElementById('urlBatch').value = urlsString;
    // read and then remove first url from batch array and store remaining urls in session storage
    let actualUrl = urls[0];
    urls.shift();
    chrome.storage.local.set({ batchedUrls: JSON.stringify(urls) });
    // start the capturing process
    openUrl(actualUrl);
    activateListeners();
    // reload extension after 5 seconds to process next url in batch
    if (urls.length > 0) {
      setTimeout(reloadExtension, 5000);
    } else {
      document.getElementById("urlInput").classList.remove("hidden");
      document.getElementById("batch").classList.add("hidden");
    }
  }
});

// update UI based on current state
if (isOn) {
  start();
} else {
  stop();
}

// show eventLog, reset button and download button if requests were logged
if (panelLogCount > 0) {
  document.getElementById("eventLog").classList.remove("hidden");
  document.getElementById("resetButton").classList.remove("hidden");
  document.getElementById("downloadButton").classList.remove("hidden");
}

function start(button) {
  // update UI
  document.getElementById("startButton").classList.add("hidden");
  document.getElementById("stopButton").classList.remove("hidden");
  document.getElementsByClassName('sphere')[0].setAttribute('class', 'sphere green');
  document.getElementById("urlInput").classList.add("hidden");
  if (button) {
    activateListeners();
  }
}

function stop(button) {
  // update UI
  document.getElementById("startButton").classList.remove("hidden");
  document.getElementById("stopButton").classList.add("hidden");
  document.getElementsByClassName('sphere')[0].setAttribute('class', 'sphere red');
  document.getElementById("urlInput").classList.remove("hidden");
  document.getElementById("batch").classList.add("hidden");
  if (button) {
    deactivateListeners();
  }
}

function openUrl(urlString) {
  // open url in inspected tab
  chrome.tabs.query({ active: true, url: "https://*/*" }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { type: "UPDATE_URL", text: urlString })
  });
}

function activateListeners() {
  // activate dataLayer event listener on page
  chrome.tabs.query({ active: true, url: "https://*/*" }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { type: "ACTIVATE_LISTENER" })
  });
  // add event listener to network requests
  chrome.devtools.network.onRequestFinished.addListener(this.listener);
}

function deactivateListeners() {
  // deactivate dataLayer event listener on page
  chrome.tabs.query({ active: true, url: "https://*/*" }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { type: "DEACTIVATE_LISTENER" })
  });
 // remove event listener from network requests
 chrome.devtools.network.onRequestFinished.removeListener(this.listener);
}

function batchUrls() {
  // get urls from textarea and store them in session storage
  chrome.devtools.inspectedWindow.eval(
    'console.log(unescape("URL(s) laden..."));'
  );
  const divElement = document.getElementById('urls');
  const divContent = divElement.value.trim();
  const parsedData = divContent.split("\n");
  // remove empty lines from array and store urls in session storage
  if (parsedData.length > 0 && parsedData[0].length > 0) {
    chrome.devtools.inspectedWindow.eval(
      'console.log(unescape("' + parsedData.length + ' URL(s) wurde(n) geladen."));'
    );
    let batchedUrls = JSON.stringify(parsedData);
    document.getElementById('urlBatch').value = parsedData.join("\n");
    chrome.storage.local.set({ batchedUrls: batchedUrls }, function () { });
  } else {
    // show error message if no urls were found
    chrome.devtools.inspectedWindow.eval(
      'console.log(unescape("Es wurden keine URLs gefunden."));'
    );
  }
  // start the batch process by reloading the extension
  reloadExtension();
}

// Helper functions

function getActiveTab() {
  // get active tab object and return it
  chrome.tabs.query({ active: true, url: "https://*/*" }, function (tabs) {
    return tabs[0];
  });
}

function reloadExtension(button) {
  // reload extension
  if (button) {
    // if reset button was clicked, clear session storage and console
    chrome.storage.local.set({ batchedUrls: "[]" });
    clearLoggedEvents();
    console.clear();
    chrome.devtools.inspectedWindow.eval(
      'console.clear();'
    );
  }
  location.reload();
}

// Button click listeners

startButton.addEventListener('click', function () {
  start("button");
});

loadButton.addEventListener('click', function () {
  batchUrls();
});

stopButton.addEventListener('click', function () {
  stop("button");
});

resetButton.addEventListener('click', function () {
  reloadExtension("button");
});

downloadButton.addEventListener('click', function () {
  processLoggedEvents();
});

// Listen for messages from the background script to update the event log element in the panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.logCount && message.loggedEvents) {
    // Update the event log elements with the received values 
    const logCounter = document.getElementById("logCounter");
    logCounter.textContent = message.logCount;
    const loggedEvents = document.getElementById("loggedEvents");
    loggedEvents.textContent = message.loggedEvents;
    // update panelLogCount variable with current log count value
    panelLogCount = message.logCount;
    // show eventLog, reset button and download button
    document.getElementById("eventLog").classList.remove("hidden");
    document.getElementById("resetButton").classList.remove("hidden");
    document.getElementById("downloadButton").classList.remove("hidden");
  }
  if (message.loggedEvents) {
  }
});

// Keep copyright year in footer up to date ;)
let year = document.getElementById('year');
year.textContent = new Date().getFullYear();
