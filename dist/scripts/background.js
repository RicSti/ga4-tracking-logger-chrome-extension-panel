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
            updateLoggedDataLayerEvents(message.text);
        })
    }
});

function updateLoggedDataLayerEvents(requestString) {
    // store request in session storage
    chrome.storage.session.get(['loggedDataLayerEvents'], function (result) {
      if (result && result.loggedDataLayerEvents && result.loggedDataLayerEvents !== "[]") {
        // append request to already stored requests
        let loggedDataLayerEvents = JSON.parse(result.loggedDataLayerEvents);
        loggedDataLayerEvents.push(requestString);
        loggedDataLayerEvents = JSON.stringify(loggedDataLayerEvents);
        chrome.storage.session.set({ loggedDataLayerEvents: loggedDataLayerEvents });
      } else {
        // store new request in session storage
        let loggedDataLayerEvents = [];
        loggedDataLayerEvents.push(requestString);
        loggedDataLayerEvents = JSON.stringify(loggedDataLayerEvents);
        chrome.storage.session.set({ loggedDataLayerEvents: loggedDataLayerEvents });
      }
    });
  }