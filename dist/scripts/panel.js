chrome.storage.session.get(['batchedUrls'], function (result) {
  // check if batched urls are stored in session storage and process them if so
  if (result && result.batchedUrls && result.batchedUrls !== "[]") {
    // hide url input and show batched urls
    document.getElementById("urlInput").classList.add("hidden");
    document.getElementById("batch").classList.remove("hidden");
    // get urls from session storage
    let urls = JSON.parse(result.batchedUrls);
    let urlsString = "";
    // update textarea with batched urls
    for (let i = 0; i < urls.length; i++) {
      urlsString += urls[i] + "\n";
    }
    document.getElementById('urlBatch').value = urlsString;
    // select actual url from array and store remaining urls in session storage
    let actualUrl = urls[0];
    urls.shift();
    chrome.storage.session.set({ batchedUrls: JSON.stringify(urls) });
    // get active tab and open actual url
    const tabId = getActiveTab();
    start();
    openUrl(tabId, actualUrl);
  } else {
    // show url input again and hide batched urls
    stop();
  }
});

function openUrl(tabId, urlString) {
  // open url in active tab and reload extension after 5 seconds
  chrome.tabs.update(tabId, { url: urlString }, function () {
    setTimeout(reloadExtension, 5000);
  });
}

this.listener = function (request) {
  // Function reference for event listener
  if (request.request.url.includes("analytics") && request.request.url.includes("collect?")) {
    // extract date/time and url from request and prepare for storage
    let requestString = '{"' + 'dateTime":"' + request.startedDateTime + '",' + '"url":"' + request.request.url + '"}';
    // show request in panel
    let requests = document.getElementById('requests');
    requests.textContent += requestString + ",";
    // update request count
    let requestsCount = document.getElementById('requestsCount');
    requestsCount.textContent = parseInt(requestsCount.textContent) + 1;
    // store request in session storage
    updateLoggedEvents(requestString);
  }
}.bind(this);

function updateLoggedEvents(requestString) {
  // store request in session storage
  chrome.storage.session.get(['loggedEvents'], function (result) {
    if (result && result.loggedEvents && result.loggedEvents !== "[]") {
      // append request to already stored requests
      let loggedEvents = JSON.parse(result.loggedEvents);
      loggedEvents.push(requestString);
      loggedEvents = JSON.stringify(loggedEvents);
      chrome.storage.session.set({ loggedEvents: loggedEvents });
    } else {
      // store new request in session storage
      let loggedEvents = [];
      loggedEvents.push(requestString);
      loggedEvents = JSON.stringify(loggedEvents);
      chrome.storage.session.set({ loggedEvents: loggedEvents });
    }
  });
}

// Functions for UI interaction

function start() {
  // add event listener to network requests
  chrome.devtools.network.onRequestFinished.addListener(this.listener);
  // update UI
  document.getElementsByClassName('sphere')[0].setAttribute('class', 'sphere green');
  document.getElementById("urlInput").classList.add("hidden");
  document.getElementById("requestsOutput").classList.remove("hidden");
}

function stop() {
  // remove event listener from network requests
  chrome.devtools.network.onRequestFinished.removeListener(this.listener);
  // update UI
  document.getElementsByClassName('sphere')[0].setAttribute('class', 'sphere red');
  document.getElementById("urlInput").classList.remove("hidden");
  document.getElementById("batch").classList.add("hidden");
  document.getElementById("requestsOutput").classList.add("hidden");
  // show download button if requests were logged
  chrome.storage.session.get(['loggedEvents'], function (result) {
    if (result && result.loggedEvents && result.loggedEvents !== "[]") {
      document.getElementById("downloadButton").classList.remove("hidden");
    }
  });
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
    chrome.storage.session.set({ batchedUrls: batchedUrls }, function () { });
  } else {
    // show error message if no urls were found
    chrome.devtools.inspectedWindow.eval(
      'console.log(unescape("Es wurden keine URLs gefunden."));'
    );
  }
  // start the batch process by reloading the extension
  reloadExtension();
}

function exportLoggedEvents() {
  // get logged events from session storage and process them 
  chrome.storage.session.get(['loggedEvents'], function (result) {
    if (result && result.loggedEvents && result.loggedEvents !== "[]") {
      chrome.devtools.inspectedWindow.eval(
        'console.log(unescape("CSV Daten werden exportiert..."));'
      );
      const parsedData = JSON.parse(result.loggedEvents);
      const allEvents = processEvents(parsedData);
      const allColumnNames = extractKeys(allEvents);
      const csvData = createCsv(allColumnNames, allEvents);
      var blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      // create download link and click it
      var link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'GA4TrackingLog.csv';
      link.click();
      chrome.devtools.inspectedWindow.eval(
        'console.log(unescape("CSV Daten wurden exportiert."));'
      );
    }
  });
}

// Functions for data processing

function processEvents(parsedData) {
  // process logged events and return array of events with normalized urls
  let events = [];
  for (let i = 0; i < parsedData.length; i++) {
    let row = normalizeUrl(JSON.parse(parsedData[i])["url"]);
    if (row.length > 0) {
      row.push({ "key": "dateTime", "values": [JSON.parse(parsedData[i])["dateTime"]] });
      events.push(row);
    }
  }
  return events;
}

function normalizeUrl(urlString) {
  // normalize url and return array of parameters
  const url = new URL(urlString);
  const searchParams = new URLSearchParams(url.search);
  const propertiesArray = [];
  // iterate over all parameters and split values if necessary
  searchParams.forEach((value, key) => {
    const valuesArray = value.split("~");
    propertiesArray.push({ key, values: valuesArray });
  });
  return (propertiesArray);
}

function extractKeys(array) {
  // extract all keys from array of events and return sorted array of keys
  var keys = [];
  array.forEach((line) => {
    var parameterNames = [];
    line.forEach((pair) => {
      parameterNames.push(pair["key"]);
    })
    parameterNames.forEach(name => { keys.push(name); });
  });
  keys = keys.filter((value, index) => keys.indexOf(value) === index);
  return keys.sort();
}

function createCsv(allColumnNames, allEvents) {
  // create csv string from array of events and array of keys and return csv string
  var csv = '"' + allColumnNames.join('","') + '"\n'; // CSV header
  for (i = 0; i < allEvents.length; i++) {
    let row = [];
    for (j = 0; j < allColumnNames.length; j++) {
      let columnName = allColumnNames[j];
      if (allEvents[i].filter((pair) => pair.key == columnName) && allEvents[i].filter((pair) => pair.key == columnName)[0] && allEvents[i].filter((pair) => pair.key == columnName)[0].values && allEvents[i].filter((pair) => pair.key == columnName)[0].values[0]) {
        let value = allEvents[i].filter((pair) => pair.key == columnName)[0].values[0];
        row.push(value);
      } else {
        row.push('""');
      }
    }
    csv += '"' + row.join('","') + '"\n';
  }
  return csv;
}

// Helper functions

function getActiveTab() {
  // get active tab object and return it
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    return tabs[0];
  });
}

function reloadExtension() {
  // reload extension
  location.reload();
}

// Button click listeners

startButton.addEventListener('click', function () {
  start();
});

loadButton.addEventListener('click', function () {
  batchUrls();
});

stopButton.addEventListener('click', function () {
  stop();
});

reloadButton.addEventListener('click', function () {
  chrome.storage.session.set({ loggedEvents: "[]" });
  reloadExtension();
});

downloadButton.addEventListener('click', function () {
  exportLoggedEvents();
});

// Update copyright year
let year = document.getElementById('year');
year.textContent = new Date().getFullYear();
