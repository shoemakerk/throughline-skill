---
name: throughline
description: >
  Dual-domain craft review skill for Figma designers. Invoke with `/throughline` to review
  any section of any Figma file against UX Laws or Visual Storytelling Principles, then write
  a structured Throughline Critique Frame directly to canvas — including color-coded findings
  and a Weave Brief panel. Works on any file structure: long pages, multi-frame canvases,
  nested sections. No file restructuring required. Trigger when the user invokes /throughline,
  asks to review frames or sections against UX principles, wants a Weave Brief generated from
  their design, or wants a craft critique written to canvas.
---

# Throughline

A dual-domain craft review skill. Reviews any section of any Figma file against established
design principles. Writes a structured critique + Weave Brief directly to canvas.

Works on any file structure — long scrolling pages, multi-frame canvases, nested sections.
Designers do not need to restructure their files.

Built for the Config Makeathon 2026. Figma Design only — no FigJam.

---

## Invocation

Full form:
```
/throughline
```

Shorthand with scope (skips the section selection step):
```
/throughline ux hero summary
/throughline story frames 1-3
```

Domain options: `ux` · `story`
Scope: section names, frame names, or "all"

---

## Execution Flow

### Phase 1 — Discover and Present

Run `throughline-discover.js` via `use_figma`. This maps the full page structure
including top-level frames AND named sections within them.

**After the discover call, present the section list to the designer like this:**

> I found the following sections in your file. Which ones should I review?
>
> **Page: [Page Name]**
> ├── [Top-level frame name] (1440 × 2572)
> │   ├── hero (section)
> │   ├── summary (section)
> │   ├── storyboard (section)
> │   └── reflection (section)
>
> Type section names, or say "all" to review the full page.
> You can also specify a domain now: `hero summary ux` or `ux hero summary`.

**If the designer already specified scope in the invocation** (e.g. `/throughline ux hero`),
skip the question and proceed directly with those sections.

**Scope resolution rules:**
- Named sections → match against `sectionList` names (case-insensitive, partial match ok)
- "all" → use the top-level frame(s)
- Numbers like "frames 1-3" → match against storyboard frame children by index
- If ambiguous → ask to clarify before proceeding

### Phase 1b — Resolve Scope

Once sections are confirmed, run `throughline-scope.js` with the chosen node IDs.

This returns:
- `resolvedSections` — node IDs, names, dimensions, child names (for finding references)
- `critiqueFramePlacement` — where to place the Throughline Critique frame on canvas

**Then, in parallel:**
- Call `get_screenshot` on each resolved section node ID
- Call `get_design_context` on each resolved section node ID

These give you visual context + full layer structure for Phase 2 analysis.

### Phase 2 — Analyze

With screenshots and layer structure in context, analyze against the appropriate
principles library. Produce a `CRITIQUE_DATA` object internally — do NOT write to canvas yet.

**Key rule: reference elements by name.**
The layer tree from `get_design_context` gives you actual component and layer names.
Always name the specific element in findings ("the 'Continue' button in the hero section")
not generic descriptions ("a button somewhere").

**Cross-section findings are valid and often the most important.**
A Gestalt: Continuity violation that spans hero → summary → storyboard is a stronger
finding than a single-section observation. Name it explicitly.

Score each applicable principle:
- `✅ Applied` — principle clearly met
- `⚠️ Opportunity` — partially applied or could be stronger  
- `❌ Violated` — principle clearly broken

Only include principles with sufficient evidence to assess.
Skip principles that cannot be evaluated from visible design.

### Phase 3 — Write to Canvas

Fill in `CRITIQUE_DATA` and `PLACEMENT` in `throughline-canvas.js`.
Run via `use_figma`. Returns `frameId` and all `createdNodeIds`.

Save the `frameId` — needed for any in-place updates.

---

## Scope Selection — Detailed Rules

### On a long single page (e.g. a case study website)

The discover call returns a `sectionList` with both the top-level frame
AND its named direct children. Present both levels:

```
1440-casestudy-story (full page, 1440 × 2572)
  → hero
  → summary
  → storyboard
  → reflection
```

Designer can choose sections, not just the full frame. This gives Throughline
targeted context rather than a 2572px screenshot that's too long to interpret well.

**When reviewing sections of a long page:**
- Get screenshots of each chosen section individually
- Note their position within the page (y-coordinate) for context
- Cross-section findings should reference both sections by name

### On a multi-frame canvas (e.g. a storyboard)

The discover call returns multiple top-level frames. Present them as a list:

```
Frame 1: Setup (960 × 540)
Frame 2: Inciting Incident (960 × 540)
Frame 3: Midpoint (960 × 540)
Frame 4: Climax (960 × 540)
Frame 5: Resolution (960 × 540)
```

Designer selects 1–5 frames. Agent reviews them as a sequence.
Cross-frame findings (180° Rule, Visual Pacing, Three-Act Structure) are the priority here.

### On a component file or design system

Treat named components as the reviewable units. Present top-level component names.
Note that UX Laws apply at the pattern level — evaluate the component's behavior
and convention-compliance, not just its visual appearance.

---

## Principles Libraries

### UX Domain (`ux`)

Reference: Jon Yablonski's Laws of UX (lawsofux.com)

