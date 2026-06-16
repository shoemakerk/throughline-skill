# Throughline — Project Guidelines

Always-on rules for every Throughline session. Read before any action.

---

## What Throughline is

A dual-domain craft review skill for Figma Design files. It reads a designer's
work, evaluates it against UX Laws or Visual Storytelling Principles, and writes
a structured critique + Weave Brief directly to canvas.

Two domains: `ux` · `story`
One output: a Throughline Critique Frame on the Figma canvas.

---

## Session rules — always follow these

### Before doing anything
- Run `throughline-discover.js` first. Always. Never skip discovery.
- Do not analyze, screenshot, or write to canvas before discovery completes.
- Do not assume the file structure. Read it.

### Before analyzing
- Confirm scope with the designer. Present the section list. Wait for a response.
- Exception: scope was already given in the invocation (e.g. `/throughline ux hero`). Confirm it, then proceed.
- Never review more than 3 sections in a single run. If the designer asks for more, suggest splitting into two runs.

### Before writing to canvas
- Complete Phase 2 analysis fully before opening the canvas script.
- Never write partial findings to canvas. The frame goes up once, complete.
- Check whether a Throughline Critique Frame already exists on the page:
  - If yes, and the designer wants a revision → use `throughline-update.js` (in-place)
  - If yes, and the designer has made changes and wants a re-run → increment version, new frame
  - If no → create fresh frame

### Never do these
- Never overwrite an existing Throughline Critique Frame
- Never combine discovery + analysis + canvas write into a single prompt turn
- Never invent layer or element names — use only names from the design context
- Never produce generic findings ("the layout could be improved") — every finding names a specific element
- Never skip the Weave Brief — it is required in every critique frame
- Never skip the What to Do Next block — it is required in every critique frame

---

## Credit efficiency rules

### Model selection by phase
- **Discovery (Phase 1)** — lightweight read. Use the default or Sonnet model.
- **Scope resolution (Phase 1b)** — lightweight read. Use the default or Sonnet model.
- **Analysis (Phase 2)** — reasoning-heavy. Use Sonnet. Use Opus only if the design
  is complex, the findings are ambiguous, or the first Sonnet pass is clearly insufficient.
- **Canvas write (Phase 3)** — mechanical execution. Use the default or Sonnet model.
- **In-place update** — minimal. Use the default model.

### Prompt discipline
- Each prompt covers exactly one phase. Never combine phases in a single prompt.
- Follow-up prompts name exactly what changes, how it changes, and what stays the same.
- If a finding needs to be revised, use `throughline-update.js` — do not re-run the full canvas.
- If you are unsure whether a finding is correct, ask the designer before writing to canvas.
  One clarifying question costs less than a re-run.

### Context discipline
- Only fetch screenshots and design context for sections the designer has confirmed.
- Do not fetch the full page context for a section review. Fetch by section node ID.
- If the designer says "review everything," ask them to pick the 2–3 most important sections first.
- Start a new Make session for each distinct critique run. Do not accumulate long chat history
  across multiple files or multiple critique versions — it adds cost without adding value.

### When to stop and ask
If any of these are true, stop and ask before proceeding:
- The scope is ambiguous (section names don't match, multiple possible interpretations)
- The design context returned unusually large layer trees (>50 top-level children in a section)
- The screenshot shows a state that doesn't match what the designer described
- A finding would require reviewing a section that hasn't been fetched yet

---

## Finding quality rules

Every finding must pass these checks before it goes to canvas:

1. **Named** — references a specific element by its layer name or visible label
2. **Evidenced** — grounded in something visible in the screenshot or layer structure
3. **Principled** — names the specific UX Law or Story Principle being assessed
4. **Scoped** — tagged as single-section, cross-section, component, or interaction
5. **Actionable** — the recommendation is one concrete step, not a general direction

If a finding fails any of these, it does not go to canvas. Either sharpen it or drop it.

**Finding count guidance:**
- 3 findings minimum per critique (not useful below this)
- 7 findings maximum per critique (not useful above this — too much to act on)
- Aim for a mix: at least one ✅, at least one ⚠️, at least one ❌

---

## Weave Brief rules

Every Weave Brief must:
- Address at least one ❌ or ⚠️ finding directly
- Name a specific model with a reason (not just a category)
- Include a prompt that is specific enough to paste directly into Weave
- Specify a starting node that tells the designer exactly where to begin

If the section has no visual assets (e.g. a pure text section), the Weave Brief
should focus on what visual asset *could* strengthen the section, not what already exists.

---

## Versioning rules

- First critique: `"Throughline Critique"` — no version number
- Second critique (designer made changes): `"Throughline Critique v2"` — new frame, diff block at top
- Third and beyond: increment version number
- In-place minor revision: no new frame, no version change, update node in place
- Never delete a previous version frame — always place new frames 48px to the right

---

## File references

| File | When to use |
|------|-------------|
| `throughline-discover.js` | Start of every session — maps page structure |
| `throughline-scope.js` | After designer confirms sections — resolves node IDs |
| `throughline-canvas.js` | Phase 3 — writes full critique frame to canvas |
| `throughline-update.js` | Minor revision — updates a single finding or Weave field in place |
| `SKILL.md` | Full reference — principles libraries, canvas spec, flow details |

---

## Workflow loop

Throughline sits at two points in the Figma workflow loop:

```
Design → Throughline → Generate → Make → prototype-to-figma → Design → Throughline v2
  ↑ stage 1              ↑ stage 3    ↑ stage 4     ↑ stage 5              ↑ stage 6
```

Every critique frame includes a loop strip showing the current stage.

### The Make loop button

The storyboard Make app includes a `ThroughlineButton` component that:
- Analyzes the current shot data client-side against Story principles
- Writes the critique frame directly to the linked Design file
- Returns a deep link to the critique frame on canvas

Setup required in the Make app:
- `FIGMA_ACCESS_TOKEN` — personal access token with write permissions
- `FIGMA_FILE_KEY` — from the Design file URL

The button closes the loop without any manual copy-pasting or context switching.

### prototype-to-figma integration

After a Make prototype is ready, run the `prototype-to-figma` skill to bring
it back to Figma as structured frames with interaction annotations. Then run
Throughline v2 on those frames. The version diff block at the top of the v2
critique frame shows what changed since v1.
