#!/usr/bin/env python3
"""Draws the exercises as moving figures (SVG), one file per exercise and
stage: assets/uebungen/<id>.svg (the id as in the table of exercises).

The figure is drawn like the user's pictures: flat colours inside a dark ink
line. Skin, brown hair, trousers and shoes, the shirt in the colour of the
area (Kraft orange, Ausdauer green, Beweglichkeit blue, Gelassenheit lilac);
the limbs on the far side are a little darker. It moves the way the exercise
goes, in a loop, so that it can be done together with it (SVG animation, it
plays by itself in the app).

How it works: each exercise is a function that, for a moment t of the loop
(0 to 1), places the joints. Arms and legs are placed by where hand and foot
should be; the elbow and the knee follow from the lengths of the limbs (so a
limb never stretches or shrinks). The loop is sampled at SAMPLES_PER_SECOND
and written as an animation of the lines.

    python3 tools/uebungsbilder.py           all
    python3 tools/uebungsbilder.py kaefer-1   only these

Needs nothing but Python 3. A drawing by the user (a picture in the folder
of a figure, see the table of exercises) always comes before these.
"""

import math
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TARGET = ROOT / "assets" / "uebungen"
W, H = 300, 200          # 3:2
FLOOR = 170
SAMPLES_PER_SECOND = 12

# lengths of the body
TORSO, NECK, HEAD = 50, 15, 10
UPPER_ARM, FOREARM = 25, 25
THIGH, SHIN, FOOT = 37, 35, 9
ARM, LEG = UPPER_ARM + FOREARM, THIGH + SHIN
LIMB = 9                 # line width of body and limbs

NEAR = "#ece2cf"         # ivory, as the text of the app
FAR = "#8f8779"          # the limbs on the far side
MAT = "#203539"
LINE = "#3f5d63"


# --- geometry --------------------------------------------------------------

def at(p, angle, length):
    """The point `length` away from p in direction `angle` (degrees; 0 is to
    the right, 90 downwards, as on the screen)."""
    a = math.radians(angle)
    return (p[0] + length * math.cos(a), p[1] + length * math.sin(a))


def angle_of(a, b):
    return math.degrees(math.atan2(b[1] - a[1], b[0] - a[0]))


def dist(a, b):
    return math.hypot(b[0] - a[0], b[1] - a[1])


def limb(root, end, l1, l2, bend):
    """The middle joint of a limb from root towards end (elbow, knee).
    bend +1 or -1: to which side it bends. If end is out of reach, the limb
    is straight towards it."""
    d = dist(root, end)
    direction = angle_of(root, end)
    d = max(abs(l1 - l2) + 0.5, min(d, l1 + l2 - 0.01))
    a = math.degrees(math.acos((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d)))
    mid = at(root, direction + bend * a, l1)
    return mid, at(mid, angle_of(mid, end), l2)


def reach(root, angle, share, l1, l2, bend):
    """A limb whose end lies in direction `angle`, at `share` of its full length."""
    return limb(root, at(root, angle, share * (l1 + l2)), l1, l2, bend)


def lerp(a, b, s):
    if isinstance(a, tuple):
        return tuple(lerp(x, y, s) for x, y in zip(a, b))
    return a + (b - a) * s


def smooth(s):
    return s * s * (3 - 2 * s)


def track(keys, t):
    """The value at moment t of the loop; keys: [(moment, value), ...] from 0
    to 1, eased in and out between them."""
    for (t0, v0), (t1, v1) in zip(keys, keys[1:]):
        if t0 <= t <= t1:
            return v0 if t1 == t0 else lerp(v0, v1, smooth((t - t0) / (t1 - t0)))
    return keys[-1][1]


def hold(*pairs):
    """Keys from (moment, value) pairs; the loop closes on the first value."""
    keys = list(pairs)
    if keys[0][0] > 0:
        keys.insert(0, (0, keys[-1][1]))
    if keys[-1][0] < 1:
        keys.append((1, keys[0][1]))
    return keys


# --- a figure at one moment ------------------------------------------------
# A frame is a list of strokes, back to front: (name, [points], width, colour),
# and the head: (centre, radius). Every frame of an exercise has the same
# strokes with the same number of points, so they can be animated.

def figure(hip, shoulder, head, arms, legs, spine_bend=0.0):
    """arms, legs: {'far': [points], 'near': [points]}"""
    mid = ((hip[0] + shoulder[0]) / 2, (hip[1] + shoulder[1]) / 2)
    normal = angle_of(hip, shoulder) - 90
    mid = at(mid, normal, spine_bend)
    neck = at(shoulder, angle_of(shoulder, head), NECK - HEAD)
    strokes = [
        ("arm-far", arms["far"], LIMB, FAR),
        ("leg-far", legs["far"], LIMB, FAR),
        ("torso", [hip, mid, shoulder, neck], LIMB + 2, NEAR),
        ("leg-near", legs["near"], LIMB, NEAR),
        ("arm-near", arms["near"], LIMB, NEAR),
    ]
    return {"strokes": strokes, "head": (head, HEAD)}


