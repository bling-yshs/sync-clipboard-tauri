use tauri::{AppHandle, command, Runtime};

use crate::models::*;
use crate::Result;
use crate::ShareTargetExt;

#[command]
pub(crate) async fn ping<R: Runtime>(
    app: AppHandle<R>,
    payload: PingRequest,
) -> Result<PingResponse> {
    app.sharetarget().ping(payload)
}

#[command]
pub(crate) async fn get_initial_share<R: Runtime>(app: AppHandle<R>) -> Result<GetInitialShareResponse> {
    app.sharetarget().get_initial_share()
}
