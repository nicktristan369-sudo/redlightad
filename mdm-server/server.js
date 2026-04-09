/**
 * PhoneControl Server
 * -------------------
 * Forbinder til Android-telefoner via ADB, streamer skærm som MJPEG,
 * og videresender touch/tastatur-input tilbage til telefonerne.
 *
 * Kræver installeret på serveren:
 *   - Node.js 18+
 *   - adb (Android Debug Bridge)
 *   - ffmpeg
 */

const express = require('express');
const http    = require('http');
const WebSocket = require('ws');
const { spawn, exec, execSync } = require('child_process');
const path    = require('path');
const fs      = require('fs');

const app    = express();
const server = http.createServer(app);
const wss    = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;

// ────────────────────────────────────────────────────────────────
// Tilstand
// ────────────────────────────────────────────────────────────────
const devices     = new Map();   // deviceId → { id, name, connected, streamClients }
const streamProcs = new Map();   // deviceId → { adb, ffmpeg }

// ────────────────────────────────────────────────────────────────
// Middleware
// ────────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ────────────────────────────────────────────────────────────────
// ADB hjælpefunktioner
// ────────────────────────────────────────────────────────────────

function adbCmd(deviceId, args) {
  return new Promise((resolve, reject) => {
    exec(`adb -s ${deviceId} ${args}`, (err, stdout, stderr) => {
      if (err) reject(stderr || err.message);
      else resolve(stdout.trim());
    });
  });
}

function refreshDevices() {
  exec('adb devices -l', (err, stdout) => {
    if (err) return console.error('adb devices fejl:', err.message);

    const lines = stdout.split('\n').slice(1).filter(l => l.trim());
    const found = new Set();

    lines.forEach(line => {
      const parts = line.trim().split(/\s+/);
      const id     = parts[0];
      const status = parts[1];

      if (!id || status !== 'device') return;
      found.add(id);

      if (!devices.has(id)) {
        // Hent model-navn
        exec(`adb -s ${id} shell getprop ro.product.model`, (e, model) => {
          devices.set(id, {
            id,
            name: model ? model.trim() : id,
            connected: true,
            streamClients: new Set(),
          });
          broadcastDeviceList();
          console.log(`✅ Ny enhed: ${id} (${model ? model.trim() : 'ukendt'})`);
        });
      } else {
        devices.get(id).connected = true;
      }
    });

    // Marker frakobled enheder
    for (const [id, dev] of devices) {
      if (!found.has(id)) {
        dev.connected = false;
        stopStream(id);
        broadcastDeviceList();
      }
    }
  });
}

// Tilslut telefon over netværket (ADB over TCP/IP)
app.post('/api/connect', (req, res) => {
  const { host, port = 5555 } = req.body;
  if (!host) return res.status(400).json({ error: 'host mangler' });

  exec(`adb connect ${host}:${port}`, (err, stdout) => {
    if (err) return res.status(500).json({ error: err.message });
    refreshDevices();
    setTimeout(() => broadcastDeviceList(), 1000);
    res.json({ result: stdout.trim() });
  });
});

// Frakobl en enhed
app.post('/api/disconnect/:deviceId', (req, res) => {
  const { deviceId } = req.params;
  stopStream(deviceId);
  exec(`adb disconnect ${deviceId}`, () => {
    devices.delete(deviceId);
    broadcastDeviceList();
    res.json({ ok: true });
  });
});

// Hent enhedsliste
app.get('/api/devices', (req, res) => {
  res.json(deviceListPayload());
});

// ────────────────────────────────────────────────────────────────
// MJPEG streaming
// ────────────────────────────────────────────────────────────────

/*
 * Hvert kald til /stream/:deviceId starter en adb+ffmpeg pipeline:
 *   adb exec-out screenrecord --output-format=h264 -
 *     └─→ ffmpeg → MJPEG frames → HTTP multipart stream
 *
 * Browseren bruger: <img src="/stream/DEVICE_ID">
 */

