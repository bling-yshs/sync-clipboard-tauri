use tauri::{
    Runtime, Manager,
    plugin::{TauriPlugin, Builder},
};
pub use models::*;

#[cfg(desktop)]
mod desktop;
#[cfg(mobile)]
mod mobile;

mod commands;
mod error;
mod models;

pub use error::{Error, Result};

#[cfg(desktop)]
use desktop::ShareTarget;
#[cfg(mobile)]
use mobile::ShareTarget;


/// Extensions to [`tauri::App`], [`tauri::AppHandle`] and [`tauri::Window`] to access the sharetarget APIs.
pub trait ShareTargetExt<R: Runtime> {
    fn sharetarget(&self) -> &ShareTarget<R>;
}

impl<R: Runtime, T: Manager<R>> crate::ShareTargetExt<R> for T {
    /// Get the `ShareTarget` handler.
    fn sharetarget(&self) -> &ShareTarget<R> {
        self.state::<ShareTarget<R>>().inner()
    }
}

/// Initialize the plugin.
pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("sharetarget")
        .invoke_handler(tauri::generate_handler![commands::ping, commands::get_initial_share])
        .setup(|app, api| {
            #[cfg(mobile)]
            let sharetarget = mobile::init(app, api)?;
            #[cfg(desktop)]
            let sharetarget = desktop::init(app, api)?;
            app.manage(sharetarget);
            Ok(())
        })
        .build()
}
