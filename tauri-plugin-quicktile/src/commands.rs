use tauri::{AppHandle, command, Runtime};

use crate::models::*;
use crate::Result;
use crate::QuicktileExt;

#[command]
pub(crate) async fn ping<R: Runtime>(
    app: AppHandle<R>,
    payload: PingRequest,
) -> Result<PingResponse> {
    app.quicktile().ping(payload)
}

#[command]
pub(crate) async fn scan_media_file<R: Runtime>(
    app: AppHandle<R>,
    payload: ScanMediaFileRequest,
) -> Result<ScanMediaFileResponse> {
    app.quicktile().scan_media_file(payload)
}

#[command]
pub(crate) async fn show_toast<R: Runtime>(
    app: AppHandle<R>,
    payload: ToastRequest,
) -> Result<ToastResponse> {
    app.quicktile().show_toast(payload)
}


