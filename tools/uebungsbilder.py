#!/usr/bin/env python3
"""Draws the exercises as moving figures (SVG), one file per exercise and
stage: assets/uebungen/<id>.svg (the id as in the table of exercises); a
part of the time with a move of its own gets assets/uebungen/<exercise>-<part>.svg
(the Hampel-Runden: hampelrunde-hampelmann.svg …).

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
# shoulder. The body is one line from the head to the knees (stages 1 and 2)
# or to the feet (stage 3) and holds it, only breathing; it does not go up
# and down (the exercise is a hold).
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
    lift = hold((0.0, 0.0), (0.5, min(2.5, high)), (1.0, 0.0))   # a calm breath, the hips stay up

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


# --- for children and young people -------------------------------------------
# Their own exercises (column `alter` of the table): animals, jumping, a teddy.

def moving_floor(seconds, distance, spacing):
    """a mat whose dashes move back by `distance` each loop: the figure goes forward on the spot"""
    dashes = " ".join(f"M {x} {FLOOR + 6} h 10" for x in range(-80, W + 80, spacing))
    return (f'<rect x="14" y="{FLOOR - 2}" width="{W - 28}" height="8" rx="4" fill="{MAT}"/>'
            f'<g><path d="{dashes}" stroke="{LINE}" stroke-width="2.5" stroke-linecap="round"/>'
            f'<animateTransform attributeName="transform" type="translate" values="0 0;{-distance} 0" {repeat(seconds)}/></g>')


def step(s, stride, lift):
    """a hand or foot relative to its place under the body at moment s of its
    step (0 to 1): the first half on the floor, sliding back while the body
    goes on; the second half lifted and brought forward. -> (dx, dy)"""
    s %= 1
    if s < 0.5:
        return stride / 2 - stride * s / 0.5, 0.0
    u = (s - 0.5) / 0.5
    return -stride / 2 + stride * smooth(u), -math.sin(math.pi * u) * lift


# Der Bärengang: on hands and feet, head to the right, the hand of one side
# with the foot of the other. Stage 1 hips high on the spot, stage 2 forward
# and back again, stage 3 the knees just above the floor, slow and quiet.
def baerengang(stage):
    low = stage == 3
    hip0 = (112, FLOOR - 46) if low else (112, FLOOR - 72)
    shoulder_y = FLOOR - 3 - ARM + (4 if low else 0)
    torso_angle = math.degrees(math.asin((shoulder_y - hip0[1]) / TORSO))
    shoulder0 = at(hip0, torso_angle, TORSO)
    hand0 = (shoulder0[0] + 3, FLOOR - 3)
    ankle0 = (hip0[0] - 34, FLOOR - 9) if low else (hip0[0] - 26, FLOOR - 6)
    stride, lift = (10, 4) if low else (14, 7)
    cycle = 2.2 if low else 1.6

    def pose(s, x, back=False):
        hip = (hip0[0] + x, hip0[1] + math.sin(4 * math.pi * s) * 1.2)
        shoulder = at(hip, torso_angle, TORSO)
        head = at(shoulder, torso_angle + 12, NECK)
        arms, legs = {}, {}
        # near hand with far foot, far hand with near foot
        for side, offset in (("near", 0.0), ("far", 0.5)):
            o = offset + (0.5 if back else 0.0)
            dx, dy = step(s + o, stride, lift)
            dx = -dx if back else dx
            arms[side] = arm_to(shoulder, (hand0[0] + x + dx, hand0[1] + dy), 1)
            other = "far" if side == "near" else "near"
            fx, fy = step(s + o, stride, lift)
            fx = -fx if back else fx
            ankle = (ankle0[0] + x + fx, ankle0[1] + fy)
            legs[other] = leg_to(hip, ankle, -1, 150 if low else 0)
        return figure(hip, shoulder, head, arms, legs)

    if stage != 2:
        return cycle, lambda t: pose(t, 0.0), moving_floor(cycle, 2 * stride, stride)

    # stage 2: two steps forward, two back, over a loop of four steps
    def frame(t):
        if t < 0.5:
            local = t / 0.5 * 2
            return pose(local % 1, 2 * stride * local)
        local = (t - 0.5) / 0.5 * 2
        return pose(local % 1, 4 * stride - 2 * stride * local, back=True)
    return 4 * cycle, frame, mat(30, 280)


# Lying on the belly, head to the right (Flieger, Kobra, the pause of the Brett).
PRONE_HIP = (118, FLOOR - 8)


def prone(hip, chest=0.0, arm_angles=(4.0, 4.0), arm_shares=(1.0, 1.0), leg_angles=(177.0, 177.0), head_up=0.0, arms=None):
    """chest: how far the chest is lifted (degrees); arm_angles, leg_angles:
    far and near; arms: the arms as points instead."""
    shoulder = at(hip, -chest, TORSO)
    head = at(shoulder, -chest - 8 - head_up, NECK)
    if arms is None:
        arms = {side: arm_dir(shoulder, a, share, 1)
                for side, a, share in zip(("far", "near"), arm_angles, arm_shares)}
    legs = {}
    for side, a in zip(("far", "near"), leg_angles):
        ankle = at(hip, a, LEG - 0.05)
        legs[side] = leg_to(hip, ankle, -1, a - 12)
    return figure(hip, shoulder, head, arms, legs)


def flieger(stage):
    rest_arm, up_arm = 4.0, -12.0
    rest_leg, up_leg = 177.0, 189.0
    if stage == 1:
        # one arm with the other leg, then the other pair
        def frame(t):
            def lifted(start):
                return track(hold((start, 0.0), (start + 0.1, 1.0), (start + 0.3, 1.0), (start + 0.4, 0.0)), t)
            a, b = lifted(0.05), lifted(0.55)
            return prone(PRONE_HIP, chest=2 * max(a, b),
                         arm_angles=(lerp(rest_arm, up_arm, b) - 2, lerp(rest_arm, up_arm, a)),
                         leg_angles=(lerp(rest_leg, up_leg, a), lerp(rest_leg, up_leg, b)))
        return 5.0, frame, mat(30, 280)
    if stage == 2:
        def frame(t):
            s = track(hold((0.1, 0.0), (0.25, 1.0), (0.7, 1.0), (0.85, 0.0)), t)
            return prone(PRONE_HIP, chest=5 * s, head_up=2 * s,
                         arm_angles=(lerp(rest_arm, up_arm, s) - 2, lerp(rest_arm, up_arm, s)),
                         leg_angles=(lerp(rest_leg, up_leg, s), lerp(rest_leg, up_leg, s) + 1))
        return 4.0, frame, mat(30, 280)

    # stage 3: up in the air, the arms sweep to the hips and forward again
    sweep = hold((0.15, (up_arm, 1.0)), (0.35, (-80.0, 0.3)), (0.5, (-166.0, 0.95)),
                 (0.62, (-166.0, 0.95)), (0.78, (-80.0, 0.3)), (0.95, (up_arm, 1.0)))

    def frame(t):
        angle, share = track(sweep, t)
        return prone(PRONE_HIP, chest=5, head_up=2, arm_angles=(angle - 3, angle), arm_shares=(share, share),
                     leg_angles=(up_leg, up_leg + 1))
    return 4.0, frame, mat(30, 280)


# Froschsprünge, from the front: down in a deep squat, the knees wide, the
# hands on the floor between the feet; up and back down. Higher from stage to
# stage, at stage 3 with the arms stretched up.
def froschsprung(stage):
    cx = 150
    peak = {1: 12, 2: 20, 3: 28}[stage]
    arms_up = stage == 3

    def pose(s, up):
        """s: 0 crouched … 1 stretched; up: height above the floor"""
        hip_y = lerp(FLOOR - 26.0, STAND_HIP, s) - up
        shoulder = (cx, hip_y - lerp(30.0, TORSO, s))          # leaning forward, so seen shorter
        head = (cx, shoulder[1] - lerp(19.0, NECK, s))
        arms, legs = {}, {}
        for side, sign in (("far", -1), ("near", 1)):
            top = (cx + 5 * sign, hip_y)
            ankle = (cx + sign * lerp(19.0, 7.0, s), FLOOR - 6 - up)
            knee = lerp((cx + sign * 37, FLOOR - 40.0), (lerp(top[0], ankle[0], 0.5) + 2 * sign, hip_y + THIGH - 1), s)
            out = 0 if sign > 0 else 180
            foot = at(ankle, out + sign * lerp(18.0, 75.0, min(1.0, up / 6)), FOOT - 2)
            legs[side] = [top, knee, ankle, foot]
            point = (cx + 13 * sign, shoulder[1] + 3)
            floor = (cx + 8 * sign, FLOOR - 4 - up)
            down = angle_of(point, floor)
            if sign < 0:
                end = 250.0 if arms_up else 118.0
                angle = lerp(down if down > 0 else down + 360, end, s)
            else:
                end = -70.0 if arms_up else 62.0
                angle = lerp(down, end, s)
            share = lerp(min(1.0, dist(point, floor) / ARM), 1.0, s)
            arms[side] = arm_dir(point, angle, share, 1 if sign < 0 else -1)
        f = figure((cx, hip_y), shoulder, head, arms, legs, facing_us=True)
        left, right = (cx - 13, shoulder[1] + 3), (cx + 13, shoulder[1] + 3)
        f["strokes"].insert(2, ("shoulders", [left, shoulder, right], LIMB, NEAR))
        return f

    stretch = hold((0.22, 0.0), (0.36, 1.0), (0.56, 1.0), (0.7, 0.0))
    height = hold((0.3, 0.0), (0.46, 1.0), (0.64, 0.0))
    return 1.8, lambda t: pose(track(stretch, t), peak * track(height, t)), mat(80, 220)


# Das Brett: on the forearms, head to the right, body straight; stage 1 on
# the knees, stage 2 on the toes, stage 3 on the hands, tapping the other
# shoulder. A slow breath moves the back a little. In the pauses (its own
# figure): lying on the belly, the head on the hands.
BRETT_ELBOW = (180, FLOOR - 4)


def brett(stage):
    if stage < 3:
        shoulder = (BRETT_ELBOW[0], BRETT_ELBOW[1] - UPPER_ARM)
        hand = (BRETT_ELBOW[0] + FOREARM, FLOOR - 4)
    else:
        shoulder = (BRETT_ELBOW[0], FLOOR - 3 - ARM)
        hand = (BRETT_ELBOW[0] + 2, FLOOR - 3)
    if stage == 1:
        knee = (shoulder[0] - math.sqrt((THIGH + TORSO) ** 2 - (FLOOR - 5 - shoulder[1]) ** 2), FLOOR - 5)
        line_angle = angle_of(knee, shoulder)
        hip = at(knee, line_angle, THIGH)
    else:
        ankle_y = FLOOR - 9
        ankle = (shoulder[0] - math.sqrt((LEG + TORSO) ** 2 - (ankle_y - shoulder[1]) ** 2), ankle_y)
        line_angle = angle_of(ankle, shoulder)
        hip = at(ankle, line_angle, LEG - 0.5)
    tap = hold((0.08, 0.0), (0.2, 1.0), (0.3, 1.0), (0.42, 0.0)) if stage == 3 else [(0, 0.0), (1, 0.0)]

    def frame(t):
        breath = math.sin(2 * math.pi * t) * 0.9
        head = at(shoulder, line_angle + 10, NECK)
        if stage < 3:
            arms = {"far": [shoulder, (BRETT_ELBOW[0] - 1, BRETT_ELBOW[1]), (hand[0] - 3, hand[1])],
                    "near": [shoulder, BRETT_ELBOW, hand]}
        else:
            to_shoulder = (shoulder[0] + 3, shoulder[1] + 9)
            near = lerp(hand, to_shoulder, track(tap, t))
            far = lerp((hand[0] - 2, hand[1]), to_shoulder, track(tap, (t + 0.5) % 1))
            arms = {"far": arm_to(shoulder, far, 1), "near": arm_to(shoulder, near, 1)}
        if stage == 1:
            shin = (knee[0] - SHIN, FLOOR - 6)
            legs = {s: [hip, knee, shin, at(shin, 186, FOOT)] for s in ("far", "near")}
        else:
            legs = {s: leg_to(hip, (ankle[0] - (2 if s == "far" else 0), ankle[1]), 1, 112) for s in ("far", "near")}
        return figure(hip, shoulder, head, arms, legs, spine_bend=breath)
    return (3.0 if stage == 3 else 4.0), frame, mat(30, 270)


def brett_pause():
    def frame(t):
        breath = math.sin(2 * math.pi * t) * 1.0
        hip = PRONE_HIP
        shoulder = at(hip, 0, TORSO)
        head = at(shoulder, -12, NECK)
        # the hands under the forehead, the elbows out in front
        arms = {side: [shoulder, (shoulder[0] + 20 + d, FLOOR - 5), (head[0] - 2 + d, FLOOR - 7)]
                for side, d in (("far", -3), ("near", 0))}
        legs = {side: leg_to(hip, at(hip, 177 + d, LEG - 0.05), -1, 168) for side, d in (("far", 1), ("near", 0))}
        return figure(hip, shoulder, head, arms, legs, spine_bend=breath)
    return 4.0, frame, mat(30, 280)


# Seen from the front: standing, the hips and the shoulders as two points each.
def front(cx, hip_y, arm_angles, ankles, arm_bends=(1, -1), knee_out=0.0, feet=(160.0, 20.0)):
    """arm_angles: far (left on the picture) and near (right) arm; ankles: the
    far and the near ankle; knee_out: how far the knees bend outwards."""
    hip = (cx, hip_y)
    shoulder = (cx, hip_y - TORSO)
    head = (cx, shoulder[1] - NECK)
    left, right = (cx - 13, shoulder[1] + 3), (cx + 13, shoulder[1] + 3)
    arms = {"far": arm_dir(left, arm_angles[0], 1.0, arm_bends[0]),
            "near": arm_dir(right, arm_angles[1], 1.0, arm_bends[1])}
    legs = {}
    for side, top, ankle, bend, foot in (("far", (cx - 5, hip_y), ankles[0], 1, feet[0]), ("near", (cx + 5, hip_y), ankles[1], -1, feet[1])):
        knee, end = limb(top, ankle, THIGH, SHIN, bend)
        if knee_out:
            knee = (knee[0] + (-knee_out if side == "far" else knee_out), knee[1])
        legs[side] = [top, knee, end, at(end, foot, FOOT - 2)]
    f = figure(hip, shoulder, head, arms, legs, facing_us=True)
    f["strokes"].insert(2, ("shoulders", [left, shoulder, right], LIMB, NEAR))
    return f


STAND_HIP = FLOOR - 6 - LEG + 2


# Hampel-Runden: jumping jack (from the front), running on the spot and
# knees up (from the side). The card shows the jumping jack; in the timer
# each move has its own figure (hampelrunde-<move>.svg).
def hampelmann():
    def frame(t):
        open_ = track(hold((0.0, 0.0), (0.38, 1.0), (0.5, 1.0), (0.88, 0.0)), t)
        up = 7 * math.sin(math.pi * ((t * 2) % 1)) ** 2
        spread = lerp(6.0, 30.0, open_)
        ankles = ((150 - spread, FLOOR - 6 - up), (150 + spread, FLOOR - 6 - up))
        return front(150, STAND_HIP - up + 3 * (1 - open_), (lerp(100.0, 236.0, open_), lerp(80.0, -56.0, open_)), ankles)
    return 1.4, frame, mat(80, 220)


def laufen(knees):
    """running on the spot, head to the right; knees: the knees come up high"""
    hip0 = (150, STAND_HIP)

    def frame(t):
        hip = (hip0[0], hip0[1] - 2 * abs(math.sin(2 * math.pi * t)))
        shoulder = at(hip, -84, TORSO)
        head = at(shoulder, -80, NECK)
        legs, arms = {}, {}
        for side, shift in (("near", 0.0), ("far", 0.5)):
            s = (t + shift) % 1
            lift = math.sin(math.pi * s / 0.5) if s < 0.5 else 0.0
            if knees:
                knee = at(hip, lerp(88.0, 4.0, lift), THIGH)
                ankle = at(knee, lerp(92.0, 96.0, lift), SHIN)
                foot = lerp(0.0, 40.0, lift)
            else:
                ankle = (hip[0] - 22 * lift + 2, FLOOR - 6 - 26 * lift)
                knee = None
                foot = lerp(0.0, -60.0, lift)
            legs[side] = [hip, knee, ankle, at(ankle, foot, FOOT)] if knee else leg_to(hip, ankle, -1, foot)
            swing = math.sin(2 * math.pi * s)
            elbow = at(shoulder, 90 + 38 * swing, UPPER_ARM)
            arms["far" if side == "near" else "near"] = [shoulder, elbow, at(elbow, -20 + 30 * swing, FOREARM)]
        return figure(hip, shoulder, head, arms, legs)
    return (0.9 if knees else 0.7), frame, mat(80, 220)


def hampelrunde():
    return hampelmann()


# A pause in the Hampel-Runden: standing, from the front, breathing.
def verschnaufen():
    def frame(t):
        breath = 1.5 * math.sin(2 * math.pi * t)
        ankles = ((144, FLOOR - 6), (156, FLOOR - 6))
        return front(150, STAND_HIP + breath * 0.3, (98.0 + breath, 82.0 - breath), ankles)
    return 4.0, frame, mat(80, 220)


# Walking on the spot, calmly, between the moves (Gehen), from the side.
def gehen():
    hip0 = (150, STAND_HIP)

    def frame(t):
        hip = (hip0[0], hip0[1] - 1.0 * abs(math.sin(2 * math.pi * t)))
        shoulder = at(hip, -86, TORSO)
        head = at(shoulder, -82, NECK)
        legs, arms = {}, {}
        for side, shift in (("near", 0.0), ("far", 0.5)):
            s = (t + shift) % 1
            lift = math.sin(math.pi * s / 0.5) if s < 0.5 else 0.0
            knee = at(hip, lerp(88.0, 58.0, lift), THIGH)
            ankle = at(knee, lerp(92.0, 100.0, lift), SHIN)
            if ankle[1] > FLOOR - 6:
                ankle = (ankle[0], FLOOR - 6)
            legs[side] = [hip, knee, ankle, at(ankle, lerp(0.0, 25.0, lift), FOOT)]
            swing = math.sin(2 * math.pi * s)
            elbow = at(shoulder, 90 + 18 * swing, UPPER_ARM)
            arms["far" if side == "near" else "near"] = [shoulder, elbow, at(elbow, 60 + 18 * swing, FOREARM)]
        return figure(hip, shoulder, head, arms, legs)
    return 1.3, frame, mat(80, 220)


# Ausfallschritte im Wechsel, from the side, head to the right: a step back,
# the hips sink until the back knee is just above the floor, back up; then
# the other leg.
def wechselschritt():
    front_ankle = (162, FLOOR - 6)
    sink = hold((0.05, 0.0), (0.2, 1.0), (0.3, 1.0), (0.45, 0.0))

    def frame(t):
        half = 0 if t < 0.5 else 1
        s = track(sink, (t % 0.5) * 2)
        hip = (150 - 6 * s, STAND_HIP + 30 * s)
        shoulder = at(hip, -88, TORSO)
        head = at(shoulder, -84, NECK)
        back_ankle = (lerp(150.0, 92.0, s), FLOOR - 6 - 6 * s)
        back = leg_to(hip, back_ankle, -1, lerp(0.0, -40.0, s))
        front_leg = leg_to(hip, front_ankle, -1, 0)
        legs = {"near": back, "far": front_leg} if half == 0 else {"near": front_leg, "far": back}
        arms = {side: arm_dir(shoulder, 96 + d, 0.92, 1) for side, d in (("far", -6), ("near", 6))}
        return figure(hip, shoulder, head, arms, legs)
    return 4.0, frame, mat(60, 230)


# Die Brücke: on the back, head to the left, the knees bent and the feet on
# the floor; the hips rise until thighs and body are one line, and sink.
# Stage 2 holds at the top; stage 3 holds and stretches one leg, then the other.
BRIDGE_FEET = (SUPINE_HIP[0] + 46, FLOOR - 6)


def bruecke(stage):
    shoulder = (SUPINE_HIP[0] - TORSO, FLOOR - 9)
    head = (shoulder[0] - NECK + 1, FLOOR - HEAD)
    lift = {1: hold((0.1, 0.0), (0.4, 1.0), (0.55, 1.0), (0.85, 0.0)),
            2: hold((0.05, 0.0), (0.2, 1.0), (0.8, 1.0), (0.95, 0.0)),
            3: hold((0.03, 0.0), (0.12, 1.0), (0.88, 1.0), (0.97, 0.0))}[stage]
    # stage 3: one leg long at a time, while the hips stay up
    reach = {"near": hold((0.18, 0.0), (0.26, 1.0), (0.4, 1.0), (0.48, 0.0)),
             "far": hold((0.55, 0.0), (0.63, 1.0), (0.77, 1.0), (0.85, 0.0))}

    def frame(t):
        up = track(lift, t)
        top = math.sqrt(max(0.0, TORSO ** 2 - 4 ** 2))
        hip = (shoulder[0] + lerp(TORSO, top * 0.93, up), lerp(SUPINE_HIP[1], FLOOR - 9 - 36, up))
        legs = {}
        for side in ("far", "near"):
            out = track(reach[side], t) if stage == 3 else 0.0
            if out > 0:
                knee = at(hip, lerp(angle_of(hip, BRIDGE_FEET) - 30, angle_of(hip, BRIDGE_FEET) - 12, out), THIGH)
                ankle = at(knee, lerp(70.0, -8.0, out), SHIN)
                legs[side] = [hip, knee, ankle, at(ankle, lerp(0.0, -70.0, out), FOOT)]
            else:
                legs[side] = leg_to(hip, BRIDGE_FEET, -1, 0)
        arms = {side: [shoulder, (shoulder[0] + UPPER_ARM, FLOOR - 7), (shoulder[0] + ARM - 2 + d, FLOOR - 6)]
                for side, d in (("far", -2), ("near", 0))}
        return figure(hip, shoulder, head, arms, legs)
    return {1: 4.0, 2: 6.0, 3: 9.0}[stage], frame, mat(60, 262)


# Der Baum, from the front: on the near leg, the other foot at its calf, the
# knee out to the side, the arms up like branches; it sways a little.
def turned(frame_, pivot, degrees):
    """the whole figure turned around pivot"""
    def turn(p):
        a = math.radians(degrees)
        x, y = p[0] - pivot[0], p[1] - pivot[1]
        return (pivot[0] + x * math.cos(a) - y * math.sin(a), pivot[1] + x * math.sin(a) + y * math.cos(a))
    strokes = [(name, [turn(p) for p in points], width, colour) for name, points, width, colour in frame_["strokes"]]
    (centre, r) = frame_["head"]
    dx, dy, hr = frame_["hair"]
    a = math.radians(degrees)
    hair = (dx * math.cos(a) - dy * math.sin(a), dx * math.sin(a) + dy * math.cos(a), hr)
    return {**frame_, "strokes": strokes, "head": (turn(centre), r), "hair": hair}


def baum():
    cx = 150
    foot_at = (cx + 6, FLOOR - 6)

    def frame(t):
        sway = math.sin(2 * math.pi * t) * 3.0
        hip = (cx, STAND_HIP)
        f = front(cx, STAND_HIP, (-106.0, -74.0), ((cx + 4, FLOOR - 40), foot_at), arm_bends=(-1, 1))
        # the far leg: the knee out to the side, the foot at the calf of the near leg
        top = (cx - 5, hip[1])
        knee = (cx - 34, hip[1] + 26)
        ankle = (cx + 2, FLOOR - 36)
        for k, (name, points, width, colour) in enumerate(f["strokes"]):
            if name == "leg-far":
                f["strokes"][k] = (name, [top, knee, ankle, at(ankle, 70, FOOT - 2)], width, colour)
        return turned(f, (foot_at[0], FLOOR), sway)
    return 6.0, frame, mat(80, 220)


# Der Hund: hands and feet on the floor, the hips up high, an upside-down V;
# head to the right. The knees bend in turn, a heel lifts.
def hund():
    hip = (138, FLOOR - 70)
    theta = math.degrees(math.asin((FLOOR - 3 - hip[1]) / (TORSO + ARM)))
    shoulder = at(hip, theta, TORSO)
    hand = at(shoulder, theta, ARM - 1)
    ankle0 = (hip[0] - 34, FLOOR - 7)

    def frame(t):
        legs = {}
        for side, shift in (("near", 0.0), ("far", 0.5)):
            s = track(hold((0.08, 0.0), (0.22, 1.0), (0.32, 1.0), (0.46, 0.0)), (t + shift) % 1)
            ankle = (ankle0[0] + 3 * s - (2 if side == "far" else 0), ankle0[1] - 9 * s)
            legs[side] = leg_to(hip, ankle, -1, lerp(-4.0, 52.0, s))
        head = at(shoulder, theta + 20, NECK)
        arms = {"far": arm_to(shoulder, (hand[0] - 2, hand[1]), 1), "near": arm_to(shoulder, hand, 1)}
        return figure(hip, shoulder, head, arms, legs)
    return 3.0, frame, mat(50, 260)


# Die Kobra: on the belly, the hands beside the chest; the chest comes up,
# the belly stays down, and it hisses.
def kobra():
    hip = PRONE_HIP
    hand = (hip[0] + TORSO - 2, FLOOR - 3)
    lift = hold((0.1, 0.0), (0.38, 1.0), (0.68, 1.0), (0.9, 0.0))

    def frame(t):
        s = track(lift, t)
        chest = 34 * s + 1
        shoulder = at(hip, -chest, TORSO)
        head = at(shoulder, -chest - 6 - 14 * s, NECK)
        arms = {"far": arm_to(shoulder, (hand[0] - 3, hand[1]), 1), "near": arm_to(shoulder, hand, 1)}
        legs = {side: leg_to(hip, at(hip, 177 + d, LEG - 0.05), -1, 168) for side, d in (("far", 1), ("near", 0))}
        return figure(hip, shoulder, head, arms, legs)

    # the hiss: three little waves in front of the face while the chest is up
    up = at(at(hip, -35, TORSO), -55, NECK)
    waves = "".join(f'<path d="M {up[0] + 16 + 7 * i:.1f} {up[1] - 6:.1f} q 4 6 0 12" fill="none" stroke="{LINE}" '
                    f'stroke-width="2.5" stroke-linecap="round" opacity="0">'
                    f'<animate attributeName="opacity" values="0;0;0.9;0.9;0;0" keyTimes="0;{0.36 + 0.04 * i:.2f};{0.42 + 0.04 * i:.2f};0.64;0.7;1" {repeat(5.0)}/></path>'
                    for i in range(3))
    return 5.0, frame, mat(30, 280), waves


# Der Schmetterling, from the front: sitting, the soles together, the knees
# out to the sides flutter up and down; the hands hold the feet.
def schmetterling():
    cx = 150

    def frame(t):
        flap = math.sin(2 * math.pi * t)
        hip = (cx, FLOOR - 16)
        shoulder = (cx, hip[1] - TORSO)
        head = (cx, shoulder[1] - NECK)
        left, right = (cx - 13, shoulder[1] + 3), (cx + 13, shoulder[1] + 3)
        legs = {}
        arms = {}
        for side, sign, top in (("far", -1, (cx - 4, hip[1])), ("near", 1, (cx + 4, hip[1]))):
            knee = at(top, (180 if sign < 0 else 0) - sign * (10 + 9 * flap), THIGH)
            ankle = (cx + sign * 5, FLOOR - 8)
            legs[side] = [top, knee, ankle, (cx + sign * 1, FLOOR - 13)]
            shoulder_point = left if sign < 0 else right
            arms[side] = [shoulder_point, (shoulder_point[0] + sign * 9, shoulder_point[1] + 22), (cx + sign * 9, FLOOR - 11)]
        f = figure(hip, shoulder, head, arms, legs, facing_us=True)
        f["strokes"].insert(2, ("shoulders", [left, shoulder, right], LIMB, NEAR))
        return f
    return 1.6, frame, mat(80, 220)


# Lying on the back, head to the left (Teddy, the last stage of the Ballon).
SUPINE_REST_HIP = (176, FLOOR - 6)


def lying(t, breath, tense=0.0, wobble=0.0):
    hip = SUPINE_REST_HIP
    shoulder = at(hip, 180, TORSO)
    head = (shoulder[0] - NECK + 1, FLOOR - HEAD)
    lift = 10 * tense + wobble
    arms = {side: [shoulder, at(shoulder, 10 - lift + d, UPPER_ARM), at(shoulder, 8 - lift + d, ARM)]
            for side, d in (("far", -2), ("near", 0))}
    legs = {side: [hip, at(hip, -lift / 2 + d, THIGH), at(hip, -lift / 2 + d, LEG),
                   at(at(hip, -lift / 2 + d, LEG), -70 - 25 * tense, FOOT)] for side, d in (("far", -1), ("near", 0))}
    return figure(hip, shoulder, head, arms, legs, spine_bend=breath)


def breath_curve(t, share_in=0.4):
    return smooth(t / share_in) if t < share_in else 1 - smooth((t - share_in) / (1 - share_in))


def teddy_svg(seconds, rise, wobble=None):
    """a teddy sitting on the belly, going up and down with the breath"""
    x, y = SUPINE_REST_HIP[0] - 20, FLOOR - 20
    ink = f'stroke="{INK}" stroke-width="{2 * INK_WIDTH / 1.6:.1f}"'
    bear = (f'<circle cx="{x - 6}" cy="{y - 16}" r="3.5" fill="#9a7552" {ink}/>'
            f'<circle cx="{x + 6}" cy="{y - 16}" r="3.5" fill="#9a7552" {ink}/>'
            f'<circle cx="{x}" cy="{y}" r="9" fill="#9a7552" {ink}/>'
            f'<circle cx="{x}" cy="{y - 11}" r="7" fill="#9a7552" {ink}/>'
            f'<circle cx="{x}" cy="{y - 9}" r="2.8" fill="#d9c2a0"/>'
            f'<circle cx="{x}" cy="{y + 1}" r="4.5" fill="#b8936c"/>')
    values = ";".join(f"0 {v:.1f}" for v in rise)
    return f'<g>{bear}<animateTransform attributeName="transform" type="translate" values="{values}" {repeat(seconds)}/></g>'


def teddy(stage):
    if stage < 3:
        seconds = 4.0 if stage == 1 else 7.0
        share = 0.4 if stage == 1 else 3 / 7
        n = 24
        rise = [-5 * breath_curve(i / n, share) for i in range(n)] + [0.0]

        def frame(t):
            return lying(t, 1.6 * breath_curve(t, share))
        return seconds, frame, mat(60, 268), teddy_svg(seconds, rise)
    seconds, frame = tense_and_loose()
    n = 48
    rise = [-1.5 * math.sin(2 * math.pi * 3 * i / n) * jelly(i / n) for i in range(n)] + [0.0]
    return seconds, frame, mat(60, 268), teddy_svg(seconds, rise)


def jelly(t):
    """after letting go: a wobble that dies away"""
    return 0.0 if t < 0.42 else math.exp(-5 * (t - 0.42)) * (1 if t < 0.9 else 0)


def tense_and_loose():
    """all tight for a moment, then let go like a jelly"""
    tight = hold((0.08, 0.0), (0.18, 1.0), (0.36, 1.0), (0.42, 0.0))

    def frame(t):
        wobble = 4 * math.sin(2 * math.pi * 6 * t) * jelly(t)
        return lying(t, 0.8 * math.sin(2 * math.pi * t), tense=track(tight, t), wobble=wobble)
    return 6.0, frame


# Ballon-Atmen: sitting, a hand on the belly where a balloon grows and
# shrinks with the breath; stage 2 a square traced by a light (in, hold, out,
# hold); stage 3 lying, tight and loose.
def sitting(t, breath, hand_on_belly=True):
    b = breath
    hip = (150, FLOOR - 16)
    shoulder = (150, hip[1] - TORSO - 2 * b)
    head = (150, shoulder[1] - NECK)
    left = (150 - 13, shoulder[1] + 3 - 2 * b)
    right = (150 + 13, shoulder[1] + 3 - 2 * b)
    near = [right, (right[0] + 9, right[1] + 20), (150 + 3, hip[1] - 14)] if hand_on_belly else \
        [right, (right[0] + 12, right[1] + 22), (150 + 34, FLOOR - 16)]
    arms = {"far": [left, (left[0] - 12, left[1] + 22), (150 - 34, FLOOR - 16)], "near": near}
    legs = {"far": [hip, (150 - 40, FLOOR - 8), (150 + 14, FLOOR - 4), (150 + 22, FLOOR - 5)],
            "near": [hip, (150 + 40, FLOOR - 8), (150 - 14, FLOOR - 4), (150 - 22, FLOOR - 5)]}
    f = figure(hip, shoulder, head, arms, legs, facing_us=True)
    f["strokes"].insert(2, ("shoulders", [left, shoulder, right], LIMB, NEAR))
    return f


def ballon(stage):
    if stage == 1:
        seconds, share = 9.0, 4 / 9
        balloon = (f'<circle cx="150" cy="{FLOOR - 32}" r="10" fill="#aaa4e2" opacity="0.35">'
                   f'<animate attributeName="r" values="9;26;9" keyTimes="0;{share:.3f};1" {repeat(seconds)}/></circle>')
        return seconds, lambda t: sitting(t, breath_curve(t, share)), mat(80, 220), balloon
    if stage == 2:
        seconds = 16.0
        cy, r = FLOOR - 56, 48
        box = (f'<rect x="{150 - r}" y="{cy - r}" width="{2 * r}" height="{2 * r}" rx="10" fill="none" stroke="#aaa4e2" '
               f'stroke-width="3" opacity="0.45"/>')
        path = f"M {150 - r} {cy + r} V {cy - r} H {150 + r} V {cy + r} Z"
        light = (f'<circle r="7" fill="#aaa4e2"><animateMotion path="{path}" {repeat(seconds)}/></circle>')

        def frame(t):
            # in for a quarter, hold, out, hold
            b = smooth(t / 0.25) if t < 0.25 else 1.0 if t < 0.5 else 1 - smooth((t - 0.5) / 0.25) if t < 0.75 else 0.0
            return sitting(t, b, hand_on_belly=False)
        return seconds, frame, mat(80, 220) + box + light
    seconds, frame = tense_and_loose()
    return seconds, frame, mat(60, 268)


EXERCISES = {
    "kaefer-1": lambda: kaefer(1), "kaefer-2": lambda: kaefer(2), "kaefer-3": lambda: kaefer(3),
    "vogelhund-1": lambda: vogelhund(1), "vogelhund-2": lambda: vogelhund(2), "vogelhund-3": lambda: vogelhund(3),
    "seitstuetz-1": lambda: side_plank(1), "seitstuetz-2": lambda: side_plank(2), "seitstuetz-3": lambda: side_plank(3),
    "treppe-1": lambda: treppe(1), "treppe-2": lambda: treppe(2), "treppe-3": lambda: treppe(3),
    "katze-kuh-1": katze_kuh, "ausfallschritt-1": ausfallschritt, "brustoeffner-1": brustoeffner,
    "innehalten-1": lambda: innehalten(1), "innehalten-2": lambda: innehalten(2), "innehalten-3": lambda: innehalten(3),
    # for children and young people
    "baerengang-1": lambda: baerengang(1), "baerengang-2": lambda: baerengang(2), "baerengang-3": lambda: baerengang(3),
    "flieger-1": lambda: flieger(1), "flieger-2": lambda: flieger(2), "flieger-3": lambda: flieger(3),
    "froschsprung-1": lambda: froschsprung(1), "froschsprung-2": lambda: froschsprung(2), "froschsprung-3": lambda: froschsprung(3),
    "brett-1": lambda: brett(1), "brett-2": lambda: brett(2), "brett-3": lambda: brett(3), "brett-pause": brett_pause,
    "hampelrunde-1": hampelrunde, "hampelrunde-2": hampelrunde, "hampelrunde-3": hampelrunde,
    "hampelrunde-hampelmann": hampelmann, "hampelrunde-laufen": lambda: laufen(False), "hampelrunde-knie-hoch": lambda: laufen(True),
    "hampelrunde-pause": verschnaufen,
    # instead of the Treppe on some days (gruppe treppe): each move and the walking between
    "laufen-1": lambda: laufen(False), "laufen-2": lambda: laufen(False), "laufen-3": lambda: laufen(False),
    "laufen-laufen": lambda: laufen(False), "laufen-gehen": gehen,
    "kniehub-1": lambda: laufen(True), "kniehub-2": lambda: laufen(True), "kniehub-3": lambda: laufen(True),
    "kniehub-knie-hoch": lambda: laufen(True), "kniehub-gehen": gehen,
    "wechselschritt-1": wechselschritt, "wechselschritt-2": wechselschritt, "wechselschritt-3": wechselschritt,
    "wechselschritt-ausfallschritte": wechselschritt, "wechselschritt-gehen": gehen,
    "bruecke-1": lambda: bruecke(1), "bruecke-2": lambda: bruecke(2), "bruecke-3": lambda: bruecke(3),
    "baum-1": baum, "hund-1": hund, "kobra-1": kobra, "schmetterling-1": schmetterling,
    "teddy-1": lambda: teddy(1), "teddy-2": lambda: teddy(2), "teddy-3": lambda: teddy(3),
    "ballon-1": lambda: ballon(1), "ballon-2": lambda: ballon(2), "ballon-3": lambda: ballon(3),
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
         "innehalten": "gelassenheit",
         "baerengang": "kraft", "flieger": "kraft", "froschsprung": "kraft", "brett": "kraft",
         "hampelrunde": "ausdauer", "laufen": "ausdauer", "kniehub": "ausdauer", "wechselschritt": "ausdauer",
         "bruecke": "beweglichkeit",
         "baum": "beweglichkeit", "hund": "beweglichkeit", "kobra": "beweglichkeit", "schmetterling": "beweglichkeit",
         "teddy": "gelassenheit", "ballon": "gelassenheit"}


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
    # the exercise is the name up to the stage or the part of the time (hampelrunde-knie-hoch)
    area = next(AREAS[key] for key in sorted(AREAS, key=len, reverse=True) if name.startswith(key + "-"))
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
