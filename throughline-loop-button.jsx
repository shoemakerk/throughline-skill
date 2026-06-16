/**
 * throughline-loop-button.jsx
 * ───────────────────────────
 * A React component for Figma Make storyboard apps.
 *
 * What it does:
 *  1. Reads current shot data from the app state
 *  2. Analyzes it against Story principles client-side
 *  3. Generates a filled CRITIQUE_DATA object + ready-to-run canvas script
 *  4. Copies the script to clipboard
 *  5. Shows clear instructions to paste into the Figma Agents panel
 *
 * HOW TO ADD TO YOUR MAKE APP:
 *  Import and place <ThroughlineButton shots={shots} /> anywhere in your app.
 *  Pass the shots array from your storyboard state.
 *
 * SHOT SHAPE:
 *  { num: "01", beat: "Setup", shotType: "Wide shot",
 *    cameraMove: "Static", description: "...", audio: "..." }
 */

import { useState } from "react"

// ── Story principles analyzer ─────────────────────────────────────────────
function analyzeStoryboard(shots) {
  const findings = []

  // Visual Pacing — consecutive shots with same type + movement
  for (let i = 0; i < shots.length - 1; i++) {
    const a = shots[i], b = shots[i + 1]
    if (a.shotType === b.shotType && a.cameraMove === b.cameraMove) {
      findings.push({
        status: "violated",
        principle: "Visual Pacing",
        scope: "cross-frame",
        finding: `Shot ${a.num} and Shot ${b.num} are both "${a.shotType} / ${a.cameraMove}" — identical framing in consecutive beats creates flat pacing with no visual contrast.`,
        recommendation: `Change Shot ${b.num}'s shot type or camera movement. Even a shift from Static to Push-in on the same subject creates forward momentum.`
      })
    }
  }

  // 180° Rule — Dutch angle followed by different movement without resolution
  for (let i = 0; i < shots.length - 1; i++) {
    const a = shots[i], b = shots[i + 1]
    if (a.cameraMove === "Dutch angle" && b.cameraMove !== "Dutch angle" && b.cameraMove !== "Static") {
      findings.push({
        status: "opportunity",
        principle: "180° Rule",
        scope: "cross-frame",
        finding: `Shot ${a.num} uses a Dutch angle; Shot ${b.num} cuts to "${b.cameraMove}" without re-establishing the spatial axis. This risks a screen-direction jump.`,
        recommendation: `Insert a neutral static medium shot between Shot ${a.num} and ${b.num} to re-establish the 180° line before the movement change.`
      })
    }
  }

  // Three-Act Structure
  const beats = shots.map(s => s.beat || "")
  const hasSetup = beats.some(b => b === "Setup")
  const hasMid   = beats.some(b => ["Confrontation", "Inciting incident", "Climax"].includes(b))
  const hasEnd   = beats.some(b => ["Resolution", "Climax"].includes(b))

  if (hasSetup && hasMid && hasEnd) {
    findings.push({
      status: "applied",
      principle: "Three-Act Structure",
      scope: "cross-frame",
      finding: "Setup, Confrontation, and Resolution beats are all present across the shot sequence.",
      recommendation: "Verify the confrontation act carries the highest visual energy — it should be the emotional peak before resolution."
    })
  } else {
    findings.push({
      status: "violated",
      principle: "Three-Act Structure",
      scope: "cross-frame",
      finding: `The shot sequence is missing ${!hasSetup ? "a Setup" : !hasMid ? "a Confrontation/Inciting Incident" : "a Resolution"} beat.`,
      recommendation: "Every short-form story needs all three acts even at 60 seconds. Assign beat labels to all shots and verify the arc is complete."
    })
  }

  // Economy of Storytelling — blank descriptions
  const blank = shots.filter(s => !s.description || s.description.trim().length < 10)
  if (blank.length > 0) {
    findings.push({
      status: "violated",
      principle: "Economy of Storytelling",
      scope: "single-frame",
      finding: `Shot${blank.length > 1 ? "s" : ""} ${blank.map(s => s.num).join(", ")} ${blank.length > 1 ? "have" : "has"} no scene description — undescribed shots cannot be evaluated for narrative purpose.`,
      recommendation: "Every shot must earn its place. Add a scene description explaining what changes and why the shot exists."
    })
  }

  // Show Don't Tell — audio-heavy shots
  const heavy = shots.filter(s => s.audio && s.audio.split(" ").length > 15)
  if (heavy.length > 0) {
    findings.push({
      status: "opportunity",
      principle: "Show Don't Tell",
      scope: "single-frame",
      finding: `Shot${heavy.length > 1 ? "s" : ""} ${heavy.map(s => s.num).join(", ")} ${heavy.length > 1 ? "carry" : "carries"} heavy dialogue/audio. Dense audio narration often competes with the visual in short-form film.`,
      recommendation: "Trim audio to its emotional core. Trust the image — audio should add texture, not explanation."
    })
  }

  // Weave Brief — target most critical shot
  const violated = findings.filter(f => f.status === "violated")
  const targetShot = (() => {
    if (violated.length > 0) {
      const match = shots.find(s => violated[0].finding.includes(`Shot ${s.num}`))
      return match || shots[0]
    }
    return shots[Math.floor(shots.length / 2)]
  })()

  const weaveBrief = {
    goal: `Generate a replacement image for Shot ${targetShot.num} that resolves the most critical finding and strengthens the ${targetShot.beat || "key"} beat.`,
    prompt: `${targetShot.shotType || "Medium shot"}, ${targetShot.cameraMove || "Static"}. ${targetShot.description || ""}. Stark black-and-white graphic novel aesthetic, heavy ink work, strong tonal contrast, aged paper tone. No text, no proper nouns, no identifiable faces.`,
    model: "Nano Banana Pro (Gemini 3) — graphic novel aesthetic, precise line work, high contrast",
    workflow: "Image Production → Style Control",
    startingNode: `Prompt node: paste the prompt above. Connect to Nano Banana Pro. Set output to 16:9 landscape to match storyboard frame dimensions.`
  }

  const whatToDoNext = [
    violated.length > 0
      ? `Fix Shot ${targetShot.num} first — ${violated[0].principle} is the most critical finding.`
      : "Review Visual Pacing findings — shot rhythm is the strongest lever for short-form impact.",
    `Take the Weave Brief into Figma Weave: paste the prompt into a Nano Banana Pro node and generate 3 variants for Shot ${targetShot.num}.`,
    `Drop the best variant into the Shot ${targetShot.num} image placeholder, then run Throughline v2 to track what changed.`
  ]

  return {
    domain: "Story",
    date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
    framesReviewed: shots.map(s => `Shot ${s.num}`),
    version: 1,
    findings: findings.slice(0, 7),
    weaveBrief,
    whatToDoNext
  }
}

