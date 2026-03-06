# Claude Plus for Miniverse

**Status:** Idea — needs commercial and technical scoping
**Filed:** 2026-03-01

## Concept
Users can enable Claude (or another model) as a paid add-on inside Miniverse. This gives them the full Claude experience but with awareness of their Miniverse project — room files, Three.js setup, conversation history with Archie, etc.

## Why it's valuable
- The context injection is what differentiates it from just opening claude.ai in another tab
- Claude inside Miniverse knows the room code, the user's design history, the platform constraints
- Revenue opportunity via subscription or per-use pricing

## Open questions
- **Anthropic's terms**: Is reselling API access with a markup/revenue share allowed under their usage policy? This needs a business conversation with Anthropic.
- **Differentiation**: What can Claude Plus do that Archie can't? General-purpose coding? Broader creative direction? Research?
- **Cost model**: Opus 4.6 is expensive per call. Per-message, per-month, or per-room pricing? Does the margin cover API costs?
- **Revenue share**: Is Anthropic open to a rev-share model for embedded Claude experiences? Precedent with other platforms?
- **Multi-model**: "or another model once we get there" — should this be model-agnostic from the start?

## Technical notes
- Archie + Developer pipeline is already a specialized Claude experience, just branded and constrained for room-building
- Lifting constraints and giving users general-purpose Claude with project context is the core technical shift
- Would need: token metering, usage tracking, billing integration, rate limiting per user
