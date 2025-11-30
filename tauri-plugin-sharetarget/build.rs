const COMMANDS: &[&str] = &["ping", "registerListener", "get_initial_share"];

fn main() {
    // Do not build when processed by docs.rs.
    tauri_plugin::Builder::new(COMMANDS)
        .android_path("android")
        .ios_path("ios")
        .build();
}