// ── Build the canvas script string ────────────────────────────────────────
function buildScript(critiqueData) {
  return `// Throughline Critique Frame — paste into Figma Agents panel
// Generated by Throughline Loop Button on ${critiqueData.date}
// ─────────────────────────────────────────────────────────────

const PLACEMENT = { x: 2400, y: 0 } // adjust x if needed

const CRITIQUE_DATA = ${JSON.stringify(critiqueData, null, 2)}

// ── paste the contents of throughline-canvas.js below this line ──
// (everything after the CRITIQUE_DATA and PLACEMENT declarations)
`
}

// ── Summary panel shown after analysis ───────────────────────────────────
function CritiqueSummary({ findings }) {
  const counts = {
    applied:     findings.filter(f => f.status === "applied").length,
    opportunity: findings.filter(f => f.status === "opportunity").length,
    violated:    findings.filter(f => f.status === "violated").length,
  }
  return (
    <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
      {counts.applied > 0 && (
        <span style={pill("#166534", "#dcfce7")}>✅ {counts.applied} applied</span>
      )}
      {counts.opportunity > 0 && (
        <span style={pill("#92400e", "#fef3c7")}>⚠️ {counts.opportunity} opportunity</span>
      )}
      {counts.violated > 0 && (
        <span style={pill("#7f1d1d", "#fee2e2")}>❌ {counts.violated} violated</span>
      )}
    </div>
  )
}

function pill(color, bg) {
  return {
    fontSize: "11px", fontWeight: "500",
    color, background: bg,
    padding: "3px 8px", borderRadius: "4px",
    fontFamily: "Inter, sans-serif",
  }
}

