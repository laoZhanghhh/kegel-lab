use tauri::WebviewWindow;

#[tauri::command]
async fn minimize_window(_window: WebviewWindow) -> Result<(), String> {
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
        .invoke_handler(tauri::generate_handler![
            minimize_window,
            maximize_window,
            close_window
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}