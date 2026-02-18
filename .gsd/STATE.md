# State Snapshot - Achievement Rate Formatting Phase

**Objective:** Ensure achievement rates always display with 4 decimal places for consistency and precision.

**Changes:**
- **Formatting Fix**: Updated `ScoreCard.jsx` to use `.toFixed(4)` for the achievement rate display.
- **Precision**: Ensured that the value is parsed as a float before formatting to handle any potential string inputs from the parser.

**Files Touched:**
- `src/components/maimai/ScoreCard.jsx`

**Verification:**
- Manual verification via Profile and Export pages.
- Broad search confirmed no other direct displays of `achievement` missed.

**Risks/Debt:**
- None.

**Next Wave TODO:**
- Proceed with any further UI refinements or feature requests.
