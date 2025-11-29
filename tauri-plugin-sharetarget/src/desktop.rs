use serde::de::DeserializeOwned;
use tauri::{plugin::PluginApi, AppHandle, Runtime};

use crate::models::*;

pub fn init<R: Runtime, C: DeserializeOwned>(
  app: &AppHandle<R>,
  _api: PluginApi<R, C>,
) -> crate::Result<ShareTarget<R>> {
  Ok(ShareTarget(app.clone()))
}

/// Access to the sharetarget APIs.
pub struct ShareTarget<R: Runtime>(AppHandle<R>);

impl<R: Runtime> ShareTarget<R> {
  pub fn ping(&self, payload: PingRequest) -> crate::Result<PingResponse> {
    Ok(PingResponse {
      value: payload.value,
    })
  }

  pub fn get_initial_share(&self) -> crate::Result<GetInitialShareResponse> {
    // Desktop implementation - no share data available on desktop
    Ok(None)
  }
}
