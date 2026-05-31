use tokio::sync::Mutex;
use tauri::{State, Emitter, WebviewWindow};

struct TimerState {
    handle: Option<tokio::task::JoinHandle<()>>,
}

impl TimerState {
    fn new() -> Self {
        Self { handle: None }
    }
}

#[tauri::command]
async fn start_timer(
    window: WebviewWindow,
    state: State<'_, Mutex<TimerState>>,
) -> Result<(), String> {
    let mut state = state.lock().await;
    if state.handle.is_some() {
        return Ok(()); // Already running
    }

    let window_clone = window.clone();
    let handle = tokio::spawn(async move {
        let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(1));
        loop {
            interval.tick().await;
            let _ = window_clone.emit("timer_tick", ());
        }
    });

    state.handle = Some(handle);
    Ok(())
}

#[tauri::command]
async fn stop_timer(state: State<'_, Mutex<TimerState>>) -> Result<(), String> {
    let mut state = state.lock().await;
    if let Some(handle) = state.handle.take() {
        handle.abort();
    }
    Ok(())
}

#[tauri::command]
async fn minimize_window(_window: WebviewWindow) -> Result<(), String> {
    // 只有在非手机端（即 Windows / Mac / Linux 桌面端）才真正执行最小化
    #[cfg(not(mobile))]
    {
        _window.minimize().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
async fn maximize_window(_window: WebviewWindow) -> Result<(), String> {
    #[cfg(not(mobile))]
    {
        let is_max = _window.is_maximized().map_err(|e| e.to_string())?;
        if is_max {
            _window.unmaximize().map_err(|e| e.to_string())?;
        } else {
            _window.maximize().map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

#[tauri::command]
async fn close_window(_window: WebviewWindow) -> Result<(), String> {
    #[cfg(not(mobile))]
    {
        _window.close().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_notification::init())
    .manage(Mutex::new(TimerState::new()))
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
        minimize_window,
        maximize_window,
        close_window,
        start_timer,
        stop_timer
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
