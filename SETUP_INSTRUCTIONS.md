# Setup Instructions

## Favicon Generation

To generate all favicon files from the source logo, run:

```bash
bun run scripts/generate-all-favicons.js
```

This will create all necessary favicon formats in the `public/` directory:
- favicon.ico
- favicon-16x16.png
- favicon-32x32.png
- favicon-48x48.png
- android-chrome-192x192.png
- android-chrome-512x512.png
- apple-touch-icon.png
- safari-pinned-tab.svg
- browserconfig.xml
- site.webmanifest

### What Happens

1. Reads `public/logo-source.jpg`
2. Generates multiple sizes using Sharp (high-quality image processing)
3. Creates platform-specific configuration files
4. Outputs all files to `public/` directory

### Browser Support

The generated favicons work across:
- ✅ Chrome/Edge (all platforms)
- ✅ Firefox (all platforms)
- ✅ Safari (macOS, iOS)
- ✅ Android Chrome
- ✅ Windows (tiles)

### Troubleshooting

**Favicon not showing?**
1. Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. Clear browser cache
3. Check browser console for 404 errors
4. Verify files exist in `public/` directory

**Need to change the logo?**
1. Replace `public/logo-source.jpg` with your new logo (minimum 512x512px)
2. Run `bun run scripts/generate-all-favicons.js` again
3. Hard refresh your browser

## Session Resume & Bookmark Navigation

The app includes advanced session management and bookmark navigation features.

### Session Resume

**Features:**
- Auto-save every 30 seconds
- Exact position restoration
- Timer state preservation
- Answered questions tracking
- Detailed progress feedback

**Usage:**
1. Start practicing questions
2. Exit and save your session
3. Return later and click "Resume Previous"
4. Continue exactly where you left off

### Bookmark Navigation

**Features:**
- Direct navigation to specific questions
- Jump to OSCE topics
- Deep linking support
- Category auto-detection

**Usage:**
1. Bookmark a question or OSCE topic
2. Go to Bookmarks page
3. Click any bookmark
4. Jump directly to that content

For detailed technical documentation, see:
- `SESSION_RESUME_BOOKMARK_GUIDE.md` - Technical implementation details
- `FAVICON_GENERATION.md` - Favicon setup and customization

## Development

### Running the App

```bash
# Development mode
bun run dev

# Production build
bun run build

# Start production server
bun run start
```

### Environment Variables

All Appwrite-related environment variables are managed automatically by the platform. No manual configuration needed.

### Code Quality

```bash
# Lint code
bun run lint

# Format code
bun run format

# Check formatting
bun run format:check
```

## Deployment

The app is configured for automatic deployment. Every commit triggers:
1. TypeScript compilation check
2. Build process
3. Deployment to production

No manual deployment steps required.

## Support

For issues or questions:
1. Check the documentation files in the root directory
2. Review the browser console for errors
3. Check server logs for backend issues
4. Verify environment variables are set correctly
