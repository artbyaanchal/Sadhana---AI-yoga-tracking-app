# Sadhana - AI Yoga Tracking App

Sadhana is a personalized yoga and meditation wellness app that adapts practices to individual needs. With real-time pose tracking, personalized feedback, progress tracking, guided meditation, and mindfulness, it helps users build a consistent and engaging wellness routine at home.

## What it is

A mobile web prototype of the Sadhana Figma design. Pose tracking runs **in the browser** (MediaPipe Tasks-Vision), so it works with the phone or laptop camera. Voice guidance uses the Web Speech API.

- **On a computer** the link opens the web prototype: the phone in an iPhone frame, with the TV screen appearing beside it when you connect.
- **On a phone** the same link opens the plain full-screen app.
- Add `?app=1` to any link to force the plain app.

## Run locally

```bash
pip install -r requirements.txt
python app.py
```

Open **http://localhost:5011**.

To try it on a phone on the same Wi-Fi, open `http://<your-computer-ip>:5011`. The camera needs HTTPS, so use a hosted link or a tunnel (for example `ngrok http 5011`).

## Deploy

`render.yaml` and `Procfile` are included. On Render: **New > Web Service**, Python 3, build `pip install -r requirements.txt`, start `gunicorn app:app --workers 1 --threads 8 --bind 0.0.0.0:$PORT`. Keep one worker, because the TV and phone sync is held in memory.

## Structure

| File | Purpose |
|---|---|
| `app.py` | Flask server (app, TV sync, model, optional `/legacy`) |
| `templates/index.html` | App shell and splash screen |
| `templates/present.html` | Web view: TV and phone side by side |
| `templates/tv.html` | Full-screen big-screen view |
| `static/js/data.js` | Content, onboarding config, profile store (localStorage) |
| `static/js/components.js` | Widgets: rulers, time wheel, tab bar, countdown |
| `static/js/pose.js` | Voice, pose trackers (yoga, warm-up, meditation, chanting) |
| `static/js/screens.js` | Every screen |
| `static/js/app.js` | Router and splash |
| `static/img/` | Illustrations exported from the Figma file |
| `legacy_tracker.py` | Original desktop-webcam OpenCV tracker (optional, needs `requirements-legacy.txt`) |

Reset the demo any time from **Settings > Reset demo**.
