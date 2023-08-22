let dataLayerCache = [];

function postDataLayerEvent(event) {
    event["dl"] = window.location.origin + window.location.pathname;
    event["eventId"] = event["gtm.uniqueEventId"];
    event["dateTime"] = new Date().toISOString();
    postMessage(JSON.stringify(event));
}

// Define your event listener function
function handleDataLayerEvent(event) {
    postDataLayerEvent(event)
}

function handleDataLayerChange(changes) {
    // Extract and process the new elements from the changes
    for (const change of changes) {
        const newElement = change.newValue;
        postMessage(JSON.stringify(newElement));
    }
}

function activateListener() {
    
    // Add the event listener to the dataLayer
    window.dataLayer = window.dataLayer || [];
    dataLayerCache = window.dataLayer;
    if (window.dataLayer != []) { window.dataLayer.forEach((event) => {
        postDataLayerEvent(event)
    }); }
    window.dataLayer.push = function () {
        // Call the original push method
        Array.prototype.push.apply(this, arguments);
        // Call your event listener function
        handleDataLayerEvent(arguments[0]);
    };

    const dataLayerProxy = new Proxy(window.dataLayer || [], {
        set: function (target, property, value) {
            // Call the original set method
            const success = Reflect.set(target, property, value);

            // Check if the property is a numeric string (array index)
            if (!isNaN(property)) {
                handleDataLayerChange([{ newValue: value }]);
            }

            return success;
        },
    });

    window.dataLayer = dataLayerProxy;
}

function deactivateListener() {
    window.dataLayer = dataLayerCache;
    window.dataLayer.push = function () { Array.prototype.push; };
}

window.addEventListener("myCmdEvent", function (event) {
    if (event.detail === "activateListener") {
        activateListener();
    }
    if (event.detail === "deactivateListener") {
        deactivateListener();
    }
});