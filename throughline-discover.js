/**
 * throughline-discover.js
 * ───────────────────────
 * Phase 1: Map the current page structure.
 *
 * Works on ANY file — single long page, multi-frame canvas, nested sections.
 * Does NOT require frames to be broken into top-level units.
 * Automatically excludes hidden nodes — hidden shot cards are ignored.
 *
 * Returns:
 *  - pageMap: full map of visible top-level nodes, children up to 2 levels deep
 *  - sectionList: flat list of named reviewable sections
 *  - placementX: where to place the critique frame
 *  - mode: "selection" | "page"
 *
 * AGENT INSTRUCTIONS AFTER RUNNING THIS:
 *  1. Present the section list to the designer in a readable format
 *  2. Ask which sections to review
 *  3. Call get_screenshot + get_design_context on chosen section node IDs
 *  4. Proceed to Phase 2 analysis
 */

const page = figma.currentPage
const selection = page.selection

// ── Helper: recursively map a node up to `depth` levels ──────────────────
// Hidden nodes are excluded at every level

function mapNode(node, depth = 0, maxDepth = 2) {
  const base = {
    id: node.id,
    name: node.name,
    type: node.type,
    visible: node.visible !== false,
    width: Math.round(node.width),
    height: Math.round(node.height),
    x: Math.round(node.x),
    y: Math.round(node.y),
  }

  const hasChildren = 'children' in node && node.children && node.children.length > 0
  if (!hasChildren || depth >= maxDepth) return base
  if (node.type === 'INSTANCE' && depth > 0) return base

  base.children = node.children
    .filter(child => child.visible !== false)  // exclude hidden nodes
    .slice(0, 30)
    .map(child => mapNode(child, depth + 1, maxDepth))

  return base
}

// ── Build page map ─────────────────────────────────────────────────────────

let mode = 'page'
let targetNodes = page.children.filter(n => n.visible !== false)

if (selection.length > 0) {
  mode = 'selection'
  targetNodes = selection.filter(n => n.visible !== false)
}

const nodeMap = targetNodes.map(n => mapNode(n, 0, 2))

// ── Find placement position ────────────────────────────────────────────────

let maxX = 0
for (const child of page.children) {
  if (child.visible === false) continue
  const right = child.x + child.width
  if (right > maxX) maxX = right
}

// ── Build flat section list — visible nodes only ───────────────────────────

const sectionList = []

for (const topNode of page.children) {
  if (topNode.visible === false) continue
  if (!('children' in topNode) || !topNode.children) continue

  sectionList.push({
    id: topNode.id,
    name: topNode.name,
    type: topNode.type,
    level: 'page',
    width: Math.round(topNode.width),
    height: Math.round(topNode.height),
  })

  for (const child of topNode.children) {
    if (child.visible === false) continue  // skip hidden children
    const isNamed = child.name &&
      !child.name.match(/^(Frame|Group|Rectangle|Vector)\s*\d*$/)
    if (isNamed) {
      sectionList.push({
        id: child.id,
        name: child.name,
        type: child.type,
        level: 'section',
        parentName: topNode.name,
        width: Math.round(child.width),
        height: Math.round(child.height),
        visible: child.visible !== false,
      })
    }
  }
}

return {
  pageId: page.id,
  pageName: page.name,
  mode,
  selectionCount: selection.length,
  nodeCount: page.children.filter(n => n.visible !== false).length,
  hiddenNodeCount: page.children.filter(n => n.visible === false).length,
  nodeMap,
  sectionList,
  placementX: maxX + 100,
  placementY: 0,
  note: "Hidden nodes excluded. Hidden shot cards in storyboard rows are not included in sectionList."
}
