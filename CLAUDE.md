# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Tauri + Vue Android application that syncs clipboard content across devices, working as a companion app to [Jeric-X/SyncClipboard](https://github.com/Jeric-X/SyncClipboard). The app uses Android Quick Tiles for instant clipboard upload/download and supports WebDAV servers.

## Development Commands

### Frontend Development
```bash
pnpm dev                    # Start Vite dev server (port 14200)
pnpm build                  # Build Vue frontend with TypeScript check
pnpm check                  # Run TypeScript check and Biome linter
```

### Android Build
```bash
pnpm android-build          # Build APK for aarch64 target
```

### Tauri Commands
```bash
tauri dev                   # Run app in development mode
tauri android build --apk   # Build Android APK
```

## Architecture

### Hybrid Tauri Application
- **Frontend**: Vue 3 + TypeScript + Vite + TailwindCSS
- **Backend**: Rust (Tauri 2.x)
- **Target Platform**: Android (requires Android System Webview 120+)

### Key Architectural Patterns

#### Deep Link System
The app uses a multi-layered deep link handling system to support Android Quick Tiles:

1. **Cold Start**: `getCurrent()` retrieves URLs when app launches
2. **Hot Start**: `onOpenUrl()` listens for URLs while app is running
3. **Fallback Mechanism**: Polls `deep_link_fallback.json` file every 1 second to handle tile clicks when deep link plugin fails (known Tauri bug workaround)

Deep link URLs trigger navigation to:
- `/upload-clipboard` - Upload clipboard content
- `/download-clipboard` - Download clipboard content

#### Share Target Integration
The app implements Android Share Target functionality via custom `tauri-plugin-sharetarget`:
- `getInitialShare()` - Retrieves share data on app launch
- `listenForShareEvents()` - Listens for incoming share events
- Share data is stored in `sessionStorage` and routes to `/upload-share`

#### Clipboard Data Model
Defined in `src/entities/clipboard-data.ts`, supports four types:
- **Text**: Unicode-encoded text content
- **Image**: Image files with MD5 hash
- **File**: Generic files with MD5 hash
- **Group**: ZIP archives containing multiple files (download only)

The data structure follows SyncClipboard's JSON format with `Type`, `Clipboard`, and `File` fields.

#### Configuration Management
Server config (URL, username, password) is stored as TOML in `clipboard-sync-config.toml` using Tauri's AppData directory. The `useClipboardService` composable provides reactive config management.

### Custom Tauri Plugins

#### tauri-plugin-quicktile
Located in `tauri-plugin-quicktile/`, provides:
- Quick Tile functionality for Android control center
- Toast notifications (`show_toast`)
- Media file scanning (`scan_media_file`)
- App exit control (`exit`)
- Foreground detection (`is_foreground`)

#### tauri-plugin-sharetarget
Located in `tauri-plugin-sharetarget/`, enables Android Share Target API integration for receiving shared files from other apps.

#### Modified clipboard-manager
Located in `plugins-workspace/plugins/clipboard-manager`, contains modified Tauri clipboard plugin source code (included in repo due to custom modifications).

### Frontend Structure

#### Router Configuration (`src/router/router.ts`)
- `/home` - Main landing page
- `/upload-clipboard` - Upload clipboard via Quick Tile
- `/upload-share` - Upload shared files from other apps
- `/download-clipboard` - Download clipboard via Quick Tile
- `/settings` - Server configuration
- `/debug` - Debug console (vConsole integration)

#### Services Layer
`src/services/clipboard-service.ts` provides:
- TOML config persistence
- Unicode encoding/decoding for text content
- WebDAV URL construction
- Composable API via `useClipboardService()`

### Initialization Flow

The app initialization in `src/main.ts` follows this sequence:
1. Wait for app to be in foreground (`isForeground()`)
2. Create Vue app instance
3. Restore vConsole state from localStorage
4. Handle cold start deep links
5. Check fallback deep link file
6. Set up hot start deep link listener
7. Start fallback file polling (1s interval)
8. Mount Vue app
9. Check for initial share data
10. Set up share event listener

### Known Issues

**Deep Link White Screen Bug**: Tauri deep link plugin occasionally causes white screen when navigating to upload page. Workaround: manually kill app from background. This is a known plugin bug with no current fix.

## Development Notes

### Path Aliases
Vite is configured with custom aliases for local plugins:
- `@` → `./src`
- `@tauri-apps/plugin-clipboard-manager` → modified plugin in `plugins-workspace`
- `tauri-plugin-quicktile-api` → `./tauri-plugin-quicktile/guest-js`
- `tauri-plugin-sharetarget-api` → `./tauri-plugin-sharetarget/guest-js`

### TypeScript Configuration
Uses project references with separate configs for app (`tsconfig.app.json`) and Node (`tsconfig.node.json`).

### Linting
Uses Biome for code formatting and linting. Run `pnpm check` to format and lint.

### Auto-Exit Behavior
After upload/download operations, the app automatically exits after a configurable delay (can be set to -1 to disable). This "instant use" pattern is core to the UX design.