def leg_to(hip, ankle, bend, foot_angle):
    knee, ankle = limb(hip, ankle, THIGH, SHIN, bend)
    return [hip, knee, ankle, at(ankle, foot_angle, FOOT)]


def arm_to(shoulder, hand, bend):
    elbow, hand = limb(shoulder, hand, UPPER_ARM, FOREARM, bend)
    return [shoulder, elbow, hand]


def arm_dir(shoulder, angle, share, bend):
    elbow, hand = reach(shoulder, angle, share, UPPER_ARM, FOREARM, bend)
    return [shoulder, elbow, hand]


# --- the exercises ---------------------------------------------------------
# Each: (seconds of the loop, function t -> frame, extra SVG behind the figure)

def mat(x0, x1):
    return (f'<rect x="{x0}" y="{FLOOR - 2}" width="{x1 - x0}" height="8" rx="4" fill="{MAT}"/>'
            f'<line x1="14" y1="{FLOOR + 6}" x2="{W - 14}" y2="{FLOOR + 6}" stroke="{LINE}" stroke-width="2" stroke-linecap="round"/>')


# Der halbe Käfer: on the back, head to the left, legs up in a right angle.
SUPINE_HIP = (178, FLOOR - 6)


def supine(t, legs_at, arms_at):
    hip = SUPINE_HIP
    shoulder = at(hip, 180, TORSO)
    head = (shoulder[0] - NECK + 1, FLOOR - HEAD)
    arms = {side: arm_dir(shoulder, *arms_at(side, t)) for side in ("far", "near")}
    legs = {}
    for side in ("far", "near"):
        ankle, foot_angle = legs_at(side, t)
        legs[side] = leg_to(hip, ankle, -1, foot_angle)
    return figure(hip, shoulder, head, arms, legs)


TABLE = (SUPINE_HIP[0] + SHIN, SUPINE_HIP[1] - THIGH)       # ankle with the shins level
TAP = (SUPINE_HIP[0] + 52, FLOOR - 12)                       # foot down, the knee still bent
SLIDE = (SUPINE_HIP[0] + LEG - 4, FLOOR - 12)                # leg long, the heel just above the floor


def alternate(pose_down, pose_up, offset):
    """down and back up, first the near side, then the far side"""
    def keys(side):
        start = 0.08 if side == "near" else 0.58
        return [(0, pose_up), (start, pose_up), (start + 0.17, pose_down), (start + 0.34, pose_up), (1, pose_up)]
    return {side: keys(side) for side in ("near", "far")}


def kaefer(stage):
    down = {1: (TAP, 35), 2: (SLIDE, -60), 3: (SLIDE, -60)}[stage]
    up = (TABLE, -75)
    ankles = alternate(down[0], up[0], 0)
    feet = alternate(down[1], up[1], 0)
    # stage 3: the arm of the other side reaches back over the head at the same time
    arm_up = (-90.0, 1.0, 1)
    arm_back = (-172.0, 1.0, 1)
    arm_side = (2.0, 1.0, 1)
    arms_keys = {
        "near": alternate(arm_back, arm_up, 0)["far"],
        "far": alternate(arm_back, arm_up, 0)["near"],
    }

    def legs_at(side, t):
        return track(ankles[side], t), track(feet[side], t)

    def arms_at(side, t):
        if stage < 3:
            return arm_side
        return track(arms_keys[side], t)

    return 6.0, lambda t: supine(t, legs_at, arms_at), mat(60, 262)


# Vogelhund and Katze-Kuh: on hands and knees, head to the right.
KNEE_Y = FLOOR - 5
QUAD_HIP = (112, KNEE_Y - THIGH)
QUAD_SHOULDER_Y = FLOOR - 3 - ARM


