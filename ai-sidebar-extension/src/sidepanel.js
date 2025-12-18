document.addEventListener('DOMContentLoaded', async () => {
  // --- DOM ELEMENTS ---
  const iframe = document.getElementById('main-frame');
  const loader = document.getElementById('loader');

  // Header
  const appHeader = document.getElementById('app-header');
  const hideHeaderBtn = document.getElementById('hide-header-btn');
  const showHeaderBtn = document.getElementById('show-header-btn'); // Floating trigger
  const providerSelect = document.getElementById('ai-provider');
  const urlInput = document.getElementById('url-input');
  const themeBtn = document.getElementById('theme-btn');

  // Context Panel
  const contextPanel = document.getElementById('context-panel');
  const showContextBtn = document.getElementById('show-context-btn'); // Floating FAB
  const minimizeBtn = document.getElementById('minimize-btn');
  const resizeHandle = document.getElementById('resize-handle');
  const dragOverlay = document.getElementById('drag-overlay');

  // Context Actions
  const captureBtn = document.getElementById('capture-btn');
  const contextArea = document.getElementById('context-area');
  const copyBtn = document.getElementById('copy-btn');
  const clearBtn = document.getElementById('clear-btn');

  // --- RESTORE STATE ---
  const state = await chrome.storage.local.get([
    'theme', 'lastUrl', 'lastProvider', 'panelHeight', 'headerHidden', 'contextHidden'
  ]);

  // 1. Theme
  if (state.theme === 'light' || (!state.theme && window.matchMedia('(prefers-color-scheme: light)').matches)) {
    document.body.classList.add('light-theme');
  }

  // 2. Navigation
  if (state.lastProvider) providerSelect.value = state.lastProvider;
  const initialUrl = state.lastUrl || providerSelect.options[providerSelect.selectedIndex].getAttribute('data-url');
  if (initialUrl) {
    urlInput.value = initialUrl;
    loadUrl(initialUrl);
  }

  // 3. Panel Height
  if (state.panelHeight) {
    contextPanel.style.height = state.panelHeight + 'px';
  }

  // 4. Header Visibility
  if (state.headerHidden) {
    appHeader.style.display = 'none';
    showHeaderBtn.style.display = 'flex';
  }

  // 5. Context Panel Visibility
  if (state.contextHidden) {
    contextPanel.style.display = 'none';
    resizeHandle.style.display = 'none';
    showContextBtn.style.display = 'flex';
  }

  // --- NAVIGATION FUNCTIONS ---
  function loadUrl(url) {
    if (!url) return;
    if (iframe.src === url) return;

    loader.style.display = 'flex';
    iframe.src = url;

    chrome.storage.local.set({
      lastUrl: url,
      lastProvider: providerSelect.value
    });

    iframe.onload = () => {
      loader.style.display = 'none';
    };
    // Fallback in case onload doesn't fire (e.g. some redirect blocks)
    setTimeout(() => { loader.style.display = 'none'; }, 2000);
  }

  providerSelect.addEventListener('change', () => {
    const option = providerSelect.options[providerSelect.selectedIndex];
    const url = option.getAttribute('data-url');
    if (url) {
      urlInput.value = url;
      loadUrl(url);
    } else {
      // Custom selected
      if (providerSelect.value === 'custom' && !urlInput.value) {
        urlInput.focus();
      }
    }
  });

  urlInput.addEventListener('change', () => {
    let url = urlInput.value.trim();
    if (!url) return;
    if (!url.startsWith('http')) url = 'https://' + url;
    urlInput.value = url;

    providerSelect.value = 'custom';
    loadUrl(url);
  });

  // --- THEME ----
  themeBtn.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    const isLight = document.body.classList.contains('light-theme');
    chrome.storage.local.set({ theme: isLight ? 'light' : 'dark' });
  });

  // --- HEADER TOGGLE ---
  hideHeaderBtn.addEventListener('click', () => {
    appHeader.style.display = 'none';
    showHeaderBtn.style.display = 'flex';
    chrome.storage.local.set({ headerHidden: true });
  });

  showHeaderBtn.addEventListener('click', () => {
    appHeader.style.display = 'block';
    showHeaderBtn.style.display = 'none';
    chrome.storage.local.set({ headerHidden: false });
  });

  // --- RESIZING LOGIC ---
  let isDragging = false;

  resizeHandle.addEventListener('mousedown', () => {
    isDragging = true;
    dragOverlay.style.display = 'block';
    document.body.style.cursor = 'row-resize';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    const containerHeight = document.body.clientHeight;
    // We resize based on distance from BOTTOM, since it's a footer
    // e.clientY is distance from TOP.
    // Height = Container Height - Mouse Y
    let newHeight = containerHeight - e.clientY;

    // Constraints
    if (newHeight < 60) newHeight = 60; // Min height
    if (newHeight > containerHeight * 0.7) newHeight = containerHeight * 0.7; // Max height

    contextPanel.style.height = newHeight + 'px';
  });

  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      dragOverlay.style.display = 'none';
      document.body.style.cursor = 'default';
      chrome.storage.local.set({ panelHeight: parseInt(contextPanel.style.height) });
    }
  });

  // --- CONTEXT MINIMIZE/RESTORE ---
  minimizeBtn.addEventListener('click', () => {
    contextPanel.style.display = 'none';
    resizeHandle.style.display = 'none';
    showContextBtn.style.display = 'flex';
    chrome.storage.local.set({ contextHidden: true });
  });

  showContextBtn.addEventListener('click', () => {
    contextPanel.style.display = 'flex';
    resizeHandle.style.display = 'flex';
    showContextBtn.style.display = 'none';
    chrome.storage.local.set({ contextHidden: false });
  });

  // --- CONTEXT ACTIONS ---

  // Capture
  captureBtn.addEventListener('click', async () => {
    const originalText = captureBtn.innerHTML;
    captureBtn.innerText = "Capturing...";

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) {
        contextArea.value = "No active tab found.";
        return;
      }

      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const selection = window.getSelection().toString();
          return selection || document.body.innerText;
        }
      });

      if (results && results[0] && results[0].result) {
        contextArea.value = results[0].result.trim();
        contextArea.scrollTop = 0;
      }
    } catch (err) {
      contextArea.value = "Capture failed: " + err.message;
    } finally {
      captureBtn.innerHTML = originalText;
    }
  });

  // Copy
  copyBtn.addEventListener('click', () => {
    contextArea.select();
    document.execCommand('copy');

    const btnText = copyBtn.querySelector('.btn-text');
    const originalText = btnText.innerText;
    btnText.innerText = "Copied!";
    setTimeout(() => btnText.innerText = originalText, 1500);
  });

  // Clear
  clearBtn.addEventListener('click', () => {
    contextArea.value = "";
  });
});
