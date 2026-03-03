---
description: Search web for technical information
---

# Web Search

Search the web for technical information to inform decisions, API documentation, library comparisons, or research needs.

## What This Does

1. **Formulates query** - Converts request to search query
2. **Executes search** - Uses web search capability
3. **Analyzes results** - Extracts relevant information
4. **Summarizes findings** - Presents actionable insights
5. **Cites sources** - Provides links for verification

## Arguments

- **Query**: Search terms or question
- **--domain <site>**: Optional - Prioritize specific domain

## When to Use

- Evaluating libraries or frameworks
- Finding API documentation
- Checking current best practices
- Researching error messages
- Comparing implementation approaches
- Getting up-to-date information on tools/services
- Verifying syntax or methods

## Process Flow

### 1. Formulate Query
Parse user's request into focused search query.

**Good queries:**
- "Next.js 14 app router authentication best practices"
- "Prisma  vs Drizzle ORM comparison 2024"
- "how to fix CORS error Express.js"
- "React 18 useEffect cleanup function"

**Bad queries:**
- "how to code" (too broad)
- "best database" (too vague)

### 2. Execute Search
Uses web search with:
- **Query**: Formulated search terms
- **Domain** (optional): e.g., `docs.python.org`, `stackoverflow.com`

### 3. Analyze Results
From search results:
- Extract key information relevant to need
- Note authoritative sources
- Identify patterns across results
- Flag contradictions or outdated info

### 4. Summarize Findings
Presents clearly:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► WEB SEARCH RESULTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Query: {query}

───────────────────────────────────────────────────────

KEY FINDINGS
────────────
• {finding 1 with details}
• {finding 2 with details}
• {finding 3 with details}

RECOMMENDATION
──────────────
{actionable recommendation based on findings}

SOURCES
───────
1. {source title} — {URL}
2. {source title} — {URL}
3. {source title} — {URL}

───────────────────────────────────────────────────────

💡 TIP

{Additional context or warning based on findings}

───────────────────────────────────────────────────────
```

## Example Usage

Research authentication options:
```
/web-search Next.js authentication best practices 2026
```

Compare frameworks:
```
/web-search Prisma vs Drizzle ORM performance comparison
```

Find documentation:
```
/web-search React useEffect cleanup function --domain react.dev
```

Debug error:
```
/web-search TypeError: Cannot read property 'map' of undefined React
```

## Domain Targeting

Use `--domain` for specific sources:

```
/web-search useState --domain react.dev
/web-search Python async await --domain docs.python.org
/web-search Express CORS --domain expressjs.com
```

## Integration with Workflows

**During planning (/plan):**
```
/plan 3
→ Need to choose database
→ /web-search PostgreSQL vs MongoDB 2026
→ Use findings in RESEARCH.md
```

**During debugging (/debug):**
```
/debug Memory leak
→ Form hypothesis about cause
→ /web-search Node.js memory leak detection tools
→ Test hypothesis with recommended tools
```

**During execution (/execute):**
```
/execute 2
→ Uncertain about API syntax
→ /web-search Stripe API create customer Node.js
→ Use correct syntax
```

## Result Quality

**High-quality results include:**
- ✅ Recent information (check dates)
- ✅ Official documentation links
- ✅ Stack Overflow accepted answers
- ✅ GitHub repos with good  stars
- ✅ Technical blog posts from experts

**Be cautious of:**
- ⚠️ Outdated information (>2 years old)
- ⚠️ Unverified sources
- ⚠️ Contradictory information
- ⚠️ Deprecated methods
- ⚠️ AI-generated content without verification

## Best Practices

**Be specific:**
```
❌ "authentication"
✅ "JWT authentication with refresh tokens Node.js Express"
```

**Include versions:**
```
❌ "React hooks"
✅ "React 18 hooks best practices"
```

**Include year for current info:**
```
❌ "best CSS framework"
✅ "best CSS framework 2026"
```

**Use error messages:**
```
❌ "fix error"
✅ "TypeError: fetch is not defined Node.js 16"
```

## Common Use Cases

**Library comparison:**
```
/web-search {library A} vs {library B} pros cons
```

**API documentation:**
```
/web-search {service} API {operation} documentation --domain {official-site}
```

**Error resolution:**
```
/web-search {exact error message}
```

**Best practices:**
```
/web-search {technology} {task} best practices {current year}
```

**Version migration:**
```
/web-search migrate from {old version} to {new version} guide
```

## After Search

**Document findings:**
- Add to `.gsd/phases/{N}/RESEARCH.md`
- Update DECISIONS.md with choice rationale  
- Include source links

**Verify information:**
- Test code snippets
- Check official docs
- Consider context (your stack, versions)

## Reference

Full workflow: `.agent/workflows/web-search.md`
Related:
- `/research-phase` - Deep technical research
- `/plan` - Use research in planning
- `/debug` - Research during debugging
