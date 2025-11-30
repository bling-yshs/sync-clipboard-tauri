# Tauri Plugin sharetarget

![NPM Version](https://img.shields.io/npm/v/tauri-plugin-sharetarget-api)
![NPM Downloads](https://img.shields.io/npm/dm/tauri-plugin-sharetarget-api)
[![Documentation](https://docs.rs/tauri-plugin-sharetarget/badge.svg)](https://docs.rs/tauri-plugin-sharetarget)

A plugin for Tauri applications to appear as a share target under Android. Desktop OSes are unsupported (they lack the feature). Behaviour on iOs is indeterminate.

## Installation
In `src-tauri/Cargo.toml` :
``` toml 
[dependencies]
tauri-plugin-sharetarget = "LATEST_VERSION_HERE"
```

In `src-tauri/src/lib.rs`, add the plugin entry :
``` rust 
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sharetarget::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

To build for Android, you must first `tauri android init` successfully. This gets some files
generated. To signal your app as a share target to Android, you then need to modify your
[`AndroidManifest.xml`](https://developer.android.com/guide/topics/manifest/manifest-intro).
In `src-tauri/gen/android/app/src/main/AndroidManifest.xml`, add your `intent-filter`s :
``` xml
<?xml version="1.0" encoding="utf-8">
<manifest ...>
    ...
    <application ...>
        ...
        <activity ...>
            <intent-filter>
                <!-- Support receiving share events. -->
                <action android:name="android.intent.action.SEND" />
                <category android:name="android.intent.category.DEFAULT" />
                <!-- You can scope any MIME type here. You'll see what Intent Android returns. -->
                <data android:mimeType="text/*" />
            </intent-filter>
        </activity ...>
        ...
```

## Permissions
First you need permissions in tauri, just to get ipc events in javascript.
In `src-tauri/capabilities/default.json`, add `sharetarget` to the permissions :
``` json
{
    "$schema": "../gen/schemas/desktop-schema.json",
    "identifier": "anything_you_like",
    "windows": ["main"],
    "permissions": [
        ...
        "sharetarget:default"
    ]
}
```

## Usage
Use the provided API in javascript/typescript. For example in React, in `src/main.tsx` :
``` typescriptreact
import { useEffect, useState } from 'react';
import { listenForShareEvents, type ShareEvent } from 'tauri-plugin-sharetarget-api';
import { PluginListener } from '@tauri-apps/api/core';

function App() {
    const [logs, setLogs] = useState('');
    useEffect(() => {
        let listener: PluginListener;
        const setupListener = async () => {
            listener = await listenForShareEvents((intent: ShareEvent) => {
                setLogs(intent.uri);
            });
        };
        return () => { listener?.unregister(); };
    };
    return (<>
        <h3>Share this</h3>
        <p>{ logs }</p>
        <button onClick={ yourCallbackFunction }>share</button>
    </>);
}
```

### Receive attached stream (images, etc)
To receive shared images, you need
  - an `intent` targeting `image/*`
  - `@tauri-apps/plugin-fs` in `package.json` dependencies to read the sent data
  - `fs:default` in the capabilities of your app
  - in javascript, use `readFile()` from `@tauri-apps/plugin-fs` on the
  intent's `stream`.

Here is the previous example revamped to fetch binary contents. `Upload({ file })`
is not implemented because users may do whatever they like with the `File` object.
This just showcases how to grab the binary data.

``` typescriptreact
import { useEffect, useState } from 'react';
import { listenForShareEvents, type ShareEvent } from 'tauri-plugin-sharetarget-api';
import { PluginListener } from '@tauri-apps/api/core';
import { readFile } from '@tauri-apps/plugin-fs';

function App() {
    const [logs, setLogs] = useState('');
    const [file, setFile] = useState<File>();
    useEffect(() => {
        let listener: PluginListener;
        const setupListener = async () => {
            listener = await listenForShareEvents(async (intent: ShareEvent) => {
                if(event.stream) {
                    const contents = await readFile(intent.stream).catch((error: Error) => {
                        console.warn('fetching shared content failed:');
                        throw error;
                    });
                    setFile(new File([contents], intent.name, { type: intent.content_type }));
                } else {
                    // This intent contains no binary bundle.
                    console.warn('unused share intent', intent.uri);
                }
                setLogs(intent.uri);
            });
        };
        setupListener();
        return () => { listener?.unregister(); };
    };
    return (<>
        <h3>Sharing { intent.name }</h3>
        <Upload file={ file } />
    </>);
}
```

### Caveats
Unfortunately, multiple files in a single share intent are not supported right now. iOs is also
unsupported - I don't have the platform. PRs welcome !

