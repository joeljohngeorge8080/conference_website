/*
 * Animation progress tables (pure functions, no DOM).
 *
 * t is the normalised paper animation, tuned against the reference video:
 *   0.00        flat
 *   0.04 - 0.42 crumple to a compact ball
 *   0.42 - 1.00 the ball stays crumpled while it rolls and docks in Call for Papers,
 *               then unfolds back to the flat sheet (see unfoldAt)
 */
const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const clamp01 = (x) => Math.min(1, Math.max(0, x));

export const T_BALL = 0.42;

/** 0 flat .. 1 ball */
export function wrapAt(t) {
  return smooth(0.04, T_BALL, t);
}

/** crumple runs over scroll [s0, s1]; before it is flat, after it is a ball */
export function tAt(scroll, s0, s1) {
  return T_BALL * clamp01((scroll - s0) / (s1 - s0));
}

/**
 * Pose angles. Flat paper sits at tiltStart; once crumpled the ball rolls
 * over [s1, sEnd] and settles at tiltEnd (all rolling terms are 0 at both ends).
 */
export function tumbleAt(scroll, s1, sEnd, tiltStart, tiltEnd) {
  const u = clamp01((scroll - s1) / (sEnd - s1));
  const TAU = Math.PI * 2;
  return {
    rx: 0.7 * Math.sin(TAU * u * 2),
    ry: TAU * 2 * u,
    rz: tiltStart + (tiltEnd - tiltStart) * u + 0.4 * Math.sin(TAU * u),
  };
}

/** 0 while the ball travels and docks, 0 -> 1 as it unfolds over [sEnd, sUnfold] */
export function unfoldAt(scroll, sEnd, sUnfold) {
  return smooth(sEnd, sUnfold, scroll);
}
