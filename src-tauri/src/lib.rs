use std::sync::Arc;
use tokio::sync::Mutex;
use tauri::{State, Emitter};

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
    window: tauri::Window,
    state: State<'_, Arc<Mutex<TimerState>>>,
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
async fn stop_timer(state: State<'_, Arc<Mutex<TimerState>>>) -> Result<(), String> {
    let mut state = state.lock().await;
    if let Some(handle) = state.handle.take() {
        handle.abort();
    }
    Ok(())
}

#[tauri::command]
fn minimize_window(window: tauri::Window) {
    window.minimize().unwrap();
}

#[tauri::command]
fn maximize_window(window: tauri::Window) {
    if window.is_maximized().unwrap() {
        window.unmaximize().unwrap();
    } else {
        window.maximize().unwrap();
    }
}

#[tauri::command]
fn close_window(window: tauri::Window) {
    window.close().unwrap();
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_notification::init())
    .manage(Arc::new(Mutex::new(TimerState::new())))
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
