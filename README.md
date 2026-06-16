# Throughline

**A dual-domain craft review skill for Figma.**

Throughline evaluates any section of any Figma file against established design principles, then writes a structured critique frame directly to your canvas, including color-coded findings and a ready-to-use Figma Weave Brief.

> Most storyboard and design tools help you capture what you're making.
> Throughline helps you evaluate whether it works, before you spend a single generation credit.

Built for the [Config Makeathon 2026](https://config.figma.com/makeathon). Figma Design only.

---

## What it does

Invoke `/throughline` in the Figma Agents panel. Throughline will:

1. **Map your file** — reads the page structure, surfaces named sections and frames
2. **Ask what to review** — you select sections or frames to evaluate
3. **Analyze against principles** — evaluates against 15 UX Laws or 15 Story/Cinematography principles
4. **Write to canvas** — places a structured Throughline Critique Frame to the right of your content

The critique frame includes:

- **Color-coded findings** — Working Well · Worth Considering · Review
- **Director's Brief** — a ready-to-use Figma Weave generation prompt targeting your weakest area
- **What to Do Next** — three specific, actionable follow-up steps
- **Workflow Loop strip** — showing where you are in the Design, Throughline, Weave, Make cycle
- **Director's Cut** — an empty field for you to write your own intent statement

---

## Two domains

### UX Domain (`/throughline ux`)

Evaluates UI designs against the [Laws of UX](https://lawsofux.com). 15 principles covering Fitts's Law, Hick's Law, Miller's Law, Gestalt, Von Restorff, Peak-End Rule, and more.

### Story Domain (`/throughline story`)

Evaluates storyboards, shot sequences, and GenAI film production against cinematography and narrative principles: Show Don't Tell, 180 Rule, Visual Pacing, Three-Act Structure, Contrast and Tension, Character Consistency, Environmental Storytelling, Chekhov's Gun, Economy of Storytelling, and more.

---

## The Workflow Loop

Throughline sits at two points in the creative loop:

```
Design -> /throughline -> Weave -> Make -> Design
```

Every critique frame shows where you are in this loop and what comes next.
The Director's Brief connects directly to Figma Weave. Paste the prompt into a Weave node and generate.

---

## Installation

### Prerequisites

- Figma Pro account with AI Agent access
- Figma MCP server running locally (see [Figma MCP setup guide](https://github.com/figma/mcp-server-guide))
- Claude Desktop or another MCP-compatible AI client

### Setup

1. Clone this repository:

```bash
git clone https://github.com/shoemakerk/throughline-skill.git
```

2. Add the skill to your Figma Agent configuration. In your MCP settings, add the path to `SKILL.md`:

```json
{
  "skills": [
    "/path/to/throughline-skill/SKILL.md"
    // or use the raw GitHub URL:
    // "https://raw.githubusercontent.com/shoemakerk/throughline-skill/main/SKILL.md"
  ]
}
```

3. Open any Figma Design file and invoke the skill from the Agents panel:

```
/throughline
```

---

## Files

| File | Purpose |
|---|---|
| `SKILL.md` | Agent-facing skill descriptor — install this |
| `guidelines.md` | Always-on ambient project memory |
| `throughline-discover.js` | Phase 1: maps page structure, excludes hidden nodes |
| `throughline-scope.js` | Phase 1b: resolves section IDs to coordinates |
| `throughline-canvas.js` | Phase 3: writes the critique frame to canvas |
| `throughline-update.js` | In-place update of an existing critique frame |
| `throughline-loop-button.jsx` | React component for Figma Make storyboard app |

---

## How it works

**Phase 1 - Discover**
`throughline-discover.js` reads the current page, maps all visible frames and sections, excludes hidden nodes, and returns placement coordinates for the critique frame.

**Phase 1b - Scope**
The agent presents the section list and asks which sections to review. `throughline-scope.js` resolves the chosen sections to node IDs and absolute coordinates.

**Phase 2 - Analyze**
The agent calls `get_screenshot` and `get_design_context` on the chosen sections. It evaluates visible content against the principles library and builds `CRITIQUE_DATA` internally.

**Phase 3 - Write to Canvas**
The agent fills in `CRITIQUE_DATA` and `PLACEMENT` in `throughline-canvas.js` and executes it via `use_figma`. The critique frame appears on canvas, permanent and ready for the Director's Cut.

---

## Storyboard Template

Throughline ships with a production storyboard template for GenAI short films.

The template includes:

- Scene-aware hierarchy (Act, Scene, Shot)
- Pill selectors for shot type, camera movement, screen direction, 180 Rule, emotional tone, time of day, and AI model
- Generation status chips (CONCEPT, GENERATED, APPROVED)
- Status bar with IN PROGRESS, IN REVIEW, APPROVED variants
- Throughline Skill block in the sidebar
- Read Me panel with workflow loop documentation

The sidebar includes three locked reference sections:

- Reference Key — all pill values defined with visual examples
- Writing Tips — field-by-field prompt writing guidance for Shot Intent, Action/Staging, Dialogue/VO, Audio/SFX, Visual Continuity, and AI Model Used
- Glossary — 10 cinematography terms defined in plain language: 180 Rule, Screen Direction, Shot Type, Camera Movement, Beat, Scene Tone, Visual Continuity, Golden Hour, Transition Type, and Throughline

---

## Built by

Built and demonstrated by Kelly Shoemaker at Config Makeathon 2026.

---

## License

MIT. Use freely, build on it, share what you make.

---

## Roadmap

**Multi-prompt Director's Brief**
The current Director's Brief generates one Weave prompt targeting the highest-priority shot. The next version will scan all CONCEPT-status shot cards, generate a targeted Weave prompt for each missing shot using adjacent generated images as style references, and present them as a numbered prompt stack — so designers can move through the storyboard systematically without writing a single prompt from scratch.

**Screen direction and 180 Rule diagrams**
Spatial principle findings (180 Rule, Visual Pacing) will include SVG diagram annotations showing screen direction across cuts — making spatial violations immediately visible rather than described in text.

**Scene-level evaluation**
Throughline currently evaluates shots individually and across the full storyboard. Scene-level evaluation will target all shots within a single scene header, enabling more precise findings about spatial continuity and emotional arc within a single location and time period.

**UX domain visual findings**
Findings for Fitts Law, Gestalt, and other spatial UX principles will include thumbnail annotations pulled from the actual design frames — showing the problem visually rather than describing it in text.

**Throughline App**
A Figma Make interface that wraps the full skill workflow. Designers fill in shot cards, run Throughline, and receive critique without touching the Agents panel. Includes drag-to-reorder shots, live Weave Brief preview, multi-prompt generation for all CONCEPT shots, and PDF export.
