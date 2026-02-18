# Learned Skills & Patterns

This document tracks new skills, patterns, and insights learned by the agent during the development process. It serves as a knowledge base to improve future performance.

## Format
**[Skill/Pattern Name]**
- **Context**: When/where was this learned?
- **Insight**: What is the key takeaway?
- **Application**: How should this be applied in the future?
- **Date**: YYYY-MM-DD

---

## Log

**[Agentic Workflow Structure]**
- **Context**: Implementing the agentic feature request workflow.
- **Insight**: Breaking down tasks into Inquiry, Planning, Execution, and Confirmation ensures clarity and user alignment.
- **Application**: Always follow this 4-phase process for every new feature request.
- **Date**: 2026-02-18

**[Explicit vs Implicit Actions]**
- **Context**: Refined song card interactions (auto-copy vs nav).
- **Insight**: Users prefer explicit actions (clicking title to copy) over implicit ones (clicking card to copy) to avoid unintended side effects.
- **Application**: Avoid coupling navigation actions with side-effects like clipboard copying; keep them distinct.
- **Date**: 2026-02-18

**[Modal Layout Optimization]**
- **Context**: Reducing whitespace in song detail modal.
- **Insight**: `SimpleGrid` with 2 columns is highly effective for displaying key-value metadata compactly next to a large image.
- **Application**: Use grid layouts for metadata blocks to balance visual weight against large media elements.
- **Date**: 2026-02-18

**[Object Dependencies in Effects]**
- **Context**: Debugging `ProfilePage` re-fetching on focus.
- **Insight**: Using complex objects (like `user` from AuthContext) as dependencies in `useEffect` or `useCallback` can trigger unintended re-renders/fetches even if properties haven't changed, due to reference inequality on context updates.
- **Application**: Always destructure or select specific primitive properties (e.g., `user.id`) for dependency arrays to ensure stability and prevent unnecessary effect execution.
- **Date**: 2026-02-18