def quad(t, hip_shift=(0, 0), bend=0.0, neck=0.0, arm=None, leg=None):
    hip = (QUAD_HIP[0] + hip_shift[0], QUAD_HIP[1] + hip_shift[1])
    torso_angle = -math.degrees(math.asin((hip[1] - QUAD_SHOULDER_Y) / TORSO))
    shoulder = at(hip, torso_angle, TORSO)
    head = at(shoulder, torso_angle - 18 + neck, NECK)
    hand_floor = (shoulder[0] + 2, FLOOR - 3)
    knee_floor = (QUAD_HIP[0], KNEE_Y)
    arms = {"far": arm_to(shoulder, hand_floor, 1), "near": arm_to(shoulder, hand_floor, 1)}
    legs = {}
    for side in ("far", "near"):
        legs[side] = leg_to(hip, (knee_floor[0] - SHIN, KNEE_Y + 1), -1, 180)
    if arm:
        side, angle, share = arm
        arms[side] = arm_dir(shoulder, angle, share, 1)
    if leg:
        side, angle, share, foot = leg
        knee, ankle = reach(hip, angle, share, THIGH, SHIN, -1 if angle > 90 else 1)
        legs[side] = [hip, knee, ankle, at(ankle, foot, FOOT)]
    return figure(hip, shoulder, head, arms, legs, bend)


LEG_REST = (133.6, 0.705, 180)       # angle, share of the length, foot: knee on the floor


def vogelhund(stage):
    if stage == 1:
        leg_back = (154.0, 0.985, 170)
        keys = {side: alternate(leg_back, LEG_REST, 0)[side] for side in ("near", "far")}

        def frame(t):
            near = track(keys["near"], t)
            far = track(keys["far"], t)
            active = "near" if t < 0.5 else "far"
            values = near if active == "near" else far
            return quad(t, leg=(active, *values))
        return 6.0, frame, mat(40, 230)

    if stage == 2:
        arm_rest = (88.0, 1.0)
        arm_front = (-4.0, 1.0)
        leg_back = (178.0, 1.0, 180)
        legs = alternate(leg_back, LEG_REST, 0)
        arms = alternate(arm_front, arm_rest, 0)

        def frame(t):
            # near arm with far leg, then far arm with near leg
            if t < 0.5:
                arm = ("near", *track(arms["near"], t))
                leg = ("far", *track(legs["near"], t))
            else:
                arm = ("far", *track(arms["far"], t))
                leg = ("near", *track(legs["far"], t))
            return quad(t, arm=arm, leg=leg)
        return 6.0, frame, mat(30, 270)

    # stage 3: stretch long, then elbow and knee meet under the body
    arm_rest = (88.0, 1.0)
    arm_long = (-4.0, 1.0)
    arm_in = (128.0, 0.52)
    leg_long = (178.0, 1.0, 180)
    leg_in = (84.0, 0.5, 150)
    arm_keys = hold((0.05, arm_rest), (0.2, arm_long), (0.42, arm_long), (0.58, arm_in), (0.7, arm_in), (0.85, arm_long), (0.95, arm_rest))
    leg_keys = hold((0.05, LEG_REST), (0.2, leg_long), (0.42, leg_long), (0.58, leg_in), (0.7, leg_in), (0.85, leg_long), (0.95, LEG_REST))

    def frame(t):
        return quad(t, arm=("near", *track(arm_keys, t)), leg=("far", *track(leg_keys, t)))
    return 5.0, frame, mat(30, 270)


def katze_kuh():
    # breathing in: belly down, head up (cow); out: back round, chin in (cat)
    bend = hold((0.1, -9.0), (0.4, -9.0), (0.6, 13.0), (0.9, 13.0))
    neck = hold((0.1, -22.0), (0.4, -22.0), (0.6, 48.0), (0.9, 48.0))

    def frame(t):
        return quad(t, bend=track(bend, t), neck=track(neck, t))
    return 8.0, frame, mat(40, 230)


# Der Seitstütz, seen from the front: forearm on the floor to the left,
# knees (or feet) on the floor to the right; the hips lift into one line.
ELBOW = (92, FLOOR - 5)
PLANK_ARM = 34           # drawn a little longer than the upper arm, so that the lift shows


