/**
 * PhoneControl Server — file-based screenrecord stream
 * Compatible with Samsung Galaxy / Android 15
 * Stream: GET /stream/:deviceId  (multipart/x-mixed-replace MJPEG)
 */

const express = require("express")
const { exec, execSync, spawn } = require("child_process")
const fs = require("fs")
const path = require("path")
const cors = require("cors")

const app = express()
app.use(cors())
app.use(express.json())

const PORT = 3000
const TMP_DIR = "/tmp/phonecontrol"
const REMOTE_VIDEO = "/sdcard/sc_tmp.h264"
const RECORD_DURATION = 3 // seconds per recording chunk

if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true })

// ── Helpers ───────────────────────────────────────────────────────────────────

function adb(deviceId, cmd) {
  return `adb -s ${deviceId} ${cmd}`
}

function run(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, { timeout: 10000 }, (err, stdout, stderr) => {
      if (err) return reject(err)
      resolve(stdout.trim())
    })
  })
}

function getDevices() {
  try {
    const out = execSync("adb devices", { timeout: 5000 }).toString()
    return out
      .split("\n")
      .slice(1)
      .filter(l => l.includes("\tdevice"))
      .map(l => l.split("\t")[0].trim())
  } catch { return [] }
}

// ── On device connect: keep screen on ────────────────────────────────────────

async function onDeviceConnect(deviceId) {
  try {
    await run(adb(deviceId, "shell svc power stayon true"))
    console.log(`[${deviceId}] Screen stay-on enabled`)
  } catch (e) {
    console.warn(`[${deviceId}] Could not set stay-on: ${e.message}`)
  }
}

// Poll for new devices every 5s and apply settings
const knownDevices = new Set()
setInterval(() => {
  const devices = getDevices()
  for (const d of devices) {
    if (!knownDevices.has(d)) {
      knownDevices.add(d)
      console.log(`[connect] New device: ${d}`)
      onDeviceConnect(d)
    }
  }
}, 5000)

// ── Streaming state ───────────────────────────────────────────────────────────

const streamSessions = {} // deviceId → { clients: Set, recording: bool, loopTimer }

async function captureFrame(deviceId) {
  const localVideo = path.join(TMP_DIR, `${deviceId}_sc.h264`)
  const localFrame = path.join(TMP_DIR, `${deviceId}_frame.jpg`)

  try {
    // Kill any existing screenrecord for this device
    await run(adb(deviceId, `shell pkill -f screenrecord`)).catch(() => {})
    await new Promise(r => setTimeout(r, 200))

    // Remove old file on device
    await run(adb(deviceId, `shell rm -f ${REMOTE_VIDEO}`)).catch(() => {})

    // Record a short clip
    await run(adb(deviceId, `shell screenrecord --time-limit ${RECORD_DURATION} --output-format h264 ${REMOTE_VIDEO}`))

    // Pull to local
    await run(adb(deviceId, `pull ${REMOTE_VIDEO} ${localVideo}`))

    // Extract first frame as JPEG using ffmpeg
    await run(`ffmpeg -y -i ${localVideo} -vframes 1 -q:v 2 -vf "scale=720:-2" ${localFrame} 2>/dev/null`)

    if (!fs.existsSync(localFrame)) return null
    const data = fs.readFileSync(localFrame)
    return data
  } catch (e) {
    console.warn(`[${deviceId}] captureFrame error: ${e.message}`)
    return null
  }
}

async function streamLoop(deviceId) {
  const session = streamSessions[deviceId]
  if (!session || session.clients.size === 0) {
    if (session) session.recording = false
    return
  }

  session.recording = true

  const frame = await captureFrame(deviceId)

  if (frame && session.clients.size > 0) {
    const boundary = "--frame\r\nContent-Type: image/jpeg\r\n\r\n"
    for (const res of session.clients) {
      try {
        res.write(Buffer.from(boundary))
        res.write(frame)
        res.write("\r\n")
      } catch { session.clients.delete(res) }
    }
  }

  if (session.clients.size > 0) {
    session.loopTimer = setTimeout(() => streamLoop(deviceId), 500)
  } else {
    session.recording = false
  }
}

// ── Stream endpoint ───────────────────────────────────────────────────────────

app.get("/stream/:deviceId", (req, res) => {
  const { deviceId } = req.params

  res.setHeader("Content-Type", "multipart/x-mixed-replace; boundary=frame")
  res.setHeader("Cache-Control", "no-cache, no-store")
  res.setHeader("Connection", "keep-alive")
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.flushHeaders()

  if (!streamSessions[deviceId]) {
    streamSessions[deviceId] = { clients: new Set(), recording: false }
  }

  const session = streamSessions[deviceId]
  session.clients.add(res)
  console.log(`[${deviceId}] Client connected (total: ${session.clients.size})`)

  if (!session.recording) {
    streamLoop(deviceId)
  }

  req.on("close", () => {
    session.clients.delete(res)
    console.log(`[${deviceId}] Client disconnected (total: ${session.clients.size})`)
  })
})

// ── Input endpoints ───────────────────────────────────────────────────────────

// Tap: POST /tap/:deviceId  { x, y }
app.post("/tap/:deviceId", async (req, res) => {
  const { deviceId } = req.params
  const { x, y } = req.body
  try {
    await run(adb(deviceId, `shell input tap ${x} ${y}`))
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Swipe: POST /swipe/:deviceId  { x1, y1, x2, y2, duration? }
app.post("/swipe/:deviceId", async (req, res) => {
  const { deviceId } = req.params
  const { x1, y1, x2, y2, duration = 300 } = req.body
  try {
    await run(adb(deviceId, `shell input swipe ${x1} ${y1} ${x2} ${y2} ${duration}`))
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Text: POST /text/:deviceId  { text }
app.post("/text/:deviceId", async (req, res) => {
  const { deviceId } = req.params
  const { text } = req.body
  const escaped = text.replace(/(['"\\$`])/g, "\\$1").replace(/ /g, "%s")
  try {
    await run(adb(deviceId, `shell input text "${escaped}"`))
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Key: POST /key/:deviceId  { keycode }  e.g. KEYCODE_BACK, KEYCODE_HOME
app.post("/key/:deviceId", async (req, res) => {
  const { deviceId } = req.params
  const { keycode } = req.body
  try {
    await run(adb(deviceId, `shell input keyevent ${keycode}`))
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Devices: GET /devices
app.get("/devices", (req, res) => {
  const devices = getDevices()
  res.json({ devices })
})

// Health: GET /health
app.get("/health", (req, res) => {
  res.json({ ok: true, uptime: process.uptime() })
})

// ── Start ─────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`PhoneControl server running on port ${PORT}`)
  console.log(`Stream: GET http://localhost:${PORT}/stream/:deviceId`)
})
