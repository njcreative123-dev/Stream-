#!/bin/bash
set -e
echo "=== MovieBox API Setup ==="
pip3 install fastapi uvicorn
if ! command -v moviebox-tui &>/dev/null; then
    echo "Installing MovieBox TUI..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y 2>/dev/null
    export PATH="$HOME/.cargo/bin:$PATH"
    cargo install moviebox-tui --locked 2>/dev/null || echo "TUI install skipped"
fi
nohup python3 moviebox_api.py > moviebox.log 2>&1 &
echo "MovieBox API started on :5000 (PID $!)"
