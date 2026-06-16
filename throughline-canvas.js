/**
 * throughline-canvas.js
 * ─────────────────────
 * Throughline Critique Frame builder for use_figma.
 *
 * HOW TO USE THIS FILE
 * ────────────────────
 * This is a TEMPLATE. Before calling use_figma:
 *
 * 1. Replace the CRITIQUE_DATA object below with the actual critique content
 *    generated during Phase 2 analysis.
 * 2. Replace PLACEMENT with the x/y values returned from the Phase 1 discovery call.
 * 3. Pass this entire file as the `code` parameter to use_figma.
 *
 * REQUIRED: Always pass skillNames: "throughline" when calling use_figma with this script.
 *
 * FONT NOTE: This script uses Inter. Inter Regular, Bold, and Italic are preloaded
 * in most Figma environments. If you hit a font error, add:
 *   await figma.loadFontAsync({ family: "Inter", style: "Italic" })
 * before the first text node that uses italic style.
 */

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1: FILL IN THIS DATA BEFORE RUNNING
// ─────────────────────────────────────────────────────────────────────────────

const PLACEMENT = {
  x: 2400,   // Replace with placementX from Phase 1 discovery call
  y: 0       // Match the y of the analyzed frames (usually 0)
}

const CRITIQUE_DATA = {
  domain: "UX",                          // "UX" or "Story"
  date: "June 5, 2026",                  // Today's date
  framesReviewed: ["Sign In", "Dashboard"],  // Names of reviewed frames
  version: 1,                            // Increment for re-runs

  // ── FINDINGS ──────────────────────────────────────────────────────────────
  // Only include principles with an actual finding.
  // status: "applied" | "opportunity" | "violated"
  // scope: "single-frame" | "component" | "interaction" | "cross-frame"
  findings: [
    {
      status: "applied",
      principle: "Gestalt: Proximity",
      scope: "component",
      finding: "The form fields in the Sign In frame are tightly grouped with consistent 8px gaps, clearly signaling they belong together.",
      recommendation: "Maintain this rhythm across all form layouts in the design system."
    },
    {
      status: "opportunity",
      principle: "Von Restorff Effect",
      scope: "single-frame",
      finding: "The primary CTA 'Continue' in the Sign In frame uses the same visual weight as the 'Sign in with Google' option.",
      recommendation: "Increase contrast on 'Continue' — filled solid, higher color saturation — so the primary action reads immediately."
    },
    {
      status: "violated",
      principle: "Fitts's Law",
      scope: "single-frame",
      finding: "The 'Forgot password?' link in the Sign In frame is 11px and placed in the bottom-right corner — small, distant, and hard to tap.",
      recommendation: "Increase tap target to minimum 44×44pt and move it directly below the password field where the eye already is."
    }
  ],

  // ── WEAVE BRIEF ───────────────────────────────────────────────────────────
  weaveBrief: {
    goal: "Generate a hero image for the Sign In screen that communicates trust and forward motion without relying on text.",
    prompt: "A softly lit abstract background suggesting digital connection and security — cool blue tones, subtle light trails, no UI elements, no text, landscape 16:9, photorealistic but not stock-photo generic.",
    model: "Flux — precision and realism, matches the product's professional register",
    workflow: "Image Production → Style Control",
    startingNode: "Prompt Node: paste the prompt above. Connect to a Flux image node. Set output ratio to match the hero frame dimensions (e.g. 1440×900)."
  },

  // ── WHAT TO DO NEXT ───────────────────────────────────────────────────────
  // Must be specific to the actual findings — never generic.
  whatToDoNext: [
    "Fix the 'Forgot password?' tap target first — it's the highest-friction point in the Sign In flow and a quick win.",
    "Take the Weave Brief into Figma Weave: paste the prompt into a Flux node and generate 3 hero image variants to replace the placeholder.",
    "After fixing the CTA contrast, re-run Throughline on the Sign In frame only: type `/throughline` → `ux` → select Sign In → ask to re-run on changes."
  ]
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2: SCRIPT — do not edit below unless changing layout logic
// ─────────────────────────────────────────────────────────────────────────────

const createdNodeIds = []
const mutatedNodeIds = []

// Load all font weights we'll use
await Promise.all([
  figma.loadFontAsync({ family: "Inter", style: "Regular" }),
  figma.loadFontAsync({ family: "Inter", style: "Bold" }),
  figma.loadFontAsync({ family: "Inter", style: "Italic" }),
  figma.loadFontAsync({ family: "Inter", style: "Medium" }),
])

// ── Color helpers ─────────────────────────────────────────────────────────

const solid = (r, g, b, a = 1) => [{ type: 'SOLID', color: { r, g, b }, opacity: a }]

const COLORS = {
  bg:           solid(0.969, 0.969, 0.969),         // #F7F7F7
  white:        solid(1, 1, 1),
  headerBg:     solid(1, 1, 1),
  dark:         solid(0.102, 0.102, 0.102),          // #1A1A1A
  mid:          solid(0.4, 0.4, 0.4),                // #666
  light:        solid(0.533, 0.533, 0.533),          // #888
  divider:      solid(0.882, 0.882, 0.882),          // #E1E1E1
  weaveBg:      solid(0.102, 0.102, 0.102),          // #1A1A1A (dark panel)
  weaveFg:      solid(1, 1, 1),                      // white text on dark
  weaveLabel:   solid(0.6, 0.6, 0.6),                // #999 muted label on dark
  nextBg:       solid(0.941, 0.941, 0.941),          // #F0F0F0
  // Status fills (at low opacity)
  greenFill:    solid(0.133, 0.769, 0.369, 0.12),    // #22C55E @ 12%
  amberFill:    solid(0.961, 0.620, 0.043, 0.12),    // #F59E0B @ 12%
  redFill:      solid(0.937, 0.267, 0.267, 0.12),    // #EF4444 @ 12%
  // Status accents (full opacity)
  greenAccent:  solid(0.133, 0.769, 0.369),
  amberAccent:  solid(0.961, 0.620, 0.043),
  redAccent:    solid(0.937, 0.267, 0.267),
}

const STATUS_META = {
  applied:     { icon: "✅", label: "APPLIED",     fill: COLORS.greenFill, accent: COLORS.greenAccent },
  opportunity: { icon: "⚠️", label: "OPPORTUNITY", fill: COLORS.amberFill, accent: COLORS.amberAccent },
  violated:    { icon: "❌", label: "VIOLATED",     fill: COLORS.redFill,   accent: COLORS.redAccent },
}

// ── Text node helper ──────────────────────────────────────────────────────

function makeText(opts) {
  // opts: { characters, size, bold, italic, medium, color, autoResize, width }
  const t = figma.createText()
  t.fontName = {
    family: "Inter",
    style: opts.bold ? "Bold" : opts.italic ? "Italic" : opts.medium ? "Medium" : "Regular"
  }
  t.fontSize = opts.size || 13
  t.fills = opts.color || COLORS.dark
  if (opts.width) {
    t.textAutoResize = 'HEIGHT'
    t.resize(opts.width, 20)
  } else {
    t.textAutoResize = 'WIDTH_AND_HEIGHT'
  }
  t.characters = opts.characters || ""
  if (opts.lineHeight) t.lineHeight = opts.lineHeight
  if (opts.letterSpacing) t.letterSpacing = opts.letterSpacing
  createdNodeIds.push(t.id)
  return t
}

// ── Auto-layout frame helper ───────────────────────────────────────────────

function makeAL(direction, opts = {}) {
  const f = figma.createFrame()
  f.layoutMode = direction  // 'VERTICAL' or 'HORIZONTAL'
  f.primaryAxisAlignItems = opts.mainAxis || 'MIN'
  f.counterAxisAlignItems = opts.crossAxis || 'MIN'
  f.paddingTop    = opts.pt ?? opts.pad ?? 0
  f.paddingBottom = opts.pb ?? opts.pad ?? 0
  f.paddingLeft   = opts.pl ?? opts.pad ?? 0
  f.paddingRight  = opts.pr ?? opts.pad ?? 0
  f.itemSpacing   = opts.gap ?? 0
  f.fills         = opts.fills || [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 }, opacity: 0 }] // transparent default
  if (opts.cornerRadius) f.cornerRadius = opts.cornerRadius
  if (opts.name) f.name = opts.name
  // sizing modes — set after appending to parent
  createdNodeIds.push(f.id)
  return f
}