app.get('/stream/:deviceId', (req, res) => {
  const { deviceId } = req.params;
  const dev = devices.get(deviceId);

  if (!dev || !dev.connected) {
    return res.status(404).send('Enhed ikke fundet eller ikke tilsluttet');
  }

  res.setHeader('Content-Type',  'multipart/x-mixed-replace; boundary=mjpegframe');
  res.setHeader('Cache-Control', 'no-cache, no-store');
  res.setHeader('Connection',    'close');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Start ADB screenrecord → H264
  const adbProc = spawn('adb', [
    '-s', deviceId,
    'exec-out',
    'screenrecord',
    '--output-format=h264',
    '--bit-rate', '2000000',
    '--size', '720x1280',
    '-',
  ]);

  // Transcode H264 → MJPEG via ffmpeg
  const ffProc = spawn('ffmpeg', [
    '-loglevel', 'quiet',
    '-i', 'pipe:0',
    '-an',
    '-f', 'image2pipe',
    '-vf', 'scale=360:-1',
    '-vcodec', 'mjpeg',
    '-q:v', '6',
    'pipe:1',
  ]);

  adbProc.stdout.pipe(ffProc.stdin);

  let buf = Buffer.alloc(0);
  const SOI = Buffer.from([0xff, 0xd8]);
  const EOI = Buffer.from([0xff, 0xd9]);

  ffProc.stdout.on('data', chunk => {
    buf = Buffer.concat([buf, chunk]);

    let start = buf.indexOf(SOI);
    while (start !== -1) {
      const end = buf.indexOf(EOI, start + 2);
      if (end === -1) break;

      const frame = buf.slice(start, end + 2);
      const header =
        '--mjpegframe\r\n' +
        'Content-Type: image/jpeg\r\n' +
        `Content-Length: ${frame.length}\r\n\r\n`;

      try {
        res.write(header);
        res.write(frame);
        res.write('\r\n');
      } catch (_) {}

      buf   = buf.slice(end + 2);
      start = buf.indexOf(SOI);
    }
  });

  const cleanup = () => {
    try { adbProc.kill('SIGKILL'); } catch (_) {}
    try { ffProc.kill('SIGKILL');  } catch (_) {}
  };

  adbProc.on('close', cleanup);
  ffProc.on('close', () => { try { res.end(); } catch (_) {} });
  req.on('close', cleanup);
});

// ────────────────────────────────────────────────────────────────
// Input-videresendelse
// ────────────────────────────────────────────────────────────────

// Touch (tap)
app.post('/input/:deviceId/tap', async (req, res) => {
  const { deviceId } = req.params;
  const { x, y } = req.body;
  try {
    await adbCmd(deviceId, `shell input tap ${Math.round(x)} ${Math.round(y)}`);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e });
  }
});

// Swipe
app.post('/input/:deviceId/swipe', async (req, res) => {
  const { deviceId } = req.params;
  const { x1, y1, x2, y2, duration = 300 } = req.body;
  try {
    await adbCmd(deviceId, `shell input swipe ${x1} ${y1} ${x2} ${y2} ${duration}`);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e });
  }
});

// Tekst
app.post('/input/:deviceId/text', async (req, res) => {
  const { deviceId } = req.params;
  const { text } = req.body;
  // Escape special chars for adb
  const safe = text.replace(/[^a-zA-Z0-9]/g, c => `%${c.charCodeAt(0).toString(16).padStart(2,'0')}`);
  try {
    await adbCmd(deviceId, `shell input text "${safe}"`);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e });
  }
});

// Tryk på hardwareknap (HOME / BACK / RECENTS / POWER / VOLUME_UP / VOLUME_DOWN)
app.post('/input/:deviceId/key', async (req, res) => {
  const { deviceId } = req.params;
  const { key } = req.body;
  const allowed = ['KEYCODE_HOME','KEYCODE_BACK','KEYCODE_APP_SWITCH',
                   'KEYCODE_POWER','KEYCODE_VOLUME_UP','KEYCODE_VOLUME_DOWN'];
  if (!allowed.includes(key)) return res.status(400).json({ error: 'Ugyldig key' });
  try {
    await adbCmd(deviceId, `shell input keyevent ${key}`);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e });
  }
});

// Screenshot (PNG)
app.get('/screenshot/:deviceId', (req, res) => {
  const { deviceId } = req.params;
  const adb = spawn('adb', ['-s', deviceId, 'exec-out', 'screencap', '-p']);
  res.setHeader('Content-Type', 'image/png');
  adb.stdout.pipe(res);
  adb.on('error', e => res.status(500).send(e.message));
});

// ────────────────────────────────────────────────────────────────
// WebSocket (live enhedsliste-opdateringer)
// ────────────────────────────────────────────────────────────────

wss.on('connection', ws => {
  ws.send(JSON.stringify({ type: 'devices', data: deviceListPayload() }));
});

function broadcastDeviceList() {
  const msg = JSON.stringify({ type: 'devices', data: deviceListPayload() });
  wss.clients.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) ws.send(msg);
  });
}

function deviceListPayload() {
  return Array.from(devices.values()).map(d => ({
    id:        d.id,
    name:      d.name,
    connected: d.connected,
  }));
}

function stopStream(deviceId) {
  const procs = streamProcs.get(deviceId);
  if (procs) {
    try { procs.adb.kill('SIGKILL');  } catch (_) {}
    try { procs.ffmpeg.kill('SIGKILL'); } catch (_) {}
    streamProcs.delete(deviceId);
  }
}

// ────────────────────────────────────────────────────────────────
// Start
// ────────────────────────────────────────────────────────────────

refreshDevices();
setInterval(refreshDevices, 5000);

server.listen(PORT, () => {
  console.log(`\n📱 PhoneControl kører på http://localhost:${PORT}`);
  console.log(`   Åbn browseren og tilslut dine telefoner.\n`);
});
