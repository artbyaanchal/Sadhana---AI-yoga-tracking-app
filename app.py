"""
Sadhana - Yoga app prototype
============================

Flask serves a single-page mobile web app (works on Android Chrome + iPhone Safari).

Pose tracking now runs *client side* (MediaPipe Tasks-Vision in the browser) so it
works with the phone camera. The original server-side OpenCV Tree-Pose tracker is
kept as a fallback at /legacy (desktop webcam only).
"""

import json
import os
import re
import time

from flask import Flask, render_template, send_from_directory, Response, request, jsonify

app = Flask(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))


@app.context_processor
def _asset_version():
    # newest mtime under static/ — busts the browser cache whenever a file changes
    latest = 0
    for root, _dirs, files in os.walk(os.path.join(BASE_DIR, "static")):
        for f in files:
            try:
                latest = max(latest, int(os.path.getmtime(os.path.join(root, f))))
            except OSError:
                pass
    return {"ASSET_V": latest or int(time.time())}


# --------------------------------------------------------------------------- #
#  Sadhana single-page app
# --------------------------------------------------------------------------- #
MOBILE_UA = re.compile(r"Android|iPhone|iPad|iPod|Mobile", re.I)


@app.route("/")
def index():
    """One link for everything.

    - on a computer  -> the web prototype: TV + phone side by side (present.html)
    - on a real phone -> the plain full-screen app (index.html)
    - ?tv=1 (the phone frame's own iframe), ?app=1 or ?demo=<screen> -> always the app
    """
    ua = request.headers.get("User-Agent", "")
    wants_app = (request.args.get("tv") == "1" or request.args.get("app") == "1"
                 or request.args.get("demo"))
    if not wants_app and not MOBILE_UA.search(ua):
        return render_template("present.html")
    return render_template("index.html")


# --------------------------------------------------------------------------- #
#  TV / phone session relay  — the phone POSTs its session state, the TV
#  screen GETs it and mirrors the current animation / name / timers.
#  (in-memory, single session — this is a presentation prototype)
# --------------------------------------------------------------------------- #
SESSION_STATE = {"v": 0, "state": {"mode": "idle"}, "ts": time.time()}


@app.route("/tv")
def tv_screen():
    return render_template("tv.html")


@app.route("/present")
def present_screen():
    """Single page: the TV mirror on top, the phone app (iframe) below."""
    return render_template("present.html")


@app.route("/session/state", methods=["GET", "POST"])
def session_state():
    global SESSION_STATE
    if request.method == "POST":
        data = request.get_json(silent=True) or {}
        SESSION_STATE = {"v": SESSION_STATE["v"] + 1, "state": data, "ts": time.time()}
        return jsonify(ok=True, v=SESSION_STATE["v"])
    # GET — the TV polls this
    return jsonify(SESSION_STATE)


@app.route("/models/<path:filename>")
def models(filename):
    """Serve the MediaPipe pose model to the browser."""
    resp = send_from_directory(os.path.join(BASE_DIR, "static", "models"), filename)
    resp.headers["Cross-Origin-Resource-Policy"] = "cross-origin"
    return resp


@app.after_request
def add_headers(resp):
    # MediaPipe wasm threads need these; harmless for the rest of the app.
    resp.headers.setdefault("Cross-Origin-Opener-Policy", "same-origin")
    resp.headers.setdefault("Cross-Origin-Embedder-Policy", "credentialless")
    if request.path.startswith("/static/"):
        resp.headers["Cache-Control"] = "no-store, must-revalidate"
    return resp


# --------------------------------------------------------------------------- #
#  Legacy server-side Tree-Pose tracker (desktop webcam) - optional
# --------------------------------------------------------------------------- #
@app.route("/legacy")
def legacy():
    return render_template("tracker_legacy.html")


@app.route("/video_feed")
def video_feed():
    try:
        from legacy_tracker import generate_frames
    except Exception:
        return Response("Legacy tracker unavailable on this machine.", status=503)
    return Response(generate_frames(),
                    mimetype="multipart/x-mixed-replace; boundary=frame")


if __name__ == "__main__":
    # host=0.0.0.0 so you can open it from your phone on the same Wi-Fi:
    #   http://<your-computer-ip>:5005
    # hosts (Render, Railway...) set PORT and run gunicorn instead - see render.yaml.
    # Locally: debug + auto-reload on 5011.
    port = int(os.environ.get("PORT", 5011))
    app.run(debug=not os.environ.get("PORT"), host="0.0.0.0", port=port)
