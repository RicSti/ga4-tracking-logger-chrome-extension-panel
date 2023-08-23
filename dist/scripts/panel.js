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
    start();
    start();
    openUrl(actualUrl);
  } else {
    // show url input again and hide batched urls
    stop();
  }
});

function openUrl(urlString) {
  chrome.tabs.query({ active: true, url: "https://*/*" }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { type: "UPDATE_URL", text: urlString })
    setTimeout(reloadExtension, 5000);
  });
}

this.listener = function (request) {
  // Function reference for event listener
  if (request.request.url.includes("analytics") && request.request.url.includes("collect")) {
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
  // activate dataLayer event listener on page
  chrome.tabs.query({ active: true, url: "https://*/*" }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { type: "ACTIVATE_LISTENER" })
  });
  // add event listener to network requests
  chrome.devtools.network.onRequestFinished.addListener(this.listener);
  // update UI
  document.getElementsByClassName('sphere')[0].setAttribute('class', 'sphere green');
  document.getElementById("urlInput").classList.add("hidden");
  document.getElementById("requestsOutput").classList.remove("hidden");
}

function stop(button) {
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
  if (button) {
    // deactivate dataLayer event listener on page
    chrome.tabs.query({ active: true, url: "https://*/*" }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { type: "DEACTIVATE_LISTENER" })
    });
  }
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
  chrome.storage.session.get(['loggedEvents'], function (result) {
    if (result && result.loggedEvents && result.loggedEvents !== "[]") {
      const parsedData = JSON.parse(result.loggedEvents);
      let allEvents = processEvents(parsedData);

      chrome.storage.session.get(['loggedDataLayerEvents'], function (result) {
        if (result.loggedDataLayerEvents) {
          let parsedDataLayerEvents = [];
          try {
            parsedDataLayerEvents = JSON.parse(result.loggedDataLayerEvents);
          } catch (error) {
            console.error('Invalid JSON:', result.loggedDataLayerEvents);
          }
          allEvents = allEvents.concat(processDataLayerEvents(parsedDataLayerEvents));
        } else {
          console.log('No dataLayer events found.');
        }

        chrome.storage.session.get(['loggedGtagEvents'], function (result) {
          if (result.loggedGtagEvents) {
            let parsedGtagEvents = [];
            try {
              parsedGtagEvents = JSON.parse(result.loggedGtagEvents);
            } catch (error) {
              console.error('Invalid JSON:', result.loggedGtagEvents);
            }
            allEvents = allEvents.concat(processGtagEvents(parsedGtagEvents));
          } else {
            console.log('No gtag events found.');
          }

          let allColumnNames = extractKeys(allEvents);
          columnNamesBlacklist.forEach((blacklistedColumnName) => { allColumnNames.forEach((columnName) => { if (columnName === blacklistedColumnName) { allColumnNames.splice(allColumnNames.indexOf(blacklistedColumnName), 1); } }) });

          const csvData = createCsv(allColumnNames, allEvents);

          var blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });

          const dateSuffix = new Date().toISOString().slice(0, 10).replace(/-/g, "");

          var link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = 'GA4TrackingLog_'+dateSuffix+'.csv';
          link.click();
          chrome.devtools.inspectedWindow.eval(
            'console.log(unescape("CSV Daten wurden exportiert."));'
          );
        });
      });
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

function processDataLayerEvents(parsedData) {
  const dataLayerEvents = [];
  for (let i = 0; i < parsedData.length; i++) {
    let flattenedData = {};
    try {
      flattenedData = flattenDataLayer(JSON.parse(parsedData[i]), '');
    } catch (error) {
      console.error('Invalid JSON:', parsedData[i]);
    }

    const renamedFlattenedData = renameKeys(flattenedData);

    let row = [];

    enCache = 0;
    for (key in renamedFlattenedData) {
      if (enCache === 1) {
        row.push({ "key": "en", "values": [renamedFlattenedData[key]] });
        enCache = 0;
      } else if (renamedFlattenedData[key] == "event") {
        enCache = 1;
      } else if (/^(UA|G)-/.test(renamedFlattenedData[key])) {
        row.push({ "key": "tid", "values": [renamedFlattenedData[key]] });
      } else if (/^(timer|scroll)/.test(renamedFlattenedData[key])) {
        row.push({ "key": "en", "values": [renamedFlattenedData[key]] });
      } else if ((renamedFlattenedData[key])) {
        row.push({ "key": key == 0 ? "en" : key, "values": [renamedFlattenedData[key]] });
      }
    }
    dataLayerEvents.push(row);
  }

  return dataLayerEvents;
}

function flattenDataLayer(data, prefix = '') {
  const flattenedData = {};
  for (const key in data) {
    if (typeof data[key] === 'object') {
      // Recursive call for nested objects
      const nestedData = flattenDataLayer(data[key], prefix + (key > 0 ? (key - 1) : key) + '_');
      Object.assign(flattenedData, nestedData);
    } else if (Array.isArray(data[key])) {
      // Special handling for arrays
      data[key].forEach((item, index) => {
        const arrayPrefix = prefix + key + '_';
        const arrayItemPrefix = arrayPrefix + (index + 1) + '_';
        const flattenedItem = flattenDataLayer(item, arrayItemPrefix);
        Object.assign(flattenedData, flattenedItem);
      });
    } else {
      // Regular key-value pairs
      flattenedData[prefix + key] = data[key];
    }
  }
  return flattenedData;
}

function processGtagEvents(parsedData) {
  let gTagEvents = [];
  for (let i = 0; i < parsedData.length; i++) {
    let flattenedData = []
    try {
      flattenedData = flattenGtag(JSON.parse(parsedData[i]), prefix = '')
    } catch (error) {
      console.error('Invalid JSON:', parsedData[i]);
    }
    const renamedFlattenedData = renameKeys(flattenedData, keyMap);
    let row = [];
    let enCache = 0;
    for (key in renamedFlattenedData) {
      if (enCache === 1) {
        row.push({ "key": "en", "values": [renamedFlattenedData[key]] });
        enCache = 0;
      } else if (/^(UA|G)-/.test(renamedFlattenedData[key])) {
        row.push({ "key": "tid", "values": [renamedFlattenedData[key]] });
      } else if (renamedFlattenedData[key] == "event") {
        enCache = 1;
      } else if (/^(timer)/.test(renamedFlattenedData[key])) {
        row.push({ "key": "en", "values": [renamedFlattenedData[key]] });
      } else if ((renamedFlattenedData[key])) {
        row.push({ "key": key == 0 ? "en" : key, "values": [renamedFlattenedData[key]] });
      }
    }
    console.log(row);
    gTagEvents.push(row);
  }
  return gTagEvents;
}

function flattenGtag(data, prefix = '') {
  const flattenedData = {};

  for (const key in data) {
    if (typeof data[key] === 'object' && !Array.isArray(data[key])) {
      // Recursive call for nested objects
      const nestedData = flattenGtag(data[key], prefix + (key > 0 ? (key - 1) : key) + '_');
      // const nestedData = flattenDataLayer(data[key], prefix + key + '_');
      Object.assign(flattenedData, nestedData);
    } else if (Array.isArray(data[key])) {
      // Special handling for arrays
      data[key].forEach((item, index) => {
        const arrayPrefix = prefix + key + '_';
        const arrayItemPrefix = arrayPrefix + (index + 1) + '_';
        const flattenedItem = flattenGtag(item, arrayItemPrefix);
        Object.assign(flattenedData, flattenedItem);
      });
    } else {
      // Regular key-value pairs
      flattenedData[prefix + key] = data[key];
    }
  }

  return flattenedData;
}

function normalizeUrl(urlString) {
  // normalize url and return array of parameters
  const url = new URL(urlString);
  const searchParams = new URLSearchParams(url.search);
  const propertiesArray = [];
  // iterate over all parameters and split values if necessary
  searchParams.forEach((value, key) => {
    if (!value.includes("~")) {
      propertiesArray.push({ key, values: value });
    } else {
      if (value.match(/~$/)) {
        value = value.slice(0, -1);
        propertiesArray.push({ key, values: value });
      } else {
        let parentKey = key;
        const valuesArray = value.split("~");
        valuesArray.forEach((value) => {
          let valueSplitted = value.replace(/^(.{2})/g, "$1|");
          key = parentKey + valueSplitted.split("|")[0];
          value = valueSplitted.split("|")[1];
          propertiesArray.push({ key, values: value });
        });
      }
    }
  });
  return (propertiesArray);
}

function renameKeys(data) {
  const renamedData = {};

  for (const key in data) {
    let newKey = key;

    for (const oldKey in keyMap) {
      const regex = new RegExp(oldKey);
      if (key.match(regex)) {
        newKey = key.replace(regex, keyMap[oldKey]);
        break; // Stop searching after finding the first match
      }
    }

    renamedData[newKey] = data[key];
  }

  return renamedData;
}

function extractKeys(array) {
  // extract all keys from array of events and return sorted array of keys
  var keys = [];

  array.forEach((line) => {
    if (Array.isArray(line)) {
      line.forEach((pair) => {
        keys.push(pair["key"]);
      });
    } else if (typeof line === 'object') {
      keys.push(...Object.keys(line));
    }
  });

  keys = keys.filter((value, index) => keys.indexOf(value) === index);
  return keys.sort();
}

function createCsv(allColumnNames, allEvents) {
  // create csv string from array of events and array of keys and return csv string
  var csv = '"' + allColumnNames.join('","') + '"\n'; // CSV header
  for (let i = 0; i < allEvents.length; i++) {
    if (typeof (allEvents[i][0]) === "object") {
      let row = [];
      for (let j = 0; j < allColumnNames.length; j++) {
        let matchingColumn = allEvents[i].filter((pair) => { if (pair.key === allColumnNames[j]) { return pair.values } });
        if (matchingColumn[0]) {
          row.push(matchingColumn[0].values);
        } else {
          row.push('""');
        }
      }
      csv += '"' + row.join('","') + '"\n';
    } else {
      let row = [];
      for (let j = 0; j < allColumnNames.length; j++) {
        if (allEvents[i][allColumnNames[j]] && allEvents[i][allColumnNames[j]] !== '') {
          row.push(allEvents[i][allColumnNames[j]]);
        } else {
          row.push('""');
        }
      }
      csv += '"' + row.join('","') + '"\n';
    }
  }
  return csv;
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
    chrome.storage.session.set({ batchedUrls: "[]" });
    chrome.storage.session.set({ loggedEvents: "[]" });
    chrome.storage.session.set({ loggedDataLayerEvents: "[]" });
    console.clear();
    chrome.devtools.inspectedWindow.eval(
      'console.clear();'
    );
  }
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
  stop("button");
});

reloadButton.addEventListener('click', function () {
  reloadExtension("button");
});

downloadButton.addEventListener('click', function () {
  exportLoggedEvents();
});

// Update copyright year
let year = document.getElementById('year');
year.textContent = new Date().getFullYear();
