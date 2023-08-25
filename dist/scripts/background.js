let loggedEvents = [];

// Set up a listener to handle incoming connections
chrome.runtime.onConnect.addListener(function (port) {
  // Store the incoming port as a local variable
  var thisPort = port;
  // Routing system to catch multiple port connections
  if (thisPort.name == "datalayer-event") {
    thisPort.onMessage.addListener(function (message) {
      console.log("dataLayer-event received from content-script");
      logEvent(message.text);
    })
  } else if (thisPort.name == "gtag-event") {
    thisPort.onMessage.addListener(function (message) {
      console.log("gtag-event received from content-script");
      logEvent(message.text);
    })
  } else if (thisPort.name == "web-event") {
    thisPort.onMessage.addListener(function (message) {
      console.log("web-event received from content-script");
      logEvent(message.text);
    })
  } else if (thisPort.name == "process-logged-events") {
    thisPort.onMessage.addListener(function (message) {
      console.log("process-logged-events message received from content-script");
      console.log(message.text);
      if (message.text == "TRANSFER_LOGGED_EVENTS") {
        transferLoggedEvents();
      } else if (message.text == "CLEAR_LOGGED_EVENTS") {
        clearLoggedEvents();
      } 
    })
  }
});

function logEvent(event){
  // send eventLog to panel script
  loggedEvents.push(event);
  let messageText = loggedEvents.length;
  chrome.runtime.sendMessage({ logCount: loggedEvents.length, loggedEvents: loggedEvents });
}

function transferLoggedEvents() {
  // send eventLog to panel script
  // TODO: move storage of logged events to panel script
  let messageText = JSON.stringify(loggedEvents);
  chrome.tabs.query({ active: true, url: "https://*/*" }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { type: "PROCESS_LOGGED_EVENTS", text: messageText })
  });
}

function clearLoggedEvents(){
  loggedEvents = [];
}