// ── Divider helper ─────────────────────────────────────────────────────────

function makeDivider(width) {
  const d = figma.createRectangle()
  d.name = "Divider"
  d.resize(width, 1)
  d.fills = COLORS.divider
  createdNodeIds.push(d.id)
  return d
}

// ─────────────────────────────────────────────────────────────────────────────
// BUILD THE CRITIQUE FRAME
// ─────────────────────────────────────────────────────────────────────────────

const FRAME_WIDTH = 520
const CONTENT_WIDTH = FRAME_WIDTH - 64  // 32px padding each side

const versionSuffix = CRITIQUE_DATA.version > 1 ? ` v${CRITIQUE_DATA.version}` : ""
const frameName = `Throughline Critique${versionSuffix}`

// Outer container — auto-layout vertical
const outerFrame = makeAL('VERTICAL', {
  name: frameName,
  pt: 0, pb: 32, pl: 0, pr: 0,
  gap: 0,
  fills: COLORS.bg,
  cornerRadius: 12
})
outerFrame.resize(FRAME_WIDTH, 100) // height will grow via content

// ── SECTION 1: Header ──────────────────────────────────────────────────────

const headerBlock = makeAL('VERTICAL', {
  name: "Header",
  pt: 28, pb: 24, pl: 32, pr: 32,
  gap: 6,
  fills: COLORS.headerBg,
})
headerBlock.resize(FRAME_WIDTH, 10)
outerFrame.appendChild(headerBlock)
headerBlock.layoutSizingHorizontal = 'FILL'
headerBlock.layoutSizingVertical = 'HUG'

