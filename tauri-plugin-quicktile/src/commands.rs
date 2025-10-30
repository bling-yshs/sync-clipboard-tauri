use tauri::{command, AppHandle, Runtime, Window};

use crate::models::*;
use crate::QuicktileExt;
use crate::Result;

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

#[command]
pub(crate) async fn exit<R: Runtime>(app: AppHandle<R>) -> Result<()> {
    app.quicktile().exit()
}

#[command]
pub(crate) async fn is_foreground<R: Runtime>(app: AppHandle<R>) -> Result<bool> {
    app.quicktile().is_foreground()
}
