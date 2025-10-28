use serde::de::DeserializeOwned;
use tauri::{
    plugin::{PluginApi, PluginHandle},
    AppHandle, Runtime,
};

use crate::models::*;

// initializes the Kotlin plugin classes
pub fn init<R: Runtime, C: DeserializeOwned>(
    _app: &AppHandle<R>,
    api: PluginApi<R, C>,
) -> crate::Result<Quicktile<R>> {
    let handle = api.register_android_plugin("com.plugin.quicktile", "ExamplePlugin")?;
    Ok(Quicktile(handle))
}

/// Access to the quicktile APIs.
pub struct Quicktile<R: Runtime>(PluginHandle<R>);

impl<R: Runtime> Quicktile<R> {
    pub fn ping(&self, payload: PingRequest) -> crate::Result<PingResponse> {
        self.0
            .run_mobile_plugin("ping", payload)
            .map_err(Into::into)
    }

    pub fn show_toast(&self, payload: ToastRequest) -> crate::Result<ToastResponse> {
        self.0
            .run_mobile_plugin("showToast", payload)
            .map_err(Into::into)
    }

    pub fn scan_media_file(
        &self,
        payload: ScanMediaFileRequest,
    ) -> crate::Result<ScanMediaFileResponse> {
        self.0
            .run_mobile_plugin("scanMediaFile", payload)
            .map_err(Into::into)
    }

    pub fn exit(&self) -> crate::Result<()> {
        self.0.run_mobile_plugin("exit", ()).map_err(Into::into)
    }

    pub fn is_foreground(&self) -> crate::Result<bool> {
        self.0
            .run_mobile_plugin::<IsForegroundResponse>("isForeground", ())
            .map(|r| r.is_foreground)
            .map_err(Into::into)
    }
}