const titleText = makeText({
  characters: "THROUGHLINE",
  size: 22,
  bold: true,
  color: COLORS.dark,
  letterSpacing: { unit: 'PERCENT', value: 4 }
})
headerBlock.appendChild(titleText)
titleText.layoutSizingHorizontal = 'FILL'

const subtitleChars = `${CRITIQUE_DATA.domain} Review  ·  ${CRITIQUE_DATA.date}  ·  ${CRITIQUE_DATA.framesReviewed.join(", ")}`
const subtitleText = makeText({
  characters: subtitleChars,
  size: 12,
  color: COLORS.mid,
})
headerBlock.appendChild(subtitleText)
subtitleText.layoutSizingHorizontal = 'FILL'

// Divider below header
const headerDiv = makeDivider(FRAME_WIDTH)
outerFrame.appendChild(headerDiv)
headerDiv.layoutSizingHorizontal = 'FILL'

// ── SECTION 2: Findings ────────────────────────────────────────────────────

// Sort findings: applied → opportunity → violated
const ORDER = ['applied', 'opportunity', 'violated']
const sortedFindings = [...CRITIQUE_DATA.findings].sort(
  (a, b) => ORDER.indexOf(a.status) - ORDER.indexOf(b.status)
)

const findingsBlock = makeAL('VERTICAL', {
  name: "Findings",
  pt: 20, pb: 4, pl: 32, pr: 32,
  gap: 12,
})
findingsBlock.resize(FRAME_WIDTH, 10)
outerFrame.appendChild(findingsBlock)
findingsBlock.layoutSizingHorizontal = 'FILL'
findingsBlock.layoutSizingVertical = 'HUG'

