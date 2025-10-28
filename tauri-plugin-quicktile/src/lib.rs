use tauri::{
    plugin::{Builder, TauriPlugin},
    Manager, Runtime,
};

pub use models::*;

mod commands;
mod error;
mod mobile;
mod models;

pub use error::{Error, Result};
use mobile::Quicktile;

/// Extensions to [`tauri::App`], [`tauri::AppHandle`] and [`tauri::Window`] to access the quicktile APIs.
pub trait QuicktileExt<R: Runtime> {
    fn quicktile(&self) -> &Quicktile<R>;
}

impl<R: Runtime, T: Manager<R>> crate::QuicktileExt<R> for T {
    fn quicktile(&self) -> &Quicktile<R> {
        self.state::<Quicktile<R>>().inner()
    }
}

/// Initializes the plugin.
pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("quicktile")
        .invoke_handler(tauri::generate_handler![
            commands::ping,
            commands::show_toast,
            commands::scan_media_file,
            commands::exit,
            commands::is_foreground
        ])
        .setup(|app, api| {
            let quicktile = mobile::init(app, api)?;
            app.manage(quicktile);
            Ok(())
        })
        .build()
}
