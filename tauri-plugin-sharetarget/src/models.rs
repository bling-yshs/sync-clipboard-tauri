use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PingRequest {
  pub value: Option<String>,
}

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PingResponse {
  pub value: Option<String>,
}

/// A ShareEvent intent imported from Android. The filename is not implemented, sorry.
#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ShareEvent {
    /// the name of the intent's target file
    pub name: Option<String>,
    /// the streamable uri to the target contents
    pub stream: Option<String>,
    /// the target file's MIME type
    pub content_type: Option<String>,
    /// the complete URI for the Android Intent (with action, type, etc.)
    pub uri: String,
}

/// Response for getInitialShare command (share data or `None` if unavailable)
pub type GetInitialShareResponse = Option<ShareEvent>;
