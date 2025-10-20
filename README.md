# Spinova: Spin the Wheel Web App

> A modern, offline-ready, and fully featured spin-the-wheel application for random selection, games, and more.

---

## 🚩 Features

- **Interactive Spinning Wheel**: Smooth, animated, and visually appealing wheel with up to 50 options.
- **Bulk Add Options**: Paste or type multiple options at once (one per line) for fast setup.
- **Colorful Segments**: Each option is assigned a unique color for easy distinction.
- **Statistics Tracking**: See how many times each option has won, with persistent stats.
- **Save & Load Wheels**: Save multiple wheel configurations and reload them anytime.
- **Bulk Selection & Removal**: Select, deselect, and remove multiple options at once.
- **Responsive UI**: Works beautifully on desktop, tablet, and mobile.
- **Offline Support**: Service worker enables full offline use as a PWA.
- **Modern UX**: Toast notifications, modals, and celebration effects for a professional feel.

---

## �️ How to Use

1. **Open `index.html`** in any modern browser (no installation needed).
2. **Add Options**: Paste or type options (one per line) in the input box, then click "Add Options".
3. **Spin**: Click the "SPIN" button to randomly select a winner.
4. **Manage Options**: Remove, select, or clear options as needed.
5. **Save/Load Wheels**: Use the save/load features to manage different sets of options.
6. **View Stats**: See win counts for each option in the statistics panel.

---

## � Project Structure

```
Spinova/
├── index.html       # Main HTML structure
├── styles.css       # All styling and animations
├── script.js        # Application logic and interactivity
├── sw.js            # Service worker for offline/PWA support
├── manifest.json    # PWA manifest (icons, name, etc.)
└── README.md        # This documentation
```

---

## ⚙️ Customization

- **Colors**: Edit the `colors` array in `script.js` to change wheel segment colors.
- **Styling**: Modify `styles.css` for fonts, colors, layout, and animations.
- **Functionality**: Extend `script.js` to add new features or change behaviors.

---

## 🛡️ Privacy & Data

- All data is stored locally in your browser (no external servers).
- No analytics, tracking, or personal data collection.
- Data is saved in `localStorage` under:
  - `spinWheelSavedWheels` (saved wheels)
  - `spinWheelStatistics` (win stats)

To reset, clear your browser's localStorage for this site.

---

## 🌐 Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+
- Mobile browsers (iOS Safari, Chrome Mobile)

---

## 🛠️ Development & Deployment

### Local Development

1. Download or clone all files.
2. Open in your favorite code editor.
3. For full offline/PWA testing, use a local server:
   - Python: `python -m http.server 8000`
   - Node.js: `npx http-server`
   - PHP: `php -S localhost:8000`
4. Open `http://localhost:8000` in your browser.

### Production

1. Upload all files to any web server (no build process needed).
2. Use HTTPS for best PWA support.

---

## 📱 PWA Features

- Works offline after first load
- Add to home screen on mobile
- Fast loading via service worker caching
- Responsive and touch-friendly

---

## 🎨 Credits & License

- Designed and developed by BrAcKetz
- MIT License (free for personal and commercial use)

---

**Enjoy spinning with Spinova!** 🎡
