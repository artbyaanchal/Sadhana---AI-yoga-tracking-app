"""
Original server-side Tree-Pose tracker (desktop webcam only).
Kept for /legacy. The primary app now tracks in the browser - see static/js/pose.js.
"""
import os
import urllib.request
from collections import deque

import cv2
import numpy as np
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision


class PoseSmoother:
    def __init__(self, buffer_size=8):
        self.buffer = deque(maxlen=buffer_size)

    def update(self, value):
        self.buffer.append(value)
        return sum(self.buffer) / len(self.buffer)


smoother = PoseSmoother(buffer_size=8)


def calculate_angle(a, b, c):
    a, b, c = np.array(a), np.array(b), np.array(c)
    radians = np.arctan2(c[1] - b[1], c[0] - b[0]) - np.arctan2(a[1] - b[1], a[0] - b[0])
    angle = np.abs(radians * 180.0 / np.pi)
    return 360 - angle if angle > 180.0 else angle


def calculate_distance(p1, p2):
    return np.sqrt((p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2)


def calculate_tree_pose_score(lm, frame_shape):
    if not lm:
        return 0, {}
    required = [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28]
    if not all(i in lm for i in required):
        return 0, {}
    nose = lm[0]
    lw, rw = lm[15], lm[16]
    ls, rs = lm[11], lm[12]
    le, re = lm[13], lm[14]
    lh, rh = lm[23], lm[24]
    lk, rk = lm[25], lm[26]
    la, ra = lm[27], lm[28]

    shoulder_width = calculate_distance(ls, rs)
    torso = calculate_distance(((ls[0] + rs[0]) / 2, (ls[1] + rs[1]) / 2),
                               ((lh[0] + rh[0]) / 2, (lh[1] + rh[1]) / 2))
    leg_length = calculate_distance(lh, la)
    scale = shoulder_width if shoulder_width > 0 else 1
    scores = {}

    nwd = calculate_distance(lw, rw) / scale
    scores['hands_joined'] = 25 if nwd < 0.3 else (25 * (1 - (nwd - 0.3) / 0.5) if nwd < 0.8 else 0)

    wcy = (lw[1] + rw[1]) / 2
    nh = (nose[1] - wcy) / torso if torso > 0 else 0
    scores['hands_above_head'] = 20 if nh > 0.3 else (20 * ((nh - 0.1) / 0.2) if nh > 0.1 else 0)

    ea = (calculate_angle(ls, le, lw) + calculate_angle(rs, re, rw)) / 2
    scores['arms_straight'] = 20 if ea > 160 else (20 * ((ea - 130) / 30) if ea > 130 else 0)

    ls_ = leg_length if leg_length > 0 else 1
    nld = calculate_distance(la, rk) / ls_
    nrd = calculate_distance(ra, lk) / ls_
    foot = 0
    d = min(nld, nrd)
    if 0.15 < d < 0.6:
        foot = 20
    elif 0.1 < d < 0.7:
        foot = 20 * (1 - abs(d - 0.35) / 0.35)
    scores['foot_on_knee'] = foot

    lla = calculate_angle(lh, lk, la)
    rla = calculate_angle(rh, rk, ra)
    mla = max(lla, rla)
    scores['standing_leg_straight'] = 15 if mla > 160 else (15 * ((mla - 140) / 20) if mla > 140 else 0)

    lb, rb = lla < 140, rla < 140
    cfg = 0
    if lb != rb:
        cfg = 10 if foot > 15 else 5
    scores['leg_configuration'] = cfg

    return min(sum(scores.values()), 100), scores


def _landmarks(result):
    if not result or not result.pose_landmarks:
        return None
    lms = result.pose_landmarks[0] if isinstance(result.pose_landmarks, list) else result.pose_landmarks
    return {i: (l.x, l.y) for i, l in enumerate(lms)}


def _model_path():
    p = os.path.join(os.path.dirname(__file__), "pose_landmarker_lite.task")
    if not os.path.exists(p):
        urllib.request.urlretrieve(
            "https://storage.googleapis.com/mediapipe-models/pose_landmarker/"
            "pose_landmarker_lite/float16/1/pose_landmarker_lite.task", p)
    return p


_detector = None


def _get_detector():
    global _detector
    if _detector is None:
        opts = vision.PoseLandmarkerOptions(
            base_options=python.BaseOptions(model_asset_path=_model_path()),
            running_mode=vision.RunningMode.IMAGE)
        _detector = vision.PoseLandmarker.create_from_options(opts)
    return _detector


def generate_frames():
    detector = _get_detector()
    camera = cv2.VideoCapture(0)
    if not camera.isOpened():
        camera = cv2.VideoCapture(1)
    if not camera.isOpened():
        return
    camera.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
    connections = [(11, 12), (11, 13), (13, 15), (12, 14), (14, 16), (11, 23), (12, 24),
                   (23, 24), (23, 25), (24, 26), (25, 27), (26, 28)]
    while True:
        ok, frame = camera.read()
        if not ok:
            break
        frame = cv2.flip(frame, 1)
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        result = detector.detect(mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb))
        h, w = frame.shape[:2]
        if result and result.pose_landmarks:
            lmd = _landmarks(result)
            raw, _ = calculate_tree_pose_score(lmd, frame.shape)
            score = int(smoother.update(raw))
            color = (0, 255, 0) if score >= 80 else (0, 255, 255) if score >= 60 else (0, 165, 255) if score >= 40 else (0, 0, 255)
            lms = result.pose_landmarks[0] if isinstance(result.pose_landmarks, list) else result.pose_landmarks
            for a, b in connections:
                if a < len(lms) and b < len(lms):
                    cv2.line(frame, (int(lms[a].x * w), int(lms[a].y * h)),
                             (int(lms[b].x * w), int(lms[b].y * h)), color, 2)
            cv2.putText(frame, f"{score}%", (w // 2 - 35, 55),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.9, color, 2, cv2.LINE_AA)
        buf = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 80])[1]
        yield (b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' + buf.tobytes() + b'\r\n')
    camera.release()
