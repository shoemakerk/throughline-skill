/**
 * throughline-update.js
 * ─────────────────────
 * Phase 3 (minor revision): Update an existing finding block or Weave Brief
 * in place — without creating a new critique frame.
 *
 * USE WHEN:
 *  - Designer challenges a finding → update that finding block's text
 *  - Designer asks to refine the Weave Brief → update Weave Brief section text
 *  - NOT for full re-runs (use throughline-canvas.js with version increment for those)
 *
 * HOW TO USE:
 *  1. Pass the frameId from the previous throughline-canvas.js run
 *  2. Specify which node name to find and what to change
 *  3. Run via use_figma
 */

// ── FILL IN BEFORE RUNNING ────────────────────────────────────────────────

const CRITIQUE_FRAME_ID = "PASTE_FRAME_ID_FROM_PREVIOUS_RUN"

// Describe what to update. One of:
//  - findingUpdate: find a finding block by principle name and update its text
//  - weaveBriefUpdate: update a specific Weave Brief field
const UPDATE = {
  type: "finding",  // "finding" | "weave"

  // For type: "finding" — principle name (must match existing block name)
  principleToUpdate: "Von Restorff Effect",
  newFinding: "The 'Continue' CTA now uses a filled blue background and is visually distinct from the secondary 'Sign in with Google' option.",
  newRecommendation: "Consider adding a subtle shadow or scale-up on hover to reinforce the primary action further.",
  newStatus: "applied",  // "applied" | "opportunity" | "violated"

  // For type: "weave" — which field and new value
  weaveField: "PROMPT",
  newWeaveValue: "Updated Weave prompt text here."
}

// ── SCRIPT ────────────────────────────────────────────────────────────────

await Promise.all([
  figma.loadFontAsync({ family: "Inter", style: "Regular" }),
  figma.loadFontAsync({ family: "Inter", style: "Bold" }),
  figma.loadFontAsync({ family: "Inter", style: "Italic" }),
])

const critFrame = await figma.getNodeByIdAsync(CRITIQUE_FRAME_ID)
if (!critFrame) {
  return { success: false, error: `Could not find frame with ID: ${CRITIQUE_FRAME_ID}` }
}

const mutatedNodeIds = []

if (UPDATE.type === "finding") {
  // Find the finding block by name pattern
  const targetName = `Finding: ${UPDATE.principleToUpdate}`
  const findingRow = critFrame.findOne(n => n.name === targetName)
  if (!findingRow) {
    return { success: false, error: `Could not find finding block: "${targetName}". Available: ${critFrame.findAll(n => n.name.startsWith('Finding:')).map(n => n.name).join(', ')}` }
  }

  // Update fill colors on the accent bar and content area
  const STATUS_META = {
    applied:     { icon: "✅", label: "APPLIED",     fillR: 0.133, fillG: 0.769, fillB: 0.369, accentR: 0.133, accentG: 0.769, accentB: 0.369 },
    opportunity: { icon: "⚠️", label: "OPPORTUNITY", fillR: 0.961, fillG: 0.620, fillB: 0.043, accentR: 0.961, accentG: 0.620, accentB: 0.043 },
    violated:    { icon: "❌", label: "VIOLATED",     fillR: 0.937, fillG: 0.267, fillB: 0.267, accentR: 0.937, accentG: 0.267, accentB: 0.267 },
  }
  const meta = STATUS_META[UPDATE.newStatus]

  // Update accent bar fill
  const accentBar = findingRow.findOne(n => n.name === "Accent")
  if (accentBar) {
    accentBar.fills = [{ type: 'SOLID', color: { r: meta.accentR, g: meta.accentG, b: meta.accentB } }]
    mutatedNodeIds.push(accentBar.id)
  }

  // Update content area fill
  const contentArea = findingRow.findOne(n => n.name === "Content")
  if (contentArea) {
    contentArea.fills = [{ type: 'SOLID', color: { r: meta.fillR, g: meta.fillG, b: meta.fillB }, opacity: 0.12 }]
    mutatedNodeIds.push(contentArea.id)
  }

  // Update the label text (status icon + principle)
  const labelRow = findingRow.findOne(n => n.name === "Label Row")
  if (labelRow) {
    const labelText = labelRow.findOne(n => n.type === 'TEXT')
    if (labelText) {
      labelText.characters = `${meta.icon} ${UPDATE.principleToUpdate.toUpperCase()}`
      mutatedNodeIds.push(labelText.id)
    }
  }

  // Update finding and recommendation text nodes
  const allTexts = findingRow.findAllWithCriteria({ types: ['TEXT'] })
  const bodyTexts = allTexts.filter(t =>
    t.name !== "Label Row" &&
    !t.parent?.name?.includes("Label Row")
  )

  // Finding is the non-italic body text in content area, recommendation is italic
  const contentTexts = contentArea
    ? contentArea.findAllWithCriteria({ types: ['TEXT'] })
    : []

  for (const t of contentTexts) {
    const fontStyle = t.fontName?.style || "Regular"
    if (fontStyle === 'Italic' || t.characters.startsWith('→ ')) {
      t.characters = `→ ${UPDATE.newRecommendation}`
      mutatedNodeIds.push(t.id)
    } else if (!t.characters.includes('✅') && !t.characters.includes('⚠️') && !t.characters.includes('❌')) {
      // Skip label row texts; this is the finding body
      if (!t.characters.includes(UPDATE.principleToUpdate.toUpperCase())) {
        t.characters = UPDATE.newFinding
        mutatedNodeIds.push(t.id)
      }
    }
  }

  return { success: true, updated: "finding", principle: UPDATE.principleToUpdate, mutatedNodeIds }

} else if (UPDATE.type === "weave") {
  // Find the Weave Brief block
  const weaveBlock = critFrame.findOne(n => n.name === "Weave Brief")
  if (!weaveBlock) {
    return { success: false, error: "Could not find Weave Brief block in critique frame." }
  }

  // Find the field block by name
  const fieldBlock = weaveBlock.findOne(n => n.name === UPDATE.weaveField)
  if (!fieldBlock) {
    const available = weaveBlock.children.map(c => c.name).join(', ')
    return { success: false, error: `Could not find Weave field: "${UPDATE.weaveField}". Available: ${available}` }
  }

  // The value text node is the second child of the field block
  const valueTexts = fieldBlock.findAllWithCriteria({ types: ['TEXT'] })
  const valueNode = valueTexts.find(t => t.fills?.[0]?.color?.r >= 0.9)  // white text
  if (valueNode) {
    valueNode.characters = UPDATE.newWeaveValue
    mutatedNodeIds.push(valueNode.id)
  }

  return { success: true, updated: "weave", field: UPDATE.weaveField, mutatedNodeIds }
}

return { success: false, error: "Unknown update type. Use 'finding' or 'weave'." }
