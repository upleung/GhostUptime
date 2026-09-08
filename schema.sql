CREATE TABLE IF NOT EXISTS sites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    base_interval_minutes INTEGER NOT NULL,
    random_window_minutes INTEGER DEFAULT 0,
    next_run_at INTEGER NOT NULL,
    last_run_at INTEGER,
    last_status INTEGER DEFAULT 0,
    last_latency INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_id INTEGER,
    status_code INTEGER,
    response_time INTEGER,
    executed_at INTEGER,
    used_ua TEXT
);