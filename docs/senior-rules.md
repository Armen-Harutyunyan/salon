# Senior Rules

These rules are the implementation contract for this repository.

## Product Rules

- Booking state must be derived from database facts, not client guesses.
- Admin edits must be able to explain every visible schedule change.
- A salon worker should be able to recover from a bad schedule edit without touching code.
- Mini app UX must reduce steps, not add decorative friction.

## Architecture Rules

- Keep mini app, admin panel, and server logic in one codebase until scale forces separation.
- Put booking rules on the server and treat the client as an input surface.
- Prefer explicit relational models over flexible but ambiguous document shapes.
- Keep business logic in services, not inside UI components or collection config sprawl.
- Do not hide critical booking rules in hooks without test coverage.

## Data Rules

- Every booking must store both `start` and `end`, not just duration.
- Time comparisons must use one normalized timezone strategy.
- Status transitions must be explicit and enumerable.
- Soft business states are allowed; impossible states are not.
- Schema must support future audit fields without destructive redesign.

## API Rules

- Booking creation must be validated again on the server even if the UI pre-validates.
- Public endpoints must expose only what the mini app needs.
- Admin-only mutations must be isolated from public booking routes.
- Never trust Telegram client payloads without verification.

## UI Rules

- The first booking path should be obvious in under five seconds.
- Show only actionable choices; disabled noise is not a feature.
- Slot lists must feel reliable and deterministic.
- Admin screens should optimize for speed of correction, not visual novelty.

## Quality Rules

- Implement the smallest thing that preserves future correctness.
- Avoid premature abstractions unless they remove concrete duplication.
- Name things by business meaning, not framework behavior.
- Prefer boring code over clever code in scheduling logic.
- If a rule is hard to test, the design is probably wrong.

## Delivery Rules

- Each phase must leave the project deployable.
- No placeholder logic in booking conflicts.
- No fake success states in UI for unfinished backend actions.
- Document any domain assumption the moment it becomes code.
