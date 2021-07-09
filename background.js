chrome.action.onClicked.addListener((tab) => {
  msg = { txt: "execute" };
  chrome.tabs.sendMessage(tab.id, msg);
});