def side_plank(stage):
    base_end = {1: THIGH, 2: THIGH, 3: LEG}[stage]
    # where the knee (stage 1, 2) or the feet (stage 3) rest, so that the body is a straight line when up
    up_shoulder = at(ELBOW, -90, PLANK_ARM)
    rise = math.degrees(math.asin((ELBOW[1] - up_shoulder[1]) / (TORSO + base_end)))
    end = at(up_shoulder, rise, TORSO + base_end)
    end = (end[0], ELBOW[1])
    def hip_at(lift):
        # the hip between shoulder and the resting point, sagging when they come closer
        shoulder = at(ELBOW, lift, PLANK_ARM)
        hip, _ = limb(end, shoulder, base_end, TORSO, -1)
        return shoulder, hip

    # the low pose: the shoulder tilts towards the knees until the hips rest just above the floor
    low, high = -90.0, -20.0
    for _ in range(40):
        mid_angle = (low + high) / 2
        if hip_at(mid_angle)[1][1] < FLOOR - 9:
            low = mid_angle
        else:
            high = mid_angle
    lift = hold((0.1, low), (0.28, -90.0), (0.72, -90.0), (0.9, low))

    def frame(t):
        shoulder, hip = hip_at(track(lift, t))
        head = at(shoulder, angle_of(hip, shoulder) - 12, NECK)
        forearm = [ELBOW, (ELBOW[0] - 20, ELBOW[1] + 1)]
        lower_arm = [shoulder, ELBOW, forearm[1]]
        top_arm = arm_to(shoulder, at(hip, -95, 7), 1)
        if stage == 3:
            lower = [hip, at(hip, angle_of(hip, end), THIGH), end, at(end, -60, FOOT)]
            upper = leg_to(hip, (end[0] + 8, end[1] - 3), 1, -60)
        else:
            knee = end
            lower = [hip, knee, (knee[0] + 9, knee[1] - 1), (knee[0] + 14, knee[1] - 1)]
            if stage == 1:
                upper = [hip, knee, (knee[0] + 9, knee[1] - 3), (knee[0] + 14, knee[1] - 3)]
            else:
                upper = leg_to(hip, (end[0] + 40, FLOOR - 7), 1, -50)
        return figure(hip, shoulder, head, {"far": lower_arm, "near": top_arm}, {"far": lower, "near": upper})
    return 7.0, frame, mat(50, 262)


# Treppe: walking up, the stairs move down under the figure.
STEP_W, STEP_H = 34, 18
WALK_HIP = (150, 88)


def treppe(stage):
    cycle = {1: 1.8, 2: 1.8, 3: 1.3}[stage]
    front = (WALK_HIP[0] + 16, WALK_HIP[1] + 52)
    back = (front[0] - STEP_W, front[1] + STEP_H)

    def foot(phase):
        """phase 0..1: 0..0.5 standing (moving with the stairs), 0.5..1 swinging up"""
        if phase < 0.5:
            s = phase / 0.5
            return lerp(front, back, s), 0
        s = (phase - 0.5) / 0.5
        p = lerp(back, front, smooth(s))
        return (p[0], p[1] - math.sin(math.pi * s) * 14), 1

    def frame(t):
        shoulder = at(WALK_HIP, -82, TORSO)
        head = at(shoulder, -78, NECK)
        legs = {}
        arms = {}
        for side, shift in (("near", 0.0), ("far", 0.5)):
            p, _ = foot((t + shift) % 1)
            legs[side] = leg_to(WALK_HIP, p, -1, 0)
            swing = math.sin(2 * math.pi * (t + shift))
            arms["far" if side == "near" else "near"] = arm_dir(shoulder, 95 + 22 * swing, 0.96, 1)
        return figure(WALK_HIP, shoulder, head, arms, legs)

    # the stairs: one step every half loop, so they move by two steps in a whole loop
    sole = front[1] + 5
    points = []
    x, y = front[0] - 4 * STEP_W - 8, sole + 4 * STEP_H
    for _ in range(9):
        points += [(x, y), (x, y - STEP_H)]
        x, y = x + STEP_W, y - STEP_H
        points.append((x, y))
    shape = " ".join(f"{px:.0f},{py:.0f}" for px, py in points)
    shape += f" {x:.0f},{FLOOR + 30} {points[0][0]:.0f},{FLOOR + 30}"
    stairs = (f'<g><polygon points="{shape}" fill="{MAT}" stroke="{LINE}" stroke-width="2" stroke-linejoin="round"/>'
              f'<animateTransform attributeName="transform" type="translate" values="0 0;{-STEP_W} {STEP_H}" '
              f'dur="{cycle / 2}s" repeatCount="indefinite"/></g>')
    return cycle, frame, stairs


# Der kniende Ausfallschritt: front foot ahead, back knee on a cushion; the hips sink forward.
BACK_KNEE = (118, FLOOR - 9)
FRONT_ANKLE = (BACK_KNEE[0] + 58, FLOOR - 5)


def ausfallschritt():
    tilt = hold((0.1, -84.0), (0.45, -62.0), (0.75, -62.0), (0.95, -84.0))

    def frame(t):
        hip = at(BACK_KNEE, track(tilt, t), THIGH)
        shoulder = at(hip, -92, TORSO)
        head = at(shoulder, -88, NECK)
        front = leg_to(hip, FRONT_ANKLE, -1, 0)
        back = [hip, BACK_KNEE, (BACK_KNEE[0] - SHIN, FLOOR - 6), (BACK_KNEE[0] - SHIN - FOOT, FLOOR - 4)]
        hands = at(front[1], -100, 6)
        return figure(hip, shoulder, head, {"far": arm_to(shoulder, hands, 1), "near": arm_to(shoulder, hands, 1)},
                      {"far": back, "near": front})
    cushion = f'<rect x="{BACK_KNEE[0] - 16}" y="{FLOOR - 6}" width="32" height="9" rx="4.5" fill="#33545b"/>'
    return 9.0, frame, mat(50, 250) + cushion