for (const finding of sortedFindings) {
  const meta = STATUS_META[finding.status]

  // Outer card row: accent bar (4px) + content block
  const cardRow = makeAL('HORIZONTAL', {
    name: `Finding: ${finding.principle}`,
    gap: 0,
    cornerRadius: 8,
  })
  cardRow.resize(CONTENT_WIDTH, 10)
  cardRow.clipsContent = true
  findingsBlock.appendChild(cardRow)
  cardRow.layoutSizingHorizontal = 'FILL'
  cardRow.layoutSizingVertical = 'HUG'

  // Left accent bar
  const accentBar = figma.createRectangle()
  accentBar.name = "Accent"
  accentBar.resize(4, 40)  // will stretch — set layoutSizingVertical after appending
  accentBar.fills = meta.accent
  createdNodeIds.push(accentBar.id)
  cardRow.appendChild(accentBar)
  accentBar.layoutSizingVertical = 'FILL'

  // Content area
  const contentArea = makeAL('VERTICAL', {
    name: "Content",
    pt: 12, pb: 12, pl: 14, pr: 14,
    gap: 5,
    fills: meta.fill,
  })
  contentArea.resize(CONTENT_WIDTH - 4, 10)
  cardRow.appendChild(contentArea)
  contentArea.layoutSizingHorizontal = 'FILL'
  contentArea.layoutSizingVertical = 'HUG'

  // Label row: status icon + principle name
  const labelRow = makeAL('HORIZONTAL', {
    name: "Label Row",
    gap: 6,
    crossAxis: 'CENTER',
  })
  contentArea.appendChild(labelRow)
  labelRow.layoutSizingHorizontal = 'FILL'
  labelRow.layoutSizingVertical = 'HUG'

  const statusLabel = makeText({
    characters: `${meta.icon} ${finding.principle.toUpperCase()}`,
    size: 11,
    bold: true,
    color: COLORS.dark,
  })
  labelRow.appendChild(statusLabel)

  // Scope badge
  const scopeText = makeText({
    characters: finding.scope.replace('-', ' '),
    size: 10,
    color: COLORS.light,
  })
  labelRow.appendChild(scopeText)
  // Push scope to right
  labelRow.primaryAxisAlignItems = 'SPACE_BETWEEN'

  // Finding text
  const findingText = makeText({
    characters: finding.finding,
    size: 12,
    color: COLORS.dark,
    width: CONTENT_WIDTH - 4 - 28,  // minus padding
  })
  findingText.lineHeight = { unit: 'PERCENT', value: 160 }
  contentArea.appendChild(findingText)
  findingText.layoutSizingHorizontal = 'FILL'

  // Recommendation text
  const recText = makeText({
    characters: `→ ${finding.recommendation}`,
    size: 12,
    italic: true,
    color: COLORS.mid,
    width: CONTENT_WIDTH - 4 - 28,
  })
  recText.lineHeight = { unit: 'PERCENT', value: 160 }
  contentArea.appendChild(recText)
  recText.layoutSizingHorizontal = 'FILL'
}

// ── SECTION 3: Weave Brief ─────────────────────────────────────────────────

const divider2 = makeDivider(FRAME_WIDTH)
outerFrame.appendChild(divider2)
divider2.layoutSizingHorizontal = 'FILL'

const weaveBrief = CRITIQUE_DATA.weaveBrief

const weaveBlock = makeAL('VERTICAL', {
  name: "Weave Brief",
  pt: 20, pb: 20, pl: 32, pr: 32,
  gap: 14,
  fills: COLORS.weaveBg,
})
weaveBlock.resize(FRAME_WIDTH, 10)
outerFrame.appendChild(weaveBlock)
weaveBlock.layoutSizingHorizontal = 'FILL'
weaveBlock.layoutSizingVertical = 'HUG'

// Weave header
const weaveHeader = makeText({
  characters: "THROUGHLINE WEAVE BRIEF",
  size: 10,
  bold: true,
  color: COLORS.weaveLabel,
  letterSpacing: { unit: 'PERCENT', value: 8 }
})
weaveBlock.appendChild(weaveHeader)

// Helper to add a labeled field to the Weave block
function addWeaveField(label, value) {
  const fieldBlock = makeAL('VERTICAL', {
    name: label,
    gap: 3,
  })
  weaveBlock.appendChild(fieldBlock)
  fieldBlock.layoutSizingHorizontal = 'FILL'
  fieldBlock.layoutSizingVertical = 'HUG'

  const labelNode = makeText({
    characters: label,
    size: 10,
    bold: true,
    color: COLORS.weaveLabel,
    letterSpacing: { unit: 'PERCENT', value: 4 }
  })
  fieldBlock.appendChild(labelNode)

  const valueNode = makeText({
    characters: value,
    size: 12,
    color: COLORS.weaveFg,
    width: CONTENT_WIDTH,
  })
  valueNode.lineHeight = { unit: 'PERCENT', value: 165 }
  fieldBlock.appendChild(valueNode)
  valueNode.layoutSizingHorizontal = 'FILL'

  return fieldBlock
}