// ── Main button component ─────────────────────────────────────────────────
export default function ThroughlineButton({ shots }) {
  const [status, setCopied]   = useState("idle") // idle | ready | copied
  const [critique, setCritique] = useState(null)
  const [script, setScript]   = useState("")

  const analyze = () => {
    const data   = analyzeStoryboard(shots)
    const built  = buildScript(data)
    setCritique(data)
    setScript(built)
    setCopied("ready")
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(script)
      setCopied("copied")
      setTimeout(() => setCopied("ready"), 3000)
    } catch {
      // Fallback: select a textarea
      const el = document.getElementById("throughline-script-output")
      if (el) { el.select(); document.execCommand("copy") }
      setCopied("copied")
      setTimeout(() => setCopied("ready"), 3000)
    }
  }

  const reset = () => {
    setCopied("idle")
    setCritique(null)
    setScript("")
  }

  // ── Styles ────────────────────────────────────────────────────────────
  const font = { fontFamily: "Inter, sans-serif" }

  const btn = (bg, color, cursor = "pointer") => ({
    ...font,
    display: "flex", alignItems: "center", gap: "8px",
    padding: "10px 16px", borderRadius: "8px",
    fontSize: "13px", fontWeight: "500",
    background: bg, color, border: "none",
    cursor, transition: "opacity 0.15s ease",
  })

  const card = {
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    padding: "16px",
    display: "flex", flexDirection: "column", gap: "12px",
    maxWidth: "420px",
    ...font,
  }

  const stepStyle = {
    fontSize: "12px", color: "#374151", lineHeight: "1.6",
  }

  // ── Render ────────────────────────────────────────────────────────────

  if (status === "idle") {
    return (
      <button style={btn("#1a1a1a", "#ffffff")} onClick={analyze}>
        ◎ Run Throughline
      </button>
    )
  }

  return (
    <div style={card}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "13px", fontWeight: "600", color: "#111827" }}>
          Throughline — Story Critique
        </span>
        <button
          onClick={reset}
          style={{ ...font, fontSize: "11px", color: "#9ca3af", background: "none", border: "none", cursor: "pointer" }}
        >
          ✕ reset
        </button>
      </div>

      {/* Finding summary */}
      {critique && <CritiqueSummary findings={critique.findings} />}

      {/* Divider */}
      <div style={{ height: "1px", background: "#e5e7eb" }} />

      {/* Instructions */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <p style={{ ...stepStyle, fontWeight: "600", margin: 0 }}>
          To write this critique to your Figma canvas:
        </p>
        <ol style={{ ...stepStyle, margin: 0, paddingLeft: "18px" }}>
          <li>Click <strong>Copy script</strong> below</li>
          <li>Open your Figma Design file</li>
          <li>Open the <strong>Agents panel</strong> (left sidebar)</li>
          <li>Paste and send — the critique frame will appear on canvas</li>
        </ol>
      </div>

      {/* Hidden textarea for fallback copy */}
      <textarea
        id="throughline-script-output"
        readOnly
        value={script}
        style={{ position: "absolute", left: "-9999px", opacity: 0, height: "1px" }}
      />

      {/* Copy button */}
      <button
        style={btn(
          status === "copied" ? "#166534" : "#1a1a1a",
          "#ffffff"
        )}
        onClick={copyToClipboard}
      >
        {status === "copied" ? "✓ Copied — paste into Agents panel" : "Copy script"}
      </button>

      {/* Loop position indicator */}
      <div style={{
        fontSize: "11px", color: "#9ca3af",
        borderTop: "1px solid #e5e7eb", paddingTop: "10px",
        lineHeight: "1.6",
      }}>
        <span style={{ fontWeight: "500", color: "#6b7280" }}>Workflow loop: </span>
        {["Design", "Throughline ●", "Generate", "Make", "→ Figma", "Throughline v2"].map((s, i) => (
          <span key={i} style={{ color: i === 1 ? "#111827" : "#d1d5db", fontWeight: i === 1 ? "600" : "400" }}>
            {s}{i < 5 ? " · " : ""}
          </span>
        ))}
      </div>

    </div>
  )
}
