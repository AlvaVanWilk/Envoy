#!/usr/bin/env python3
"""Draws the exercises as moving figures (SVG), one file per exercise and
stage: assets/uebungen/<id>.svg (the id as in the table of exercises).

The figure is drawn like the user's pictures: flat colours inside a dark ink
line. Skin, brown hair, trousers and shoes, the shirt in the colour of the
area (Kraft orange, Ausdauer green, Beweglichkeit blue, Gelassenheit lilac);
the limbs on the far side are a little darker. The head has no face, only the
hair shows which way it is turned. It moves the way the exercise goes, in a
loop, so that it can be done together with it (SVG animation, it plays by
itself in the app).

How it works: each exercise is a function that, for a moment t of the loop
(0 to 1), places the joints. Arms and legs are placed by where hand and foot
should be; the elbow and the knee follow from the lengths of the limbs (so a
limb never stretches or shrinks). Most exercises are seen from the side; the
side plank and the Brustoeffner are placed in space and seen from the front
and from the head end (see Camera). The loop is sampled at SAMPLES_PER_SECOND
and written as an animation of the parts of the body.

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
TORSO, NECK, HEAD = 50, 25, 10      # NECK: from the shoulders to the middle of the head
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
# the head: (centre, radius), and where the hair lies on it (see hair_of).
# Every frame of an exercise has the same strokes with the same number of
# points, so they can be animated.

def figure(hip, shoulder, head, arms, legs, spine_bend=0.0, facing_us=False):
    """arms, legs: {'far': [points], 'near': [points]}. Seen from the side the
    face looks the way the chest does; facing_us: it looks at the viewer."""
    mid = ((hip[0] + shoulder[0]) / 2, (hip[1] + shoulder[1]) / 2)
    normal = angle_of(hip, shoulder) - 90
    mid = at(mid, normal, spine_bend)
    strokes = [
        ("arm-far", arms["far"], LIMB, FAR),
        ("leg-far", legs["far"], LIMB, FAR),
        ("torso", [hip, mid, shoulder], LIMB + 2, NEAR),
        ("leg-near", legs["near"], LIMB, NEAR),
        ("arm-near", arms["near"], LIMB, NEAR),
    ]
    crown = unit((head[0] - shoulder[0], head[1] - shoulder[1]))
    face = (0.0, 0.0) if facing_us else (-crown[1], crown[0])
    return {"strokes": strokes, "head": (head, HEAD), "hair": hair_of(crown, face, 0.0, 1.0 if facing_us else 0.0)}


def unit(v):
    length = math.hypot(*v) or 1.0
    return tuple(c / length for c in v)


# The head is a circle of skin with the hair on it: a second circle, cut to
# the head and pushed towards the crown and the back of the head. Seen from
# the side it leaves the face free, from the front the face below the
# forehead, from behind or from above it covers nearly all.
def hair_of(crown, face, crown_near, face_near):
    """(dx, dy, radius) of the hair circle in the head. crown, face: the
    directions of the crown and the face on the picture (shorter, the more
    they point towards the viewer); *_near: how much they do (-1 to 1)."""
    ax, ay = 0.8 * crown[0] - 0.6 * face[0], 0.8 * crown[1] - 0.6 * face[1]
    near = 0.8 * crown_near - 0.6 * face_near
    shift = HEAD * (0.8 - 0.5 * near)
    dx, dy = unit((ax, ay))
    return (shift * dx, shift * dy, HEAD * (1 + 0.4 * max(near, 0.0)))


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


# --- seen at an angle -------------------------------------------------------
# The side plank and the Brustoeffner cannot be seen from the side. Their
# joints are placed in space: x along the floor, y up, z towards the viewer
# (from where the camera stands). A camera seen from a little above turns
# them into points of the picture; what points towards the viewer gets
# shorter, as in a photo.

def add(a, b):
    return tuple(x + y for x, y in zip(a, b))


def sub(a, b):
    return tuple(x - y for x, y in zip(a, b))


def mul(a, k):
    return tuple(x * k for x in a)


def dot(a, b):
    return sum(x * y for x, y in zip(a, b))


def norm(a):
    return mul(a, 1 / (math.sqrt(dot(a, a)) or 1.0))


class Camera:
    """yaw: from where it looks, turned around the upright (0: from the front,
    90: from the left, where the head of a figure lying to the left is);
    pitch: how far from above. origin: where the point (0, 0, 0) lies on the
    picture."""

    def __init__(self, yaw, pitch, origin):
        y, p = math.radians(yaw), math.radians(pitch)
        self.right = (math.cos(y), 0.0, math.sin(y))
        self.up = (math.sin(y) * math.sin(p), math.cos(p), -math.cos(y) * math.sin(p))
        self.toward = (-math.sin(y) * math.cos(p), math.sin(p), math.cos(y) * math.cos(p))
        self.origin = origin

    def __call__(self, point):
        return (self.origin[0] + dot(point, self.right), self.origin[1] - dot(point, self.up))

    def direction(self, v):
        """a direction on the picture, and how much it points towards the viewer"""
        return (dot(v, self.right), -dot(v, self.up)), dot(v, self.toward)

    def floor(self, x0, x1, z0, z1):
        """a mat on the floor, seen from the camera, its front edge as the floor line"""
        corners = [self((x, 0, z)) for x, z in ((x0, z1), (x1, z1), (x1, z0), (x0, z0))]
        points = " ".join(f"{x:.1f},{y:.1f}" for x, y in corners)
        (ax, ay), (bx, by) = corners[0], corners[1]
        return (f'<polygon points="{points}" fill="{MAT}" stroke="{MAT}" stroke-width="6" stroke-linejoin="round"/>'
                f'<line x1="{ax:.1f}" y1="{ay + 4:.1f}" x2="{bx:.1f}" y2="{by + 4:.1f}" stroke="{LINE}" stroke-width="2" stroke-linecap="round"/>')


def planar_limb(root, end, l1, l2, bend):
    """limb() for points in space whose limb lies in an upright plane along x"""
    mid, tip = limb((root[0], root[1]), (end[0], end[1]), l1, l2, bend)
    share = l1 / (l1 + l2)
    return (mid[0], mid[1], root[2] + (end[2] - root[2]) * share), (tip[0], tip[1], end[2])


SHOULDERS, HIPS = 20, 15      # how far apart the shoulders and the hips are
SLAB = 10                     # the thickness of the body around them


def spatial(view, parts, head, crown, face):
    """A frame from points in space. parts: {stroke name: [points]}, among
    them 'shoulders' and 'hips' (lower one, upper one) for the body."""
    sb, st = parts.pop("shoulders")
    hb, ht = parts.pop("hips")
    wb, wt = lerp(sb, hb, 0.62), lerp(st, ht, 0.62)
    centre = lerp(sb, st, 0.5)
    strokes = [(name, [view(q) for q in points], LIMB, NEAR) for name, points in parts.items()]
    strokes.append(("neck", [view(centre), view(head)], LIMB, NEAR))
    slabs = [("trousers", [view(q) for q in (wb, wt, ht, hb)]), ("shirt", [view(q) for q in (sb, st, wt, wb)])]
    (cx, cy), crown_near = view.direction(crown)
    (fx, fy), face_near = view.direction(face)
    return {"strokes": strokes, "slabs": slabs, "head": (view(head), HEAD),
            "hair": hair_of((cx, cy), (fx, fy), crown_near, face_near)}


# Der Seitstütz, seen from the front and a little from above: lying on the
# side, the head to the left, propped up on the forearm, the elbow under the
# shoulder. The hips lift until the body is one line from the head to the
# knees (stages 1 and 2) or to the feet (stage 3), and come down again.
PLANK = Camera(yaw=0, pitch=16, origin=(0, FLOOR))
PLANK_ELBOW = (96, 4)          # x, height above the floor
PLANK_REST = 6                 # height of a knee, a foot or the hip lying on the floor
PLANK_PROP = UPPER_ARM + 5     # from the elbow to the lower shoulder: the arm and the shoulder itself


def side_plank(stage):
    reach_to = LEG if stage == 3 else THIGH          # from the hip to where the legs rest
    ex, ey = PLANK_ELBOW
    upright = (ex, ey + PLANK_PROP)
    rest = (upright[0] + math.sqrt((TORSO + reach_to) ** 2 - (upright[1] - PLANK_REST) ** 2), PLANK_REST)

    def bottom_line(tilt):
        """the lower shoulder and hip, the upper arm tilted towards the feet by tilt degrees"""
        a = math.radians(90 - tilt)
        shoulder = (ex + PLANK_PROP * math.cos(a), ey + PLANK_PROP * math.sin(a))
        hip, _ = limb(rest, shoulder, reach_to, TORSO, 1)
        return shoulder, hip

    # the low pose: the upper arm tilts until the hip lies on the floor
    low, high = 0.0, 60.0
    for _ in range(40):
        tilt = (low + high) / 2
        if bottom_line(tilt)[1][1] > PLANK_REST + 2:
            low = tilt
        else:
            high = tilt
    lift = hold((0.1, high), (0.3, 0.0), (0.72, 0.0), (0.9, high))

    def upper_points(tilt):
        shoulder, hip = bottom_line(tilt)
        along = norm(sub(hip, shoulder))
        legs = norm(sub(rest, hip))
        up_body = (-along[1], along[0])
        up_hips = norm(add(up_body, (-legs[1], legs[0])))
        return shoulder, hip, along, up_body, up_hips

    # where the upper leg rests: on the lower knee (stages 1, 2: on the lower foot at stage 3)
    _, hip0, _, _, up0 = upper_points(0.0)
    top_hip0 = add(hip0, mul(up0, HIPS))
    if stage == 2:
        reach_floor = math.sqrt(LEG ** 2 - (top_hip0[1] - PLANK_REST) ** 2 - 14 ** 2) - 1.5
        top_rest = (top_hip0[0] + reach_floor, PLANK_REST, 14.0)
    else:
        top_rest = (rest[0] + up0[0] * 9, rest[1] + up0[1] * 9, 0.0)

    def frame(t):
        shoulder, hip, along, up_body, up_hips = upper_points(track(lift, t))
        sb = (*shoulder, 0.0)
        st = (*add(shoulder, mul(up_body, SHOULDERS)), 0.0)
        hb = (*hip, 0.0)
        ht = (*add(hip, mul(up_hips, HIPS)), 0.0)
        centre = lerp(sb, st, 0.5)
        head = add(centre, (-along[0] * NECK, -along[1] * NECK, 0.0))
        elbow = (ex, ey, 0.0)
        hand = add(elbow, mul(norm((-0.55, 0.0, 0.85)), FOREARM))
        # the upper hand rests on the hip, the arm along the body
        on_hip = add(lerp(st, ht, 0.92), (0.0, 2.0, 2.0))
        top_elbow, top_hand = planar_limb(st, on_hip, UPPER_ARM, FOREARM, 1)
        knee = (*rest, 0.0)
        if stage == 3:
            low_leg = [hb, lerp(hb, knee, THIGH / LEG), knee, add(knee, (2.0, -1.0, FOOT))]
            k, a_ = planar_limb(ht, top_rest, THIGH, SHIN, 1)
            top_leg = [ht, k, a_, add(a_, (2.0, 0.0, FOOT))]
        else:
            back = norm((0.25, 0.0, -1.0))          # the shins go back, away from the viewer
            shin_end = add(knee, mul(back, SHIN))
            low_leg = [hb, knee, shin_end, add(shin_end, mul(back, FOOT))]
            if stage == 1:
                top_knee = add(ht, mul(norm(sub(top_rest, ht)), THIGH))
                top_shin = add(top_knee, mul(back, SHIN))
                top_leg = [ht, top_knee, top_shin, add(top_shin, mul(back, FOOT))]
            else:
                k, a_ = planar_limb(ht, top_rest, THIGH, SHIN, 1)
                top_leg = [ht, k, a_, add(a_, (3.0, 0.0, FOOT))]
        parts = {"arm-far": [sb, elbow, hand], "leg-far": low_leg,
                 "leg-near": top_leg, "arm-near": [st, top_elbow, top_hand],
                 "shoulders": (sb, st), "hips": (hb, ht)}
        crown = (-along[0], -along[1], 0.0)
        return spatial(PLANK, parts, head, crown, (0.0, 0.0, 1.0))

    return 7.0, frame, PLANK.floor(36, 268, -26, 30)


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


# Der Brustöffner („das offene Buch“), seen from in front of the head, from above:
# lying on the side, the knees bent and on top of each other, both arms
# stretched out in front on the floor. The upper arm goes over in a big arc to
# the floor behind the back, like a page that is turned; the chest turns open
# with it, the head follows, the knees stay together. Then back.
BOOK = Camera(yaw=60, pitch=40, origin=(150, FLOOR - 10))
BOOK_REST = 7                  # height of the lower shoulder and hip


def brustoeffner():
    sb = (0.0, BOOK_REST, 0.0)
    hb = (TORSO, BOOK_REST + 1, 0.0)
    ht = (TORSO, BOOK_REST + 1 + HIPS, 0.0)
    knee_b = (TORSO + 4, BOOK_REST - 1, THIGH)
    knee_t = add(ht, mul(norm(sub((TORSO + 4, BOOK_REST + 10, THIGH - 2), ht)), THIGH))
    shin = (SHIN, 0.0, -3.0)
    low_leg = [hb, knee_b, add(knee_b, shin), add(add(knee_b, shin), (FOOT, -1.0, 0.0))]
    top_leg = [ht, knee_t, add(knee_t, shin), add(add(knee_t, shin), (FOOT, 0.0, 0.0))]
    low_arm = [sb, (0.0, BOOK_REST - 2, UPPER_ARM), (0.0, BOOK_REST - 3, ARM)]
    TURN = 78.0                 # how far the chest turns open

    def top_shoulder(s):
        r = math.radians(TURN * s)
        return add(sb, (0.0, SHOULDERS * math.cos(r), -SHOULDERS * math.sin(r)))

    # the upper arm: from lying on the lower hand to the floor behind the back
    start = top_shoulder(0.0)
    closed = math.degrees(math.atan2(BOOK_REST + 5 - start[1], ARM - 4))
    end = top_shoulder(1.0)
    opened = 180 - math.degrees(math.asin((BOOK_REST - 2 - end[1]) / ARM))
    opening = hold((0.08, 0.0), (0.45, 1.0), (0.6, 1.0), (0.95, 0.0))

    def top_arm(s):
        st = top_shoulder(s)
        b = math.radians(closed + (opened - closed) * s)
        d = (0.0, math.sin(b), math.cos(b))
        return [st, add(st, mul(d, UPPER_ARM)), add(st, mul(d, ARM))]

    def frame(t):
        s = track(opening, t)
        st = top_shoulder(s)
        centre = lerp(sb, st, 0.5)
        turn = math.radians(110 * s)               # the face follows the hand
        head = (-NECK + 3, HEAD + 2, -5 * s)
        face = (0.0, math.sin(turn), math.cos(turn))
        parts = {"arm-far": low_arm, "leg-far": low_leg, "leg-near": top_leg, "arm-near": top_arm(s),
                 "shoulders": (sb, st), "hips": (hb, ht)}
        return spatial(BOOK, parts, head, norm(sub(head, centre)), face)

    # the way of the hand, as a dotted arc
    way = [BOOK(top_arm(i / 40)[2]) for i in range(41)]
    arc = (f'<path d="M ' + " L ".join(f"{x:.1f} {y:.1f}" for x, y in way) + f'" fill="none" stroke="{LINE}" '
           f'stroke-width="2.5" stroke-dasharray="2 7" stroke-linecap="round"/>')
    return 9.0, frame, BOOK.floor(-30, 100, -85, 62) + arc


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
        f = figure(hip, shoulder, head, arms, legs, facing_us=True)
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
# from moment to moment; the joints come from the poses above. A part that
# points towards the viewer is drawn shorter, its round ends stay round. Each
# layer (the far limbs, the neck, the body, the head, the near leg, the near
# arm) is drawn in two passes, first all its ink outlines, then its colours,
# so that within a layer the parts join without lines between them.

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
        return [(capsule(length, 14.5, 14), shirt)]
    if kind == "bar":
        return [(capsule(length, 13, 11), shirt)]
    if kind == "neck":
        return [(capsule(length, 11, 10), skin)]
    raise ValueError(kind)


# the parts of the figure, by the strokes of a frame: (stroke, from, to, kind)
PARTS = {
    "far": [("arm-far", 0, 1, "upper"), ("arm-far", 1, 2, "fore"),
            ("leg-far", 0, 1, "thigh"), ("leg-far", 1, 2, "shin"), ("leg-far", 2, 3, "foot")],
    "neck": [("neck", 0, 1, "neck")],
    "body": [("shoulders", 0, 1, "bar"), ("shoulders", 1, 2, "bar"),
             ("torso", 0, 1, "pelvis"), ("torso", 1, 2, "chest")],
    "leg-near": [("leg-near", 0, 1, "thigh"), ("leg-near", 1, 2, "shin"), ("leg-near", 2, 3, "foot")],
    "arm-near": [("arm-near", 0, 1, "upper"), ("arm-near", 1, 2, "fore")],
}
LAYERS = ["far", "neck", "body", "head", "leg-near", "arm-near"]


def lines_of(frame):
    lines = {name: points for name, points, _, _ in frame["strokes"]}
    if "neck" not in lines:
        lines["neck"] = [lines["torso"][2], frame["head"][0]]
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


def repeat(seconds):
    return f'dur="{seconds}s" repeatCount="indefinite"'


def moving(seconds, xs, ys, angles=None, scales=None):
    """The animations that place a part: moved to (x, y), maybe turned by
    angle and stretched a little along its length."""
    out = (f'<animateTransform attributeName="transform" type="translate" values="'
           + ";".join(f"{x:.1f} {y:.1f}" for x, y in zip(xs, ys)) + f'" {repeat(seconds)}/>')
    if angles:
        out += (f'<animateTransform attributeName="transform" type="rotate" values="'
                + ";".join(f"{a:.1f}" for a in angles) + f'" additive="sum" {repeat(seconds)}/>')
    if scales:
        out += (f'<animateTransform attributeName="transform" type="scale" values="'
                + ";".join(f"{k:.3f} 1" for k in scales) + f'" additive="sum" {repeat(seconds)}/>')
    return out


def path(shapes_of_frames, seconds, attributes):
    """A path whose shape may change from moment to moment (all with the same steps)."""
    first = shapes_of_frames[0]
    if all(d == first for d in shapes_of_frames):
        return f'<path d="{first}" {attributes}/>'
    return (f'<path d="{first}" {attributes}><animate attributeName="d" values="'
            + ";".join(shapes_of_frames) + f'" {repeat(seconds)}/></path>')


def value(name, values, seconds):
    """an attribute that stays, or changes from moment to moment"""
    if max(values) - min(values) < 0.05:
        return f'{name}="{values[0]:.1f}"', ""
    return f'{name}="{values[0]:.1f}"', (f'<animate attributeName="{name}" values="'
                                          + ";".join(f"{v:.1f}" for v in values) + f'" {repeat(seconds)}/>')


def head_svg(frames, seconds):
    """the head: an ink ring, the skin, the hair cut to the head (see hair_of)"""
    centres = [f["head"][0] for f in frames]
    placed = moving(seconds, [c[0] for c in centres], [c[1] for c in centres])
    attributes, animations = zip(*(value(name, [f["hair"][i] for f in frames], seconds)
                                   for i, name in enumerate(("cx", "cy", "r"))))
    hair = f'<circle {" ".join(attributes)} fill="{HAIR}" clip-path="url(#head)">{"".join(animations)}</circle>'
    return f'<g>{placed}<circle r="{HEAD + INK_WIDTH}" fill="{INK}"/><circle r="{HEAD}" fill="{SKIN}"/>{hair}</g>'


INK_ATTRIBUTES = f'fill="{INK}" stroke="{INK}" stroke-width="{2 * INK_WIDTH}" stroke-linejoin="round"'


def slab_shape(points):
    return "M " + " L ".join(f"{x:.1f} {y:.1f}" for x, y in points) + " Z"


def figure_svg(name, seconds, frames):
    key = name.rsplit("-", 1)[0]
    area = AREAS[key]
    near = (SHIRTS[area], TROUSERS, SKIN, SHOES)
    far = tuple(darker(c) for c in near)
    colours_by_name = {"shirt": SHIRTS[area], "trousers": TROUSERS}
    lines = [lines_of(f) for f in frames]
    out = []
    for layer in LAYERS:
        if layer == "head":
            out.append(head_svg(frames, seconds))
            continue
        colours = far if layer == "far" else near
        inks, fills = [], []
        if layer == "body" and "slabs" in frames[0]:
            # a body seen at an angle: the hips and the chest as rounded slabs between their corners
            for k, (colour, _) in enumerate(frames[0]["slabs"]):
                shapes_of_frames = [slab_shape(f["slabs"][k][1]) for f in frames]
                inks.append(path(shapes_of_frames, seconds, f'fill="{INK}" stroke="{INK}" stroke-width="{SLAB + 2 * INK_WIDTH}" stroke-linejoin="round"'))
                fills.append(path(shapes_of_frames, seconds, f'fill="{colours_by_name[colour]}" stroke="{colours_by_name[colour]}" stroke-width="{SLAB}" stroke-linejoin="round"'))
        for stroke, i, j, kind in PARTS[layer]:
            if stroke not in lines[0]:
                continue
            starts = [l[stroke][i] for l in lines]
            ends = [l[stroke][j] for l in lines]
            lengths = [dist(a, b) for a, b in zip(starts, ends)]
            if max(lengths) < 0.5:
                continue                             # a part that is not seen from here
            angles = unwrap([angle_of(a, b) for a, b in zip(starts, ends)])
            longest = max(lengths)
            scales = None
            if min(lengths) < 0.85 * longest:
                # seen much shorter at times: drawn anew each moment, so its ends stay round
                drawn = [shapes(kind, length, colours) for length in lengths]
            else:
                drawn = [shapes(kind, longest, colours)]
                if longest - min(lengths) > 0.8:
                    scales = [length / longest for length in lengths]
            placed = moving(seconds, [a[0] for a in starts], [a[1] for a in starts], angles, scales)
            for k, (_, colour) in enumerate(drawn[0]):
                shapes_of_frames = [d[k][0] for d in drawn]
                inks.append(f'<g>{placed}{path(shapes_of_frames, seconds, INK_ATTRIBUTES)}</g>')
                filled = path(shapes_of_frames, seconds, f'fill="{colour}"')
                fills.append(f'<g>{placed}{filled}</g>')
        out += inks + fills
    return out


def view_of(frames, least_width=190, pad=20):
    """The part of the drawing to show: the figure in all its moments, close
    up, standing on the floor at the bottom, in 3:2."""
    xs, ys = [], []
    for f in frames:
        points = [q for _, line, _, _ in f["strokes"] for q in line]
        points += [q for _, corners in f.get("slabs", []) for q in corners]
        xs += [x for x, _ in points]
        ys += [y for _, y in points]
        (cx, cy), r = f["head"]
        xs += [cx - r, cx + r]
        ys += [cy - r, cy + r]
    x0, x1 = min(xs) - pad, max(xs) + pad
    bottom = max(FLOOR + 12, max(ys) + pad * 0.6)
    width = max(x1 - x0, least_width, (bottom - (min(ys) - pad)) * 1.5)
    height = width / 1.5
    left = (x0 + x1) / 2 - width / 2
    return left, bottom - height, width, height


MAX_SAMPLES = 120        # long, slow loops (the body scan) need fewer moments a second


def svg(name, seconds, frame, behind="", front=""):
    n = max(2, min(MAX_SAMPLES, round(seconds * SAMPLES_PER_SECOND)))
    frames = [frame(i / n) for i in range(n)] + [frame(0)]
    x, y, w, h = view_of(frames)
    out = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x:.0f} {y:.0f} {w:.0f} {h:.0f}" width="600" height="400">',
           f'<defs><clipPath id="head"><circle r="{HEAD}"/></clipPath></defs>', behind]
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
