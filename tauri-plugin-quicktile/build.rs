const COMMANDS: &[&str] = &[
    "ping",
    "registerListener",
    "unregister_listener",
    "remove_listener",
    "show_toast",
    "scan_media_file",
    "exit",
    "is_foreground",
];

fn main() {
    tauri_plugin::Builder::new(COMMANDS)
        .android_path("android")
        .ios_path("ios")
        .build();
}