# Der Brustöffner, seen from the head end: lying on the side, the shoulders
# one above the other, both arms in front on the floor; the upper arm goes
# over in a big arc to the floor behind the back, the chest and the head follow.
OB_LOWER = (150, FLOOR - 7)
OB_UPPER = (150, FLOOR - 7 - 26)


def brustoeffner():
    front = math.degrees(math.asin((FLOOR - 4 - OB_UPPER[1]) / ARM))     # hand on the floor in front
    behind = -180 - front                                                  # on the floor behind, over the top
    sweep = hold((0.08, front), (0.42, behind), (0.6, behind), (0.92, front))

    def frame(t):
        a = track(sweep, t)
        opened = (front - a) / (front - behind)       # 0 closed, 1 open
        upper = (OB_UPPER[0] - 9 * opened, OB_UPPER[1] + 2 * opened)
        top_arm = arm_dir(upper, a, 1.0, 1)
        bottom_arm = [OB_LOWER, (OB_LOWER[0] + UPPER_ARM, OB_LOWER[1] + 1), (OB_LOWER[0] + ARM, OB_LOWER[1] + 2)]
        head = (OB_LOWER[0] - 16 - 5 * opened, OB_UPPER[1] + 2 - 3 * opened)
        hidden = [OB_LOWER] * 4
        return figure(OB_LOWER, upper, head, {"far": bottom_arm, "near": top_arm}, {"far": hidden, "near": hidden})
    arc_r = ARM
    a0, a1 = math.radians(front), math.radians(180 - front)
    x0, y0 = OB_UPPER[0] + arc_r * math.cos(a0), OB_UPPER[1] + arc_r * math.sin(a0)
    x1, y1 = OB_UPPER[0] + arc_r * math.cos(a1), OB_UPPER[1] + arc_r * math.sin(a1)
    arc = (f'<path d="M {x0:.1f} {y0:.1f} A {arc_r} {arc_r} 0 1 0 {x1:.1f} {y1:.1f}" fill="none" stroke="{LINE}" '
           f'stroke-width="2.5" stroke-dasharray="2 7" stroke-linecap="round"/>')
    return 9.0, frame, mat(70, 230) + arc


# Innehalten: sitting cross-legged (stages 1, 2) or lying (stage 3); the
# breath comes and goes, at the last stage a light wanders from the feet to
# the head.
def innehalten(stage):
    if stage == 3:
        def frame(t):
            hip = (176, FLOOR - 6)
            shoulder = at(hip, 180, TORSO)
            head = (shoulder[0] - NECK + 1, FLOOR - HEAD)
            breath = math.sin(2 * math.pi * t * 4) * 1.5
            arms = {"far": [shoulder, at(shoulder, 10, UPPER_ARM), at(shoulder, 8, ARM)],
                    "near": [shoulder, at(shoulder, 10, UPPER_ARM), at(shoulder, 8, ARM)]}
            legs = {s: [hip, at(hip, 0, THIGH), at(hip, 0, LEG), at(at(hip, 0, LEG), -70, FOOT)] for s in ("far", "near")}
            return figure(hip, shoulder, head, arms, legs, spine_bend=breath)
        # the light: from the toes to the head, over the whole loop
        path = f"M {176 + LEG + 4} {FLOOR - 12} L {176 - TORSO - NECK} {FLOOR - 16}"
        light = (f'<circle r="7" fill="#aaa4e2" opacity="0.55"><animateMotion path="{path}" dur="20s" repeatCount="indefinite"/>'
                 f'<animate attributeName="opacity" values="0.25;0.7;0.25" dur="4s" repeatCount="indefinite"/></circle>')
        return 20.0, frame, mat(60, 268), light

    cycle = 8.0

    def frame(t):
        # in through the nose for a third, out for two thirds
        b = smooth(t / 0.4) if t < 0.4 else 1 - smooth((t - 0.4) / 0.6)
        hip = (150, FLOOR - 16)
        shoulder = (150, hip[1] - TORSO - 2 * b)
        head = (150, shoulder[1] - NECK)
        shoulders = 26
        left = (150 - shoulders / 2, shoulder[1] + 3 - 2 * b)
        right = (150 + shoulders / 2, shoulder[1] + 3 - 2 * b)
        arms = {"far": [left, (left[0] - 12, left[1] + 22), (150 - 34, FLOOR - 16)],
                "near": [right, (right[0] + 12, right[1] + 22), (150 + 34, FLOOR - 16)]}
        legs = {"far": [hip, (150 - 40, FLOOR - 8), (150 + 14, FLOOR - 4), (150 + 22, FLOOR - 5)],
                "near": [hip, (150 + 40, FLOOR - 8), (150 - 14, FLOOR - 4), (150 - 22, FLOOR - 5)]}
        f = figure(hip, shoulder, head, arms, legs)
        f["strokes"].insert(2, ("shoulders", [left, shoulder, right], LIMB, NEAR))
        return f
    glow = (f'<circle cx="150" cy="{FLOOR - 50}" r="52" fill="#aaa4e2" opacity="0.12">'
            f'<animate attributeName="r" values="44;60;60;44" keyTimes="0;0.4;0.45;1" dur="{cycle}s" repeatCount="indefinite"/></circle>')
    return cycle, frame, mat(80, 220), glow


