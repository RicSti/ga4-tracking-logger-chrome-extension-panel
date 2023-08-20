# GA4 Tracking Logger (Chrome Extension Panel)

## Overview

The GA4 Tracking Logger Chrome Extension Panel is a tool designed to assist developers and digital marketers in tracking Google Analytics tracking calls on web pages. This extension adds a custom panel to the Chrome Developer Tools that allows users to monitor and log GA4 (and UA) tracking requests on the inspected web page.

## Installation

1. Download the extension files or clone the repository from [GitHub Repository](https://github.com/RicSti/ga4-tracking-logger-chrome-extension-panel).
2. Open the Chrome browser.
3. Navigate to `chrome://extensions/`.
4. Enable "Developer mode" by toggling the switch in the upper-right corner.
5. Click on the "Load unpacked" button and select the extension directory.
6. The GA4 Tracking Logger extension will now be added to Chrome.

## Using the Extension

1. Open any web page that contains Google Analytics tracking calls.
2. Right-click on the page and select "Inspect" to open the Chrome Developer Tools.
3. Navigate to the "GA4 Tracking Logger" panel in the Developer Tools.

## Features

### Start and Stop Capturing

- Click the "Start" button to begin capturing GA4 tracking calls on the current page.
- Click the "Stop" button to stop capturing and log the captured tracking requests.

### Capturing and Logging

- The extension captures GA4 tracking calls that contain "analytics" and "collect?" in the URL.
- Tracked events are logged along with the date and time they were captured.
- The number of captured tracking events is displayed in the "Tracking calls recorded on this page" section.

### Batch URL Processing

- Enter a list of URLs (one URL per line) in the text area under "Batch processing."
- Click the "Start batch processing" button to process the batch of URLs.
- The extension will load each URL sequentially and capture the Google Analytics tracking calls.

### Export Tracked Events

- After tracking is stopped, the "Download" button will appear if tracked events were logged.
- Click the "Download" button to export the captured tracking events as a CSV file.