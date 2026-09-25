import { LANDMARK, angleAt, betterSide, sideIndices, kneeForwardOffset } from './pose-angles'

// Every rule returns either null (nothing to flag this frame) or
// { issueType, label, severity }. Thresholds are deliberately conservative
// (approximate, not clinical) — this is a beta feature, not a certified
// form-checking product.

function squatRules(landmarks) {
  const issues = []
  const side = betterSide(landmarks, LANDMARK.LEFT_KNEE, LANDMARK.RIGHT_KNEE)
  const idx = sideIndices(side)
  const kneeAngle = angleAt(landmarks[idx.hip], landmarks[idx.knee], landmarks[idx.ankle])
  const hipAngle = angleAt(landmarks[idx.shoulder], landmarks[idx.hip], landmarks[idx.knee])
  const kneeOffset = kneeForwardOffset(landmarks, idx)

  if (kneeAngle !== null && kneeAngle < 100) {
    // near the bottom of a rep — depth check makes sense here
    if (hipAngle !== null && hipAngle < 55) {
      issues.push({ issueType: 'excessive_forward_lean', label: 'Leaning too far forward at the bottom', severity: 'medium' })
    }
  }
  if (kneeOffset !== null && kneeOffset < -0.35) {
    issues.push({ issueType: 'knee_valgus', label: 'Knee(s) caving in past the ankle line', severity: 'high' })
  }
  return issues
}

function pushUpRules(landmarks) {
  const issues = []
  const side = betterSide(landmarks, LANDMARK.LEFT_ELBOW, LANDMARK.RIGHT_ELBOW)
  const idx = sideIndices(side)
  const elbowAngle = angleAt(landmarks[idx.shoulder], landmarks[idx.elbow], landmarks[idx.wrist])
  const bodyLineAngle = angleAt(landmarks[idx.shoulder], landmarks[idx.hip], landmarks[idx.ankle])

  if (bodyLineAngle !== null && bodyLineAngle < 155) {
    const hip = landmarks[idx.hip]
    const shoulder = landmarks[idx.shoulder]
    const ankle = landmarks[idx.ankle]
    if (hip && shoulder && ankle) {
      const expectedHipY = shoulder.y + ((ankle.y - shoulder.y) * (hip.x - shoulder.x)) / Math.max(0.001, ankle.x - shoulder.x)
      issues.push(
        hip.y > expectedHipY
          ? { issueType: 'hips_sagging', label: 'Hips sagging toward the floor', severity: 'medium' }
          : { issueType: 'hips_piking', label: 'Hips too high, piking up', severity: 'low' }
      )
    }
  }
  if (elbowAngle !== null && elbowAngle < 95) {
    issues.push({ issueType: 'good_depth', label: 'Good depth at the bottom', severity: 'low' })
  }
  return issues
}

function plankRules(landmarks) {
  const issues = []
  const side = betterSide(landmarks, LANDMARK.LEFT_HIP, LANDMARK.RIGHT_HIP)
  const idx = sideIndices(side)
  const bodyLineAngle = angleAt(landmarks[idx.shoulder], landmarks[idx.hip], landmarks[idx.ankle])
  if (bodyLineAngle !== null && bodyLineAngle < 160) {
    issues.push({ issueType: 'hip_alignment', label: 'Hips out of line with shoulders/ankles (sagging or piking)', severity: 'medium' })
  }
  return issues
}

function lungeRules(landmarks) {
  const issues = []
  const side = betterSide(landmarks, LANDMARK.LEFT_KNEE, LANDMARK.RIGHT_KNEE)
  const idx = sideIndices(side)
  const frontKneeAngle = angleAt(landmarks[idx.hip], landmarks[idx.knee], landmarks[idx.ankle])
  const kneeOffset = kneeForwardOffset(landmarks, idx)

  if (frontKneeAngle !== null && frontKneeAngle < 100 && kneeOffset !== null && kneeOffset > 0.6) {
    issues.push({ issueType: 'knee_past_toes', label: 'Front knee traveling well past the toes', severity: 'low' })
  }
  return issues
}

function deadliftRules(landmarks, prevHipAngle) {
  const issues = []
  const side = betterSide(landmarks, LANDMARK.LEFT_HIP, LANDMARK.RIGHT_HIP)
  const idx = sideIndices(side)
  const hipAngle = angleAt(landmarks[idx.shoulder], landmarks[idx.hip], landmarks[idx.knee])
  const kneeAngle = angleAt(landmarks[idx.hip], landmarks[idx.knee], landmarks[idx.ankle])

  if (hipAngle !== null && kneeAngle !== null && prevHipAngle != null) {
    const hipDelta = hipAngle - prevHipAngle
    if (hipDelta > 12 && kneeAngle < 130) {
      issues.push({ issueType: 'hips_rising_early', label: 'Hips rising faster than the chest — bar path may be drifting', severity: 'medium' })
    }
  }
  return { issues, hipAngle }
}

const RULE_LABELS = {
  squat: 'Squat',
  'push-up': 'Push-up',
  plank: 'Plank',
  lunge: 'Lunge',
  deadlift: 'Deadlift',
  other: 'Other (Auto-detect)',
}

export function supportedExercises() {
  return Object.entries(RULE_LABELS).map(([slug, label]) => ({ slug, label }))
}

// Evaluates one sampled frame. `state` carries anything a rule needs to
// remember between frames (currently only used by the deadlift rule).
export function evaluateFrame(exerciseSlug, landmarks, state = {}) {
  if (!landmarks || landmarks.length < 29) return { issues: [], state }

  switch (exerciseSlug) {
    case 'squat':
      return { issues: squatRules(landmarks), state }
    case 'push-up':
      return { issues: pushUpRules(landmarks), state }
    case 'plank':
      return { issues: plankRules(landmarks), state }
    case 'lunge':
      return { issues: lungeRules(landmarks), state }
    case 'deadlift': {
      const { issues, hipAngle } = deadliftRules(landmarks, state.prevHipAngle)
      return { issues, state: { prevHipAngle: hipAngle } }
    }
    case 'other': {
      const issues = [
        ...squatRules(landmarks),
        ...pushUpRules(landmarks),
        ...plankRules(landmarks),
        ...lungeRules(landmarks),
      ]
      return { issues, state }
    }
    default:
      return { issues: [], state }
  }
}

// Collapses per-frame hits into a compact list: dedupe by issueType, keep
// the earliest timestamp, count how many sampled frames triggered it, and
// drop anything that only fired once or twice (noise, not a pattern).
export function aggregateIssues(rawHits) {
  const byType = new Map()
  for (const hit of rawHits) {
    const existing = byType.get(hit.issueType)
    if (existing) {
      existing.frameCount += 1
      existing.timestampSeconds = Math.min(existing.timestampSeconds, hit.timestampSeconds)
    } else {
      byType.set(hit.issueType, { ...hit, frameCount: 1 })
    }
  }
  return Array.from(byType.values())
    .filter((issue) => issue.frameCount >= 3)
    .sort((a, b) => b.frameCount - a.frameCount)
}