EXERCISES = {
    "kaefer-1": lambda: kaefer(1), "kaefer-2": lambda: kaefer(2), "kaefer-3": lambda: kaefer(3),
    "vogelhund-1": lambda: vogelhund(1), "vogelhund-2": lambda: vogelhund(2), "vogelhund-3": lambda: vogelhund(3),
    "seitstuetz-1": lambda: side_plank(1), "seitstuetz-2": lambda: side_plank(2), "seitstuetz-3": lambda: side_plank(3),
    "treppe-1": lambda: treppe(1), "treppe-2": lambda: treppe(2), "treppe-3": lambda: treppe(3),
    "katze-kuh-1": katze_kuh, "ausfallschritt-1": ausfallschritt, "brustoeffner-1": brustoeffner,
    "innehalten-1": lambda: innehalten(1), "innehalten-2": lambda: innehalten(2), "innehalten-3": lambda: innehalten(3),
}


# --- drawing the figure ------------------------------------------------------
# The figure is drawn like the user's pictures: flat colours with a dark ink
# line around them. Every part of the body (thigh, shin, shoe, sleeve, forearm
# with hand, hips, chest, neck, head) is a fixed shape that is moved and turned
# from moment to moment; the joints come from the poses above. Each layer
# (the far limbs, the body, the head, the near leg, the near arm) is drawn in
# two passes, first all its ink outlines, then its colours, so that within a
# layer the parts join without lines between them.

INK = "#10181a"
INK_WIDTH = 2.2
SKIN = "#e9c9a3"
HAIR = "#6d4a34"
TROUSERS = "#55717a"
SHOES = "#8a6f5a"
SHIRTS = {"kraft": "#f08a3e", "ausdauer": "#a8c48a", "beweglichkeit": "#74b5c4", "gelassenheit": "#aaa4e2"}
AREAS = {"kaefer": "kraft", "vogelhund": "kraft", "seitstuetz": "kraft", "treppe": "ausdauer",
         "katze-kuh": "beweglichkeit", "ausfallschritt": "beweglichkeit", "brustoeffner": "beweglichkeit",
         "innehalten": "gelassenheit"}
# how the face is seen: from the side (the face towards the chest side), from the
# front, or the top of the head only; closed eyes for the quiet exercises
FACES = {"seitstuetz": ("front", False), "innehalten-1": ("front", True), "innehalten-2": ("front", True),
         "innehalten-3": ("side", True), "brustoeffner": ("top", False)}


def darker(colour, share=0.7):
    r, g, b = (int(colour[i:i + 2], 16) for i in (1, 3, 5))
    return "#%02x%02x%02x" % tuple(round(c * share) for c in (r, g, b))


def capsule(length, w0, w1, x0=0.0):
    """A limb from x0 to length along the x axis, w0 wide at its start and w1 at its end, round at both ends."""
    a, b = w0 / 2, w1 / 2
    return (f"M {x0:.1f} {-a:.1f} L {length:.1f} {-b:.1f} A {b:.1f} {b:.1f} 0 0 1 {length:.1f} {b:.1f} "
            f"L {x0:.1f} {a:.1f} A {a:.1f} {a:.1f} 0 0 1 {x0:.1f} {-a:.1f} Z")


