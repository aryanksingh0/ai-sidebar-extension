// 1. Disable the default "Global Side Panel" behavior on click
// We want to manually control it so it opens specifically for the current TAB.
chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: false })
    .catch((error) => console.error(error));

// 2. Open the side panel for the *specific* tab when the icon is clicked
chrome.action.onClicked.addListener((tab) => {
    chrome.sidePanel.open({ tabId: tab.id });
});
