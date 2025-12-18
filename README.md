# 🧠 AI Sidebar & Context Capture

![Version](https://img.shields.io/badge/version-2.0-blue.svg) ![Chrome](https://img.shields.io/badge/Chrome-Extension-googlechrome.svg)

A premium, design-first Chrome Extension that brings the power of **ChatGPT, Gemini, and Claude** directly into your browsing experience. Featuring a "Glassmorphic" UI, smart context capturing (including full-page screenshots), and a unified Omnibox navigation system.

<p align="center">
  <img src="icons/icon128.png" width="128" alt="AI Sidebar Logo">
</p>

## ✨ Features

- **🚀 Universal Access**: Open ChatGPT, Gemini, or Claude in a resizable side panel without leaving your current tab.
- **📸 Full Page Screenshot**: 
    -   **Scroll & Stitch**: Automatically scrolls the active page to capture the entire content, not just the viewport.
    -   **Context Integration**: Instantly view the screenshot within the sidebar context panel.
- **📝 Intelligent Context Capture**: Instantly extract text or code from *any* website you are viewing.
- **🎨 Premium UI/UX**:
    -   **Glassmorphism**: Modern, translucent aesthetics.
    -   **Dark Mode**: Deep indigo/dark theme that respects system settings (toggleable).
    -   **Animations**: Smooth layout transitions, margin animations, and click effects.
- **⚡ Unified Omnibox**: A single smart bar to switch AI providers or navigate to custom URLs.
- **📱 Smart Layout**:
    -   **Collapsible Header**: Maximizes screen real estate for the chat with smooth margin animations.
    -   **Resizable Context Panel**: Drag to resize the bottom panel to view more or less context.
    -   **Floating FABs**: Non-intrusive floating buttons for quick access to tools.
- **🔒 Privacy First**: Runs entirely locally in your browser. No data collection.

## 🛠️ Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/aryanksingh0/ai-sidebar-extension.git
    ```
2.  Open Google Chrome and navigate to `chrome://extensions`.
3.  Enable **Developer Mode** (toggle in the top right corner).
4.  Click **Load Unpacked**.
5.  Select the `ai-sidebar-extension` folder.

## 💡 Usage

### Opening the Sidebar
Click the extension icon in your toolbar to open the side panel.

### Switching Providers
Use the **Omnibox** dropdown at the top to switch between:
-   🟢 **ChatGPT**
-   🔵 **Gemini** (Google)
-   🟠 **Claude** (Anthropic)
-   🌐 **Custom URL** (Enter any website)

### Context Tools
The bottom panel provides powerful tools to grab info from the main page:
1.  **Capture Text**: Grabs the selected text or the entire page text if nothing is selected.
2.  **Screenshot**: 
    -   Click the **Camera** button.
    -   The extension will automatically scroll the main page, capture chunks, and stitch them into a single high-res image.
    -   You can scroll through the preview directly in the sidebar.
3.  **Resize**: Drag the top handle of the context panel to expand the view.

### UI Controls
-   **Theme**: Toggle between Light and Dark mode using the Moon/Sun icon.
-   **Focus Mode**: Click the "Up" chevron to hide the header and purely focus on the chat. The content will slide up to fill the gap.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
Feel free to check the [issues page](https://github.com/aryanksingh0/ai-sidebar-extension/issues).
