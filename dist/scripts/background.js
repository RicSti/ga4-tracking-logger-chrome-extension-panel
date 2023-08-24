// https://stackoverflow.com/questions/13373187/can-i-increase-quota-bytes-per-item-in-chrome
// https://developer.chrome.com/docs/extensions/reference/storage/

const storage = (() => {
  let mutex = Promise.resolve();
  const API = chrome.storage.sync;
  const mutexExec = (method, data) => {
    mutex = Promise.resolve(mutex)
      .then(() => method(data))
      .then(result => {
        mutex = null;
        return result;
      });
    return mutex;
  };
  const syncGet = data => new Promise(resolve => API.get(data, resolve));
  const syncSet = data => new Promise(resolve => API.set(data, resolve));
  return {
    read: data => mutexExec(syncGet, data),
    write: data => mutexExec(syncSet, data),
  };
})();

async function asyncStorageHandler(requestString) {
  let {loggedEvents} = await storage.read({ loggedEvents: {} });
  let tempLoggedEvents = JSON.parse(loggedEvents);
  tempLoggedEvents.push(requestString);
  loggedEvents = JSON.stringify(tempLoggedEvents);
  await storage.write({ loggedEvents })
  // .then(() => {
  //   console.log('new event logged: ', requestString);
  // });
}

function updateLoggedEvents(requestString) {
  // store request in session storage
  asyncStorageHandler(JSON.stringify(requestString));
}

// Set up a listener to handle incoming connections
chrome.runtime.onConnect.addListener(function (port) {
  // Store the incoming port as a local variable
  var thisPort = port;
  // Routing system to catch multiple port connections
  if (thisPort.name == "content-script") {
    //Send a one-time message to the content script
    // chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    //     chrome.tabs.sendMessage(tabs[0].id, { type: "ACTIVATE_LISTENER" })
    // });
  } else if (thisPort.name == "datalayer-event") {
    thisPort.onMessage.addListener(function (message) {
      // console.log("dataLayer-event received:");
      // console.log(message.text);
      updateLoggedEvents(message.text);
    })
  } else if (thisPort.name == "gtag-event") {
    thisPort.onMessage.addListener(function (message) {
      // console.log("gtag-event received:");
      // console.log(message.text);
      updateLoggedEvents(message.text);
    })
  } else if (thisPort.name == "web-event") {
    thisPort.onMessage.addListener(function (message) {
      // console.log("web-event received:");
      // console.log(message.text);
      updateLoggedEvents(message.text);
    })
  }
});