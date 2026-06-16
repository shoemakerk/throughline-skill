/**
 * throughline-scope.js
 * ────────────────────
 * Phase 1b: Resolve a designer's scope choice to node IDs + screenshots.
 *
 * Run this AFTER the designer has chosen which sections to review.
 * Pass in the node IDs from the sectionList returned by throughline-discover.js.
 *
 * HOW TO USE:
 *  1. Replace SECTION_IDS with the IDs the designer chose
 *  2. Run via use_figma
 *  3. Use the returned boundingBox for critique frame placement
 *  4. Call get_screenshot on each resolvedId
 *  5. Call get_design_context on each resolvedId for layer structure
 *
 * AGENT NOTE: After this call, you have everything needed for Phase 2 analysis.
 * The resolvedSections tell you what to show the designer in the critique header.
 * The boundingBox tells you where to place the Throughline Critique frame.
 */

// ── FILL IN: IDs chosen by the designer ───────────────────────────────────
// Example: ["3:531", "12:1467"] for "content" and "summary" sections

const SECTION_IDS = [
  "PASTE_ID_1_HERE",
  "PASTE_ID_2_HERE",
]

// ── SCRIPT ────────────────────────────────────────────────────────────────

const page = figma.currentPage
const resolved = []
let minX = Infinity, minY = Infinity, maxX = 0, maxY = 0

for (const id of SECTION_IDS) {
  const node = await figma.getNodeByIdAsync(id)
  if (!node) {
    resolved.push({ id, error: 'Node not found' })
    continue
  }

  // Get absolute position (nodes inside frames have x/y relative to parent)
  // We need absolute position for placement calculation
  const absX = node.absoluteTransform[0][2]
  const absY = node.absoluteTransform[1][2]

  resolved.push({
    id: node.id,
    name: node.name,
    type: node.type,
    width: Math.round(node.width),
    height: Math.round(node.height),
    x: Math.round(node.x),
    y: Math.round(node.y),
    absoluteX: Math.round(absX),
    absoluteY: Math.round(absY),
    // Named children — for Throughline to reference by name in findings
    childNames: 'children' in node && node.children
      ? node.children.slice(0, 20).map(c => ({ name: c.name, type: c.type, id: c.id }))
      : [],
  })

  // Track bounding box of all chosen sections
  minX = Math.min(minX, absX)
  minY = Math.min(minY, absY)
  maxX = Math.max(maxX, absX + node.width)
  maxY = Math.max(maxY, absY + node.height)
}

// Find rightmost edge of ALL page content for critique frame placement
let pageMaxX = 0
for (const child of page.children) {
  pageMaxX = Math.max(pageMaxX, child.x + child.width)
}

return {
  resolvedSections: resolved,
  sectionNames: resolved.filter(r => !r.error).map(r => r.name),
  boundingBox: {
    x: Math.round(minX),
    y: Math.round(minY),
    width: Math.round(maxX - minX),
    height: Math.round(maxY - minY),
  },
  // Place critique frame to the right of ALL page content, aligned to top of selection
  critiqueFramePlacement: {
    x: pageMaxX + 100,
    y: Math.round(minY),
  },
}