addWeaveField("GOAL", weaveBrief.goal)
addWeaveField("PROMPT", weaveBrief.prompt)
addWeaveField("RECOMMENDED MODEL", weaveBrief.model)
addWeaveField("RECOMMENDED WORKFLOW", weaveBrief.workflow)
addWeaveField("WEAVE STARTING NODE", weaveBrief.startingNode)

// ── SECTION 4: What to Do Next ─────────────────────────────────────────────

const divider3 = makeDivider(FRAME_WIDTH)
outerFrame.appendChild(divider3)
divider3.layoutSizingHorizontal = 'FILL'

const nextBlock = makeAL('VERTICAL', {
  name: "What to Do Next",
  pt: 20, pb: 20, pl: 32, pr: 32,
  gap: 10,
  fills: COLORS.nextBg,
  cornerRadius: 0,
})
nextBlock.resize(FRAME_WIDTH, 10)
outerFrame.appendChild(nextBlock)
nextBlock.layoutSizingHorizontal = 'FILL'
nextBlock.layoutSizingVertical = 'HUG'

const nextHeader = makeText({
  characters: "WHAT TO DO NEXT",
  size: 10,
  bold: true,
  color: COLORS.light,
  letterSpacing: { unit: 'PERCENT', value: 6 }
})
nextBlock.appendChild(nextHeader)

for (const suggestion of CRITIQUE_DATA.whatToDoNext) {
  const row = makeAL('HORIZONTAL', {
    name: "Suggestion",
    gap: 8,
    crossAxis: 'MIN',
  })
  nextBlock.appendChild(row)
  row.layoutSizingHorizontal = 'FILL'
  row.layoutSizingVertical = 'HUG'

  const arrow = makeText({ characters: "→", size: 12, bold: true, color: COLORS.mid })
  row.appendChild(arrow)

  const suggText = makeText({
    characters: suggestion,
    size: 12,
    color: COLORS.dark,
    width: CONTENT_WIDTH - 20,
  })
  suggText.lineHeight = { unit: 'PERCENT', value: 160 }
  row.appendChild(suggText)
  suggText.layoutSizingHorizontal = 'FILL'
}

// ── SECTION 5: Workflow Loop Strip ────────────────────────────────────────

const LOOP_STAGES = [
  { label: "Design",       icon: "✦" },
  { label: "Throughline",  icon: "◎" },
  { label: "Generate",     icon: "⬡" },
  { label: "Make",         icon: "▷" },
  { label: "→ Figma",      icon: "⟲" },
  { label: "Throughline",  icon: "◎" },
]

// Current stage index — based on domain and version
// v1 = just ran first critique (stage 1)
// v2+ = ran after a Make/Generate iteration (stage 5)
const currentStageIndex = CRITIQUE_DATA.version > 1 ? 5 : 1

const loopStrip = makeAL('VERTICAL', {
  name: "Workflow Loop",
  pt: 14, pb: 14, pl: 32, pr: 32,
  gap: 8,
  fills: [{ type: 'SOLID', color: { r: 0.102, g: 0.102, b: 0.102 } }],
})
loopStrip.resize(FRAME_WIDTH, 10)
outerFrame.appendChild(loopStrip)
loopStrip.layoutSizingHorizontal = 'FILL'
loopStrip.layoutSizingVertical   = 'HUG'

// Label
const loopLabel = makeText({
  characters: "WORKFLOW LOOP",
  size: 10,
  bold: true,
  color: [{ type: 'SOLID', color: { r: 0.6, g: 0.6, b: 0.6 } }],
  letterSpacing: { unit: 'PERCENT', value: 6 }
})
loopStrip.appendChild(loopLabel)

// Stage row
const stageRow = makeAL('HORIZONTAL', {
  name: "Stages",
  gap: 0,
  crossAxis: 'CENTER',
  fills: [],
})
loopStrip.appendChild(stageRow)
stageRow.layoutSizingHorizontal = 'FILL'
stageRow.layoutSizingVertical   = 'HUG'