1. **Fitts's Law** — Target size and distance. Look for: small tap targets, buried CTAs, edge elements.
2. **Hick's Law** — Decision time vs. number of choices. Look for: menus, option lists, >7 choices.
3. **Miller's Law** — 7±2 items in working memory. Look for: forms, lists, ungrouped data.
4. **Jakob's Law** — Users expect familiar patterns. Look for: navigation, icons, form conventions.
5. **Gestalt: Proximity** — Close elements perceived as related. Look for: card layouts, label spacing.
6. **Gestalt: Similarity** — Alike elements perceived as belonging together. Look for: button/link styles.
7. **Gestalt: Continuity** — Eye follows paths naturally. Look for: reading flow, step indicators.
8. **Von Restorff Effect** — The differing element is remembered. Look for: CTA differentiation.
9. **Peak-End Rule** — Users judge by peak moment and end. Look for: success/error/completion states.
10. **Zeigarnik Effect** — Uncompleted tasks are remembered. Look for: progress indicators, multi-step flows.
11. **Doherty Threshold** — Response under 400ms keeps flow. Look for: loading states, feedback.
12. **Law of Common Region** — Elements in a bounded area are grouped. Look for: cards, modals, panels.
13. **Tesler's Law** — Irreducible complexity. Look for: flows that shift complexity to the user.
14. **Aesthetic-Usability Effect** — Beautiful = perceived as more usable. Look for: visual polish.
15. **Postel's Law** — Accept liberally, send conservatively. Look for: form validation, error messages.

### Story Domain (`story`)

Reference: Classical cinematography, narrative theory, visual communication principles.

1. **Show Don't Tell** — Meaning through image, not caption.
2. **Rule of Thirds** — Subject/horizon at grid intersections.
3. **180° Rule** — Consistent screen direction across cuts.
4. **Visual Hierarchy** — Guide eye to most important element first.
5. **Three-Act Structure** — Setup → Confrontation → Resolution across frames.
6. **Contrast and Tension** — Visual contrast creates emotional energy.
7. **Color as Narrative** — Color conveys emotion and meaning.
8. **Framing and Composition** — What's inside the frame shapes meaning.
9. **Visual Pacing** — Rhythm between frames/shots.
10. **Chekhov's Gun** — Every visible element should matter.
11. **Character Consistency** — Subjects remain visually coherent across frames.
12. **Environmental Storytelling** — Setting reveals context without explanation.
13. **Camera/Perspective Movement** — Movement must be motivated by story.
14. **Sound-Image Relationship** — Audio and visual work together (for motion).
15. **Economy of Storytelling** — Every element earns its place.

---

## Canvas Output Spec

### Frame structure

- Frame name: `"Throughline Critique"` (or `"Throughline Critique v2"` etc. for re-runs)
- Position: `critiqueFramePlacement` from throughline-scope.js (right of all page content,
  aligned to top of reviewed sections)
- Width: 520px
- Background: `#F7F7F7`
- Corner radius: 12px
- Auto-layout: VERTICAL, padding 32px sides, gap 0

### Header block

- "THROUGHLINE" — 22px, Bold, letter-spaced, #1A1A1A
- Domain + date + section names reviewed — 12px, Regular, #666666

### Findings — grouped: ✅ Applied · ⚠️ Opportunity · ❌ Violated

Each finding block:
- Background fill at 12% opacity (green / amber / red)
- Left accent bar 4px (full opacity)
- Principle name + status icon — 11px, Bold, uppercase
- Scope tag — 10px, #888888 (single-section · cross-section · component · interaction)
- Finding — 12px, Regular (reference element by name from layer tree)
- Recommendation — 12px, Italic (one actionable next step)

### Weave Brief section (dark panel #1A1A1A)

- GOAL · PROMPT · RECOMMENDED MODEL · RECOMMENDED WORKFLOW · WEAVE STARTING NODE
- See Weave Brief format below

### What to Do Next section (#F0F0F0)

- 3 specific follow-up suggestions with → arrows
- Must reference actual findings — never generic

---

## Iteration Rules

**Minor revision** (challenge a finding, tweak Weave Brief):
- Update the existing critique frame in place via `throughline-update.js`
- Use `frameId` from the Phase 3 return value

**Re-run** (designer has made changes, wants fresh critique):
- Increment `CRITIQUE_DATA.version`
- Create new frame `"Throughline Critique v[n]"` 48px right of previous
- Add "Changes since v[n-1]" block at top:
  - ✅ Resolved — findings now passing
  - 🆕 New — newly flagged
  - ⚠️ Remaining — still unresolved
- Never overwrite the previous version

---

## Weave Brief Format

```
THROUGHLINE WEAVE BRIEF
────────────────────────────
GOAL
[One sentence — what the asset must achieve based on critique]

PROMPT
[Specific, ready-to-use Weave generation prompt addressing findings]

RECOMMENDED MODEL
[Model name + reason]
Image: Flux (realism) | Ideogram (typography/graphic) | Seedream (precision)
Video: Seedance (motion) | Veo (cinematic) | Sora (complex scenes)

RECOMMENDED WORKFLOW
[Workflow category]
Image Production | Style Control | Compositing | Iteration
Video Production | Motion Graphics | Multi-Model | Batch

WEAVE STARTING NODE
[First node to place in Weave and what input it needs]
────────────────────────────
```

---

## Tone

- Specific — reference actual layer and element names
- Constructive — every finding points forward
- Teaching — briefly explain why the principle matters on violations
- Concise — one finding, one recommendation per principle
- Balanced — ✅ findings matter as much as ❌

---

## What to Do Next Block

Always append after Weave Brief. Specific to actual findings — never generic:

```
WHAT TO DO NEXT
────────────────────────────
→ [Suggested follow-up 1 — most critical finding]
→ [Suggested follow-up 2 — Weave Brief action]
→ [Suggested follow-up 3 — drill-down or re-run suggestion]
────────────────────────────
```
