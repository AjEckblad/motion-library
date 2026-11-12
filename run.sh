#!/usr/bin/env bash
# Starts a local server for the Motion Library and opens it in your browser.
cd "$(dirname "$0")"
PORT="${1:-4321}"
# Serve with "Cache-Control: no-store" so the browser never mixes old and new copies of the scripts after an edit.
python3 -c '
import http.server, sys
class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()
    def log_message(self, *a): pass
http.server.ThreadingHTTPServer(("127.0.0.1", int(sys.argv[1])), H).serve_forever()
' "$PORT" >/dev/null 2>&1 &
SERVER=$!
trap 'kill $SERVER 2>/dev/null' EXIT INT TERM
sleep 0.6
open "http://127.0.0.1:$PORT/"
echo "Motion Library running at http://127.0.0.1:$PORT/  (Ctrl+C to stop)"
wait $SERVER
