# fix(achievement): decimal place should always have 4 places

## Goal
The achievement rate in the maimai score display is currently truncated or not formatted consistently. The requirements state that it should always have 4 decimal places (e.g., 100.0000%).

## Scope
- `src/components/maimai/ScoreCard.jsx`: Update the display of `score.achievement`.
- Any other locations where achievement rate is displayed to the user.

## Status: FINALIZED
