// This script is injected into the page and listens for events.

// define key mappings for unifying event keys respectively column names
const keyMap = {
  '.*custom_map_dimension(.*)$': 'cd$1',
  '.*anonymize_ip$': 'aip',
  '.*Apotheken Name$': 'cd1',
  '.*Apotheken Adresse$': 'cd2',
  '.*Apotheken Id$': 'cd3',
  '.*Apotheken Plz$': 'cd4',
  '.*affiliation$': 'cd5',
  '.*isAnonymous$': 'cd6',
  '.*URL Fragment$': 'cd7',
  '.*lastPageBeforeCheckout$': 'cd8',
  '.*send_page_view$': 'send_page_view',
  '.*user_properties_(.*)$': 'up.$1',
  '.*content_group(.*)': 'cg$1',
  '.*send_to.*': 'send_to',
  '.*page_location': 'dl',
  '.*page_title': 'dt',
  '.*language': 'ul',
  '.*screen_resolution': 'sr',
  '.*client_id': 'cid',
  '.*allow_display_features': 'adf',
  '.*allow_ad_personalization_signals': 'aps',
  '.*cookie_domain': 'cd',
  '.*cookie_expires': 'ce',
  '.*cookie_flags': 'cf',
  '.*cookie_path': 'cp',
  '.*cookie_update': 'cu',
  '.*is_legacy_converter': 'ilc',
  '.*is_legacy_converted': 'ilcv',
  '([^_]*)_event_category$': 'ec',
  '([^_]*)_event_label$': 'el',
  '([^_]*)_percent_scrolled$': 'percent_scrolled',
  '.*content_type': 'content_type',

  '([^_]*)_item_list_name$': 'il$1nm',
  '([^_]*)_items_([^_]*)_(item_|)id$': 'il$1pi$2id',
  '([^_]*)_items_([^_]*)_(item_|)name$': 'il$1pi$2nm',
  '([^_]*)_items_([^_]*)_(item_|)brand$': 'il$1pi$2br',
  '([^_]*)_items_([^_]*)_(item_|)variant$': 'il$1pi$2va',
  '([^_]*)_items_([^_]*)_(item_|)category$': 'il$1pi$2ca',
  '([^_]*)_items_([^_]*)_quantity$': 'il$1pi$2qt',
  '([^_]*)_items_([^_]*)_price$': 'il$1pi$2pr',
  '([^_]*)_items_([^_]*)_(index|list_position)$': 'il$1pi$2ps',
  '([^_]*)_items_([^_]*)_list_name$': 'il$1pi$2ln',
  // Add more key mappings here
  // For example: 'item_id$': 'piid' (matches keys ending with 'item_id')
};

// define column names to be excluded from csv export
const columnNamesBlacklist = ["_ee", "_et", "_eu", "_gaz", "_gid", "_ono", "_p", "_r", "_slc", "_u", "_v", "a", "adf", "aip", "aps", "cd", "ce", "cf", "cid", "cos", "cp", "cu", "gjid", "gtm", "gtm.elementClasses", "gtm.elementId", "gtm.elementTarget", "gtm.elementUrl", "gtm.element_jQuery370067025086784166032_settings_background_background", "gtm.scrollDirection", "gtm.scrollThreshold", "gtm.scrollUnits", "gtm.triggers", "ilcv", "ir", "je", "jid", "jsscut", "ni", "sct", "sd", "seg", "sid", "sr", "uaa", "uab", "uafvl", "uam", "uamb", "uap", "uapv", "uaw", "ul", "v", "vp", "z"];

// Bind function reference for event listener on network requests to the page
this.listener = function (request) {
  if (request.request.url.includes("analytics") && request.request.url.includes("collect")) {
    // extract date/time and url from request and prepare for storage
    let requestString = '{"' + 'dateTime":"' + request.startedDateTime + '",' + '"url":"' + request.request.url + '"}';
    // send request as Web Event to background service worker
    sendWebEvent(requestString);
  }
}.bind(this);

// inject a script into the page to listen for events and send them to the content script
var injection = document.createElement('script');
injection.src = chrome.runtime.getURL('scripts/injectable.js');
(document.head || document.documentElement).appendChild(injection);
injection.onload = function () {
  injection.parentNode.removeChild(injection);
};

// Create a custom DOM event to send commands to the injected script
function sendCmd(cmd) {
  var cmdEvent = new CustomEvent('myCmdEvent', { detail: cmd });
  window.dispatchEvent(cmdEvent);
}

// Create a custom DOM event to send an command to the injected script to update the url
function updateUrl(url) {
  var cmdEvent = new CustomEvent('updateUrl', { detail: url });
  window.dispatchEvent(cmdEvent);
}

// open a port for long-term communication with the event page
// TODO: check if this is necessary
var port = chrome.runtime.connect({ name: "content-script" });
port.onMessage.addListener(function (message) {
});

// Add a message listener to the content script
chrome.runtime.onMessage.addListener(
  function (message, sender, sendResponse) {
    if (message.type == "ACTIVATE_LISTENER") {
      // console.log(message.text);
      sendCmd("activateListener");
    }
    if (message.type == "DEACTIVATE_LISTENER") {
      // console.log(message.text);
      sendCmd("deactivateListener");
    }
    if (message.type == "UPDATE_URL") {
      // console.log(message.text);
      updateUrl(message.text);
    }
    if (message.type == "PROCESS_LOGGED_EVENTS") {
      exportLoggedEvents(message.text);
    }
    if (message.type == "LOGGED_EVENTS_COUNT") {
      console.log(message.text);
    }
  }
)

