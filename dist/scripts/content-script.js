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
            console.log(message.text);
            sendCmd("activateListener");
        }
        if (message.type == "DEACTIVATE_LISTENER") {
            console.log(message.text);
            sendCmd("deactivateListener");
        }
        if (message.type == "UPDATE_URL") {
            console.log(message.text);
            updateUrl(message.text);
        }
    }
)

function sendDataLayerEvent(event) {
    var portTwo = chrome.runtime.connect({ name: "datalayer-event" });
    portTwo.postMessage({ text: event });
}

function sendGtagEvent(event) {
    var portThree = chrome.runtime.connect({ name: "gtag-event" });
    portThree.postMessage({ text: event });
}

// Add a post message listener to the page
window.addEventListener("message", function (event) {
    if (JSON.parse(event.data).type == "gtag") {
        sendGtagEvent(event.data);
    } else if (JSON.parse(event.data).type == "dataLayer") {
        sendDataLayerEvent(event.data);
    }
}, false);