for (let i = 0; i < LOOP_STAGES.length; i++) {
  const stage    = LOOP_STAGES[i]
  const isCurrent  = i === currentStageIndex
  const isComplete = i < currentStageIndex
  const isLast     = i === LOOP_STAGES.length - 1

  // Stage pill
  const pill = makeAL('HORIZONTAL', {
    name: `Stage: ${stage.label}`,
    pt: 5, pb: 5, pl: 9, pr: 9,
    gap: 5,
    crossAxis: 'CENTER',
    fills: isCurrent
      ? [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 }, opacity: 0.12 }]
      : [],
    corner: 4,
  })
  stageRow.appendChild(pill)
  pill.layoutSizingHorizontal = 'HUG'
  pill.layoutSizingVertical   = 'HUG'

  // Dot indicator
  const dot = figma.createEllipse()
  dot.name  = "Dot"
  dot.resize(6, 6)
  dot.fills = isCurrent
    ? [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }]
    : isComplete
      ? [{ type: 'SOLID', color: { r: 0.4, g: 0.8, b: 0.5 } }]
      : [{ type: 'SOLID', color: { r: 0.35, g: 0.35, b: 0.35 } }]
  createdNodeIds.push(dot.id)
  pill.appendChild(dot)

  // Stage label text
  const stageText = makeText({
    characters: stage.label,
    size: 11,
    bold: isCurrent,
    color: isCurrent
      ? [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }]
      : isComplete
        ? [{ type: 'SOLID', color: { r: 0.4, g: 0.8, b: 0.5 } }]
        : [{ type: 'SOLID', color: { r: 0.4, g: 0.4, b: 0.4 } }],
  })
  pill.appendChild(stageText)

  // Arrow connector between stages
  if (!isLast) {
    const arrow = makeText({
      characters: "→",
      size: 11,
      color: [{ type: 'SOLID', color: { r: 0.3, g: 0.3, b: 0.3 } }],
    })
    stageRow.appendChild(arrow)
  }
}

// "You are here" label under current stage
const hereRow = makeAL('HORIZONTAL', {
  name: "You are here",
  gap: 0,
  fills: [],
})
loopStrip.appendChild(hereRow)
hereRow.layoutSizingHorizontal = 'FILL'
hereRow.layoutSizingVertical   = 'HUG'

// Spacer to align "↑ you are here" under the correct stage
// Each pill is roughly 80px wide + arrow 20px = 100px per stage
const STAGE_W = 100
const spacerW = Math.max(0, currentStageIndex * STAGE_W - 8)
if (spacerW > 0) {
  const spacer = figma.createRectangle()
  spacer.name = "Spacer"
  spacer.resize(spacerW, 1)
  spacer.fills = []
  createdNodeIds.push(spacer.id)
  hereRow.appendChild(spacer)
}

const hereLabel = makeText({
  characters: "↑ you are here",
  size: 10,
  color: [{ type: 'SOLID', color: { r: 0.55, g: 0.55, b: 0.55 } }],
})
hereRow.appendChild(hereLabel)

// Next step hint
const nextStepText = CRITIQUE_DATA.version > 1
  ? "Reviewed after iteration — compare findings with v" + (CRITIQUE_DATA.version - 1) + " to track progress."
  : "Next: take the Weave Brief into Figma Weave or Higgsfield → generate → drop into Make → run prototype-to-figma → return to Design → run Throughline v2."

const nextStep = makeText({
  characters: nextStepText,
  size: 11,
  color: [{ type: 'SOLID', color: { r: 0.45, g: 0.45, b: 0.45 } }],
  width: CONTENT_WIDTH,
})
nextStep.lineHeight = { unit: 'PERCENT', value: 165 }
loopStrip.appendChild(nextStep)
nextStep.layoutSizingHorizontal = 'FILL'

// ── POSITION & FINALIZE ────────────────────────────────────────────────────

figma.currentPage.appendChild(outerFrame)

// Size to hug content
outerFrame.layoutSizingVertical = 'HUG'
outerFrame.layoutSizingHorizontal = 'FIXED'
outerFrame.resize(FRAME_WIDTH, outerFrame.height)

// Place to the right of existing content
outerFrame.x = PLACEMENT.x
outerFrame.y = PLACEMENT.y

return {
  success: true,
  frameName,
  frameId: outerFrame.id,
  createdNodeIds,
  mutatedNodeIds,
  placement: { x: outerFrame.x, y: outerFrame.y },
  dimensions: { width: outerFrame.width, height: outerFrame.height }
}