def shapes(kind, length, colours):
    """[(path, colour)] of a part of the body, from (0, 0) to (length, 0)."""
    shirt, trousers, skin, shoes = colours
    if kind == "thigh":
        return [(capsule(length, 15, 11.5), trousers)]
    if kind == "shin":
        return [(capsule(length, 11.5, 8.5), trousers)]
    if kind == "foot":
        return [(f"M -3 -4 H {length + 1:.1f} A 4 4 0 0 1 {length + 1:.1f} 4 H -3 A 4 4 0 0 1 -3 -4 Z", shoes)]
    if kind == "upper":
        return [(capsule(length, 10.5, 9), shirt)]
    if kind == "fore":
        hand = f"M {length - 4.6:.1f} 0 A 4.6 4.6 0 1 0 {length + 4.6:.1f} 0 A 4.6 4.6 0 1 0 {length - 4.6:.1f} 0 Z"
        return [(capsule(length, 8.5, 7), skin), (hand, skin)]
    if kind == "pelvis":
        return [(capsule(length, 16, 14.5), shirt), (capsule(length * 0.55, 16, 15), trousers)]
    if kind == "chest":
        return [(capsule(length, 14.5, 17), shirt)]
    if kind == "bar":
        return [(capsule(length, 13, 11), shirt)]
    if kind == "neck":
        return [(capsule(length, 7, 7), skin)]
    raise ValueError(kind)


def head_shapes(face, closed, skin, hair):
    """[(svg, colour or None)] of the head, centred on (0, 0); x points to the
    crown, y to the side of the face. The ink outline comes separately."""
    mode, sign = (face, 1) if isinstance(face, str) else face
    if mode == "top":
        return [(f'<circle r="{HEAD}" fill="{hair}"/>', None),
                (f'<path d="M -6 -1 Q 0 2 6 -1" fill="none" stroke="{darker(hair, 0.75)}" stroke-width="1.4" stroke-linecap="round"/>', None)]
    if mode == "front":
        eyes = []
        for side in (-1, 1):
            if closed:
                eyes.append(f'<path d="M -1.2 {side * 3.6 - 1.8:.1f} Q -2.6 {side * 3.6:.1f} -1.2 {side * 3.6 + 1.8:.1f}" fill="none" stroke="{INK}" stroke-width="1.1" stroke-linecap="round"/>')
            else:
                eyes.append(f'<circle cx="-0.8" cy="{side * 3.6:.1f}" r="1.25" fill="{INK}"/>')
        return [(f'<circle cx="1.6" cy="0" r="{HEAD}" fill="{hair}"/>', None),
                (f'<circle cx="-1.4" cy="0" r="{HEAD - 1.4}" fill="{skin}"/>', None)] + [(e, None) for e in eyes]
    # from the side: hair over the back and the crown, one eye towards the face
    y = 1  # the face lies towards +y in the head's own direction
    eye = (f'<path d="M 0.6 {y * 4.2:.1f} q 1.4 {y * 1.2:.1f} 2.8 0" fill="none" stroke="{INK}" stroke-width="1.1" stroke-linecap="round"/>'
           if closed else f'<circle cx="1.6" cy="{y * 5.2:.1f}" r="1.3" fill="{INK}"/>')
    return [(f'<circle cx="1.2" cy="{-y * 1.8:.1f}" r="{HEAD}" fill="{hair}"/>', None),
            (f'<circle cx="-0.9" cy="{y * 1.6:.1f}" r="{HEAD - 2}" fill="{skin}"/>', None),
            (eye, None)]


# the parts of the figure, by the strokes of a frame: (stroke, from, to, kind)
PARTS = {
    "far": [("arm-far", 0, 1, "upper"), ("arm-far", 1, 2, "fore"),
            ("leg-far", 0, 1, "thigh"), ("leg-far", 1, 2, "shin"), ("leg-far", 2, 3, "foot")],
    "body": [("shoulders", 0, 1, "bar"), ("shoulders", 1, 2, "bar"),
             ("torso", 0, 1, "pelvis"), ("torso", 1, 2, "chest"), ("neck", 0, 1, "neck")],
    "leg-near": [("leg-near", 0, 1, "thigh"), ("leg-near", 1, 2, "shin"), ("leg-near", 2, 3, "foot")],
    "arm-near": [("arm-near", 0, 1, "upper"), ("arm-near", 1, 2, "fore")],
}
LAYERS = ["far", "body", "head", "leg-near", "arm-near"]


def lines_of(frame):
    lines = {name: points for name, points, _, _ in frame["strokes"]}
    torso = lines["torso"]
    lines["neck"] = [torso[2], frame["head"][0]]
    return lines


def unwrap(angles):
    out = [angles[0]]
    for a in angles[1:]:
        while a - out[-1] > 180:
            a -= 360
        while a - out[-1] < -180:
            a += 360
        out.append(a)
    return out


def moving(seconds, xs, ys, angles, scales=None):
    """The animations that place a part: moved to (x, y), turned by angle, maybe stretched."""
    anim = f'dur="{seconds}s" repeatCount="indefinite"'
    out = (f'<animateTransform attributeName="transform" type="translate" values="'
           + ";".join(f"{x:.1f} {y:.1f}" for x, y in zip(xs, ys)) + f'" {anim}/>'
           + f'<animateTransform attributeName="transform" type="rotate" values="'
           + ";".join(f"{a:.1f}" for a in angles) + f'" additive="sum" {anim}/>')
    if scales:
        out += (f'<animateTransform attributeName="transform" type="scale" values="'
                + ";".join(f"{k:.3f} 1" for k in scales) + f'" additive="sum" {anim}/>')
    return out


