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
    }
)

function sendDataLayerEvent(event) {
    var portTwo = chrome.runtime.connect({ name: "datalayer-event" });
    portTwo.postMessage({ text: event });
}

// Add a post message listener to the page
window.addEventListener("message", function (event) {
    sendDataLayerEvent(event.data);
    // We only accept messages from ourselves
}, false);