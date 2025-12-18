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
  const screenshotBtn = document.getElementById('screenshot-btn');
  const contextArea = document.getElementById('context-area');
  const contextImage = document.getElementById('context-image');
  const copyBtn = document.getElementById('copy-btn');
  const clearBtn = document.getElementById('clear-btn');

  // --- DEBUG LOGGER ---
  // --- DEBUG LOGGER (Console Only) ---
  function log(msg, type = 'info') {
    console[type === 'error' ? 'error' : 'log'](`[${new Date().toLocaleTimeString()}] ${msg}`);
  }

  // --- CORE LOGIC ---
  function loadUrl(url) {
    if (!url) return;
    loader.style.display = 'flex';
    iframe.src = url;
    iframe.onload = () => {
      loader.style.display = 'none';
      log('Iframe loaded: ' + url);
    }
  }

  function updateProvider() {
    const provider = providerSelect.value;
    const option = providerSelect.options[providerSelect.selectedIndex];

    if (provider === 'custom') {
      urlInput.style.display = 'block';
      urlInput.focus();
    } else {
      urlInput.style.display = 'none'; // Clean look
      const url = option.dataset.url;
      urlInput.value = url;
      loadUrl(url);
    }
  }

  // --- INITIALIZATION ---
  chrome.storage.local.get(['theme', 'lastProvider', 'lastUrl'], (result) => {
    // Theme
    if (result.theme === 'light') {
      document.body.classList.add('light-theme');
    }

    // Provider/URL
    if (result.lastProvider) {
      providerSelect.value = result.lastProvider;
    }

    if (result.lastUrl) {
      urlInput.value = result.lastUrl;
    }

    // Initial Load
    updateProvider();
    // If custom, load the saved URL
    if (providerSelect.value === 'custom' && result.lastUrl) {
      loadUrl(result.lastUrl);
    }
  });

  // --- EVENT LISTENERS ---

  // 1. Provider Switch
  providerSelect.addEventListener('change', () => {
    updateProvider();
    chrome.storage.local.set({
      lastProvider: providerSelect.value,
      lastUrl: urlInput.value
    });
  });

  // 2. URL Input
  urlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      let url = urlInput.value.trim();
      if (!url) return;
      if (!url.startsWith('http')) url = 'https://' + url;
      urlInput.value = url;

      // Force custom if typing
      providerSelect.value = 'custom';
      chrome.storage.local.set({
        lastProvider: 'custom',
        lastUrl: url
      });
      loadUrl(url);
    }
  });

  // 3. Theme Toggle
  themeBtn.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    const isLight = document.body.classList.contains('light-theme');
    chrome.storage.local.set({ theme: isLight ? 'light' : 'dark' });
  });

  // 4. Header Toggle
  hideHeaderBtn.addEventListener('click', () => {
    const height = appHeader.offsetHeight;
    appHeader.style.marginTop = `-${height}px`;
    showHeaderBtn.style.display = 'flex';
    setTimeout(() => showHeaderBtn.style.opacity = '1', 10);
  });

  showHeaderBtn.addEventListener('click', () => {
    appHeader.style.marginTop = '0';
    showHeaderBtn.style.opacity = '0';
    setTimeout(() => showHeaderBtn.style.display = 'none', 300);
  });

  // 5. Context Minimize/Maximize
  let isContextMinimized = false;
  minimizeBtn.addEventListener('click', () => {
    contextPanel.style.display = 'none';
    showContextBtn.style.display = 'flex';
    isContextMinimized = true;
  });

  showContextBtn.addEventListener('click', () => {
    contextPanel.style.display = 'flex';
    showContextBtn.style.display = 'none';
    isContextMinimized = false;
  });

  // 6. Resize Logic
  let isResizing = false;
  let startY, startHeight;

  resizeHandle.addEventListener('mousedown', (e) => {
    isResizing = true;
    startY = e.clientY;
    startHeight = contextPanel.offsetHeight;
    dragOverlay.style.display = 'block'; // Prevent iframe capturing mouse
    document.body.style.cursor = 'row-resize';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;
    const deltaY = startY - e.clientY; // Drag up = positive delta (grow)
    const newHeight = startHeight + deltaY;

    // Limits
    if (newHeight > 100 && newHeight < (window.innerHeight - 100)) {
      contextPanel.style.height = `${newHeight}px`;
    }
  });

  document.addEventListener('mouseup', () => {
    if (isResizing) {
      isResizing = false;
      dragOverlay.style.display = 'none';
      document.body.style.cursor = 'default';
    }
  });

  // --- FULL PAGE SCREENSHOT LOGIC ---
  async function captureFullPage(tabId) {
    log('Starting full page capture...');

    // 1. Get Page Dimensions & Scroll
    const layoutMetrics = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        const { scrollWidth, scrollHeight, clientWidth, clientHeight } = document.documentElement;
        return {
          width: scrollWidth,
          height: scrollHeight,
          viewportWidth: clientWidth,
          viewportHeight: clientHeight,
          pixelRatio: window.devicePixelRatio
        };
      }
    });

    if (!layoutMetrics || !layoutMetrics[0] || !layoutMetrics[0].result) {
      throw new Error("Could not get page metrics");
    }

    const { width, height, viewportWidth, viewportHeight, pixelRatio } = layoutMetrics[0].result;
    log(`Page URL: ${width}x${height}, Viewport: ${viewportWidth}x${viewportHeight}`);

    // Create a canvas to stitch
    const canvas = document.createElement('canvas');
    canvas.width = width * pixelRatio;
    canvas.height = height * pixelRatio;
    const ctx = canvas.getContext('2d');
    // ctx.scale(pixelRatio, pixelRatio); // Don't scale if we want full res

    let y = 0;
    while (y < height) {
      log(`Capturing chunk at y=${y}`);

      // Scroll to y
      await chrome.scripting.executeScript({
        target: { tabId },
        func: (yCoord) => window.scrollTo(0, yCoord),
        args: [y]
      });

      // Wait for scroll/render (150ms)
      await new Promise(r => setTimeout(r, 150));

      // Capture Visible
      const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: 'png' });

      // Draw to canvas
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = dataUrl;
        // log(`Chunk size: ${dataUrl.length} chars`);
      });

      // Calculate where to draw
      // captureVisibleTab returns the *viewport*. 
      // y is our top scroll position.
      // We draw the image at y * pixelRatio
      ctx.drawImage(img, 0, y * pixelRatio);

      y += viewportHeight;
    }

    // Restore scroll
    await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        window.scrollTo(0, 0);
      }
    });

    log('Capture complete. Exporting...');
    return canvas.toDataURL('image/png');
  }


  // Helper to toggle between text and image view
  function showTextMode() {
    contextArea.hidden = false;
    contextImage.hidden = true;
    contextImage.removeAttribute('src');
  }

  function showImageMode(dataUrl) {
    contextArea.hidden = true;
    contextImage.hidden = false;
    contextImage.src = dataUrl;

    log(`Image loaded. Natural: ${contextImage.naturalWidth}x${contextImage.naturalHeight}, Display: ${contextImage.offsetWidth}x${contextImage.offsetHeight}`);
  }

  // Capture Text
  captureBtn.addEventListener('click', async () => {
    const originalText = captureBtn.innerHTML;
    captureBtn.innerText = "Capturing...";
    log('Capture Text clicked');

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) {
        showTextMode();
        const msg = "No active tab found.";
        log(msg, 'error');
        contextArea.value = msg;
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
        showTextMode();
        contextArea.value = results[0].result.trim();
        contextArea.scrollTop = 0;
        log('Text captured successfully');
      }
    } catch (err) {
      showTextMode();
      log("Capture failed: " + err.message, 'error');
      contextArea.value = "Capture failed: " + err.message;
    } finally {
      captureBtn.innerHTML = originalText;
    }
  });

  // Capture Screenshot (Full Page)
  screenshotBtn.addEventListener('click', async () => {
    const originalText = screenshotBtn.innerHTML;
    screenshotBtn.innerText = "Snapping...";
    log('Screenshot clicked');

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) throw new Error("No active tab");

      // Capture Full Page
      const dataUrl = await captureFullPage(tab.id);
      showImageMode(dataUrl);
      log('Screenshot displayed successfully');

    } catch (err) {
      console.error(err);
      log("Screenshot failed: " + err.message, 'error');
      showTextMode();
      contextArea.value = "Screenshot failed: " + err.message + "\n\n(See debug log for details)";
    } finally {
      screenshotBtn.innerHTML = originalText;
    }
  });

  // Copy
  copyBtn.addEventListener('click', async () => {
    try {
      if (!contextImage.hidden && contextImage.src) {
        // Copy Image
        const response = await fetch(contextImage.src);
        const blob = await response.blob();
        await navigator.clipboard.write([
          new ClipboardItem({ [blob.type]: blob })
        ]);
      } else {
        // Copy Text
        contextArea.select();
        document.execCommand('copy');
      }

      // Feedback
      const btnText = copyBtn.querySelector('.btn-text');
      const originalText = btnText.innerText;
      btnText.innerText = "Copied!";
      setTimeout(() => btnText.innerText = originalText, 1500);

    } catch (err) {
      console.error('Copy failed:', err);
      const btnText = copyBtn.querySelector('.btn-text');
      btnText.innerText = "Error";
      setTimeout(() => btnText.innerText = "Copy", 1500);
    }
  });

  // Clear
  clearBtn.addEventListener('click', () => {
    contextArea.value = "";
    showTextMode();
  });
});