def figure_svg(name, seconds, frames):
    key = name.rsplit("-", 1)[0]
    area = AREAS[key]
    face = FACES.get(name) or FACES.get(key) or ("side", False)
    mode, closed = face
    near = (SHIRTS[area], TROUSERS, SKIN, SHOES)
    far = tuple(darker(c) for c in near)
    lines = [lines_of(f) for f in frames]
    out = []
    for layer in LAYERS:
        if layer == "head":
            centres = [f["head"][0] for f in frames]
            necks = [l["torso"][2] for l in lines]
            angles = unwrap([angle_of(n, c) for n, c in zip(necks, centres)])
            if mode == "front":
                angles = [-90.0] * len(angles)      # facing the viewer, the crown up
            # the face towards the chest side when lying on the back or kneeling: flip if needed
            flip = ' transform="scale(1 -1)"' if mode == "side" and FLIP.get(key) else ""
            placed = moving(seconds, [c[0] for c in centres], [c[1] for c in centres], angles)
            parts = "".join(svg_part for svg_part, _ in head_shapes((mode, 1), closed, SKIN, HAIR))
            out.append(f'<g>{placed}<circle r="{HEAD + INK_WIDTH}" fill="{INK}"/><g{flip}>{parts}</g></g>')
            continue
        colours = far if layer == "far" else near
        inks, fills = [], []
        for stroke, i, j, kind in PARTS[layer]:
            if stroke not in lines[0]:
                continue
            starts = [l[stroke][i] for l in lines]
            ends = [l[stroke][j] for l in lines]
            lengths = [dist(a, b) for a, b in zip(starts, ends)]
            if max(lengths) < 0.5:
                continue                             # a part that is not seen from here
            base = max(lengths)
            angles = unwrap([angle_of(a, b) for a, b in zip(starts, ends)])
            scales = [l / base for l in lengths] if max(lengths) - min(lengths) > 0.8 else None
            placed = moving(seconds, [a[0] for a in starts], [a[1] for a in starts], angles, scales)
            for path, colour in shapes(kind, base, colours):
                inks.append(f'<g>{placed}<path d="{path}" fill="{INK}" stroke="{INK}" stroke-width="{2 * INK_WIDTH}" stroke-linejoin="round"/></g>')
                fills.append(f'<g>{placed}<path d="{path}" fill="{colour}"/></g>')
        out += inks + fills
    return out


# lying on the back or kneeling, the face looks the other way round than the head's direction suggests
FLIP = {}


def view_of(frames, least_width=190, pad=20):
    """The part of the drawing to show: the figure in all its moments, close
    up, standing on the floor at the bottom, in 3:2."""
    xs, ys = [], []
    for f in frames:
        for _, points, _, _ in f["strokes"]:
            xs += [x for x, _ in points]
            ys += [y for _, y in points]
        (cx, cy), r = f["head"]
        xs += [cx - r, cx + r]
        ys += [cy - r, cy + r]
    x0, x1 = min(xs) - pad, max(xs) + pad
    bottom = FLOOR + 12
    width = max(x1 - x0, least_width, (bottom - (min(ys) - pad)) * 1.5)
    height = width / 1.5
    left = (x0 + x1) / 2 - width / 2
    return left, bottom - height, width, height


MAX_SAMPLES = 120        # long, slow loops (the body scan) need fewer moments a second


def svg(name, seconds, frame, behind="", front=""):
    n = max(2, min(MAX_SAMPLES, round(seconds * SAMPLES_PER_SECOND)))
    frames = [frame(i / n) for i in range(n)] + [frame(0)]
    x, y, w, h = view_of(frames)
    out = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x:.0f} {y:.0f} {w:.0f} {h:.0f}" width="600" height="400">', behind]
    out += figure_svg(name, seconds, frames)
    out.append(front)
    out.append("</svg>")
    return "\n".join(part for part in out if part) + "\n"


def main(names):
    TARGET.mkdir(parents=True, exist_ok=True)
    for name in names or EXERCISES:
        made = EXERCISES[name]()
        seconds, frame, behind = made[:3]
        front = made[3] if len(made) > 3 else ""
        path = TARGET / f"{name}.svg"
        path.write_text(svg(name, seconds, frame, behind, front), encoding="utf-8")
        print(path.relative_to(ROOT), f"{path.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main(sys.argv[1:])
