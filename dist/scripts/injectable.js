let dataLayerCache = [];

function postDataLayerEvent(event) {
    event["dateTime"] = new Date().toISOString();
    event["dl"] = window.location.origin + window.location.pathname;
    event["type"] = "dataLayer";
    if (event["gtm.uniqueEventId"]) { event["eventId"] = event["gtm.uniqueEventId"]; };
    postMessage(JSON.stringify(event));
}

function postGtagEvent(arguments) {

    function flattenObject(obj, prefix = "") {
        var result = {};

        for (var key in obj) {
            if (typeof obj[key] === "object" && !Array.isArray(obj[key])) {
                Object.assign(result, flattenObject(obj[key], prefix + key + "_"));
            } else {
                result[prefix + key] = obj[key];
            }
        }

        return result;
    }

    let flattenedArgs = flattenObject(arguments);

    flattenedArgs["dl"] = window.location.origin + window.location.pathname;
    flattenedArgs["type"] = "gtag";
    flattenedArgs["dateTime"] = new Date().toISOString();
    postMessage(JSON.stringify(flattenedArgs));
}

// Define your event listener function
function handleDataLayerEvent(event) {
    postDataLayerEvent(event);
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
    if (window.dataLayer != []) {
        window.dataLayer.forEach((event) => {
            postDataLayerEvent(event)
        });
    }
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

function activateGtagListener() {
    const originalGtag = window.gtag;

    // Override the gtag function
    window.gtag = function () {
        // Call the original gtag function with the arguments
        originalGtag.apply(this, arguments);

        // Your custom code to capture and process the data
        postGtagEvent(arguments);
    };
}

function slowdownMouse() {
    document.addEventListener('click', function (event) {
        // Check if the click was triggered by a mouse event
        if (event.type === 'click' && event.clientX !== 0 && event.clientY !== 0) {
            // Prevent the default click behavior
            event.preventDefault();

            // Introduce a delay of 500ms before proceeding
            setTimeout(function () {
                // Perform the original click action after the delay
                event.target.click();
            }, 250);
        }
    });
}

function deactivateListener() {
    window.dataLayer = dataLayerCache;
    window.dataLayer.push = function () { Array.prototype.push; };
}

window.addEventListener("myCmdEvent", function (event) {
    if (event.detail === "activateListener") {
        activateListener();
        activateGtagListener();
    }
    if (event.detail === "deactivateListener") {
        deactivateListener();
    }
});

window.addEventListener("updateUrl", function (event) {
    window.location.href = event.detail;
});