function sendDataLayerEvent(event) {
  // send DataLayerEvent to background service worker
  var portTwo = chrome.runtime.connect({ name: "datalayer-event" });
  console.log("sending DataLayerEvent to background service worker");
  portTwo.postMessage({ text: event });
}

function sendGtagEvent(event) {
  // send GtagEvent to background service worker
  var portThree = chrome.runtime.connect({ name: "gtag-event" });
  console.log("sending GtagEvent to background service worker");
  portThree.postMessage({ text: event });
}

function sendWebEvent(event) {
  // send WebEvent to background service worker
  var portFour = chrome.runtime.connect({ name: "web-event" });
  console.log("sending WebEvent to background service worker");
  portFour.postMessage({ text: event });
}

function processLoggedEvents() {
  // send TRANSFER_LOGGED_EVENTS command to background service worker
  var portFive = chrome.runtime.connect({ name: "process-logged-events" });
  console.log("sending TRANSFER_LOGGED_EVENTS to background service worker");
  portFive.postMessage({ text: "TRANSFER_LOGGED_EVENTS" });
}

function clearLoggedEvents() {
  // send CLEAR_LOGGED_EVENTS command to background service worker
  var portFive = chrome.runtime.connect({ name: "process-logged-events" });
  console.log("sending CLEAR_LOGGED_EVENTS to background service worker");
  portFive.postMessage({ text: "CLEAR_LOGGED_EVENTS" });
}

// Add a post message listener to the page
window.addEventListener("message", function (event) {
  if (typeof event.data === 'string') {
    if (JSON.parse(event.data).type == "gtag") {
      console.log("GtagEvent received from page");
      sendGtagEvent(event.data);
    } else if (JSON.parse(event.data).type == "dataLayer") {
      console.log("DataLayerEvent received from page");
      sendDataLayerEvent(event.data);
    }
  }
  }, false);

function exportLoggedEvents(loggedEvents) {
  // export logged events as csv file
  let allEvents = processEvents(loggedEvents);
  let allColumnNames = extractKeys(allEvents);
  columnNamesBlacklist.forEach((blacklistedColumnName) => { allColumnNames.forEach((columnName) => { if (columnName === blacklistedColumnName) { allColumnNames.splice(allColumnNames.indexOf(blacklistedColumnName), 1); } }) });
  const csvData = createCsv(allColumnNames, allEvents);

  var blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });

  const dateSuffix = new Date().toISOString().slice(0, 10).replace(/-/g, "");

  var link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'GA4TrackingLog_' + dateSuffix + '.csv';
  link.click();
  console.log("CSV Daten wurden exportiert.");
}

// Functions for data processing

function processEvents(events) {
  // process events and return array of processed events
  let processedEvents = [];
  events = JSON.parse(events);
  events.forEach((event) => {
    event = JSON.parse(event);
    if (event.type === "dataLayer") {
      processedEvents.push(processDataLayerEvent(event));
    } else if (event.type === "gtag") {
      processedEvents.push(processGtagEvent(event));
    } else if (event.dateTime && event.url) {
      processedEvents.push(processWebEvent(event));
    }
  });
  return processedEvents;
}

function processWebEvent(event) {
  // process web event and return array of parameters
  let row = normalizeUrl(event.url);
  if (row.length > 0) {
    row.push({ "key": "dateTime", "values": event.dateTime, "key": "type", "values": "web" });
  }
  return row;
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

function processDataLayerEvent(event) {
  // process dataLayer event and return array of parameters
  let flattenedData = {};
  try {
    flattenedData = flattenDataLayer(event, '');
  } catch (error) {
    console.error('Invalid JSON:', event);
  }

  const renamedFlattenedData = renameKeys(flattenedData);

  let row = [];

  let enCache = 0;
  for (let key in renamedFlattenedData) {
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
  return row;
}

function flattenDataLayer(data, prefix = '') {
  // flatten dataLayer object and return flattened object
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

function processGtagEvent(event) {
  // process gtag event and return array of parameters
  let flattenedData = []
  try {
    flattenedData = flattenGtag(event, prefix = '')
  } catch (error) {
    console.error('Invalid JSON:', event);
  }
  const renamedFlattenedData = renameKeys(flattenedData, keyMap);
  let row = [];
  let enCache = 0;
  for (let key in renamedFlattenedData) {
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
  return row;

}

function flattenGtag(data, prefix = '') {
  // flatten gtag object and return flattened object
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

function renameKeys(data) {
  // rename keys of object based on keyMap and return renamed object
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
    line.forEach((pair) => {
      keys.push(pair.key);
    });
  });
  keys = keys.filter((value, index) => keys.indexOf(value) === index);
  return keys.sort();
}

function createCsv(allColumnNames, allEvents) {
  // create csv string from array of events and array of keys and return csv string
  var csv = '"' + allColumnNames.join('","') + '"\n'; // CSV header
  for (let i = 0; i < allEvents.length; i++) {
    let row = [];
    for (let j = 0; j < allColumnNames.length; j++) {
      let filtered = allEvents[i].filter(pair => { if (pair.key === allColumnNames[j]) { return pair.values; } })[0];
      if (filtered) {
        row.push(filtered.values);
      } else {
        row.push('""');
      }
    }
    csv += '"' + row.join('","') + '"\n';
  }
  return csv;
}