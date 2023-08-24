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
      sendWebEvent(requestString);
    }
  }.bind(this);

// inject a script into the page
var injection = document.createElement('script');
injection.src = chrome.runtime.getURL('scripts/injectable.js');
(document.head || document.documentElement).appendChild(injection);
injection.onload = function () {
    injection.parentNode.removeChild(injection);
};

//Create a custom DOM event for communication with the page
function sendCmd(cmd) {
    var cmdEvent = new CustomEvent('myCmdEvent', { detail: cmd });
    window.dispatchEvent(cmdEvent);
}

function updateUrl(url) {
    var cmdEvent = new CustomEvent('updateUrl', { detail: url });
    window.dispatchEvent(cmdEvent);
}

// open a port for long-term communication with the event page
var port = chrome.runtime.connect({ name: "content-script" });
port.onMessage.addListener(function (message) {
});

// The content script does not have access to page's properties and functions.
// That is why the injected script is needed.
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
    }
)


function sendDataLayerEvent(event) {
    var portTwo = chrome.runtime.connect({ name: "datalayer-event" });
    // console.log("sendDataLayerEvent");
    // console.log(event);
    portTwo.postMessage({ text: event });
}

function sendGtagEvent(event) {
    var portThree = chrome.runtime.connect({ name: "gtag-event" });
    // console.log("sendGtagEvent");
    // console.log(event);
    portThree.postMessage({ text: event });
}

function sendWebEvent(event) {
    var portFour = chrome.runtime.connect({ name: "web-event" });
    // console.log("sendWebEvent");
    // console.log(event);
    portFour.postMessage({ text: event });
}

// Add a post message listener to the page
window.addEventListener("message", function (event) {
    if ( typeof event.data === 'string' ) {
        if (JSON.parse(event.data).type == "gtag") {
            sendGtagEvent(event.data);
        } else if (JSON.parse(event.data).type == "dataLayer") {
            sendDataLayerEvent(event.data);
        }
    }
}, false);