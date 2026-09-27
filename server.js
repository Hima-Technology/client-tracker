const express = require('express');
const fs      = require('fs');
const path    = require('path');
const dotenv  = require('dotenv');
dotenv.config();

const app             = express();
const PORT            = Number(process.env.PORT) || 3000;
const ONLINE_JSON_URL = process.env.ONLINE_JSON_URL || 'https://usamatalib.com/assets/clients.json';
const PHP_URL         = process.env.PHP_URL;
const SECRET_KEY      = process.env.SECRET_KEY;
const LOCAL_FILE      = path.join(__dirname, 'clients.json');

function readLocalData() {
  if (!fs.existsSync(LOCAL_FILE)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(LOCAL_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeLocalData(data) {
  fs.writeFileSync(LOCAL_FILE, JSON.stringify(data, null, 2));
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// GET /api/clients → fetch from Online JSON / PHP server with local fallback
app.get('/api/clients', async (req, res) => {
  // 1. Try PHP_URL first if configured
  if (PHP_URL) {
    try {
      const r = await fetch(PHP_URL, {
        headers: { 'X-Secret-Key': SECRET_KEY || '' }
      });
      if (r.ok) {
        const data = await r.json();
        if (Array.isArray(data)) {
          writeLocalData(data);
          return res.json(data);
        }
      }
    } catch (e) {
      console.warn(`⚠ PHP_URL fetch failed (${e.message}). Trying ONLINE_JSON_URL...`);
    }
  }

  // 2. Fetch directly from ONLINE_JSON_URL
  if (ONLINE_JSON_URL) {
    try {
      const r = await fetch(ONLINE_JSON_URL);
      if (r.ok) {
        const data = await r.json();
        if (Array.isArray(data)) {
          console.log(`🌐 Successfully fetched ${data.length} clients from online server`);
          writeLocalData(data);
          return res.json(data);
        }
      }
      console.warn(`⚠ ONLINE_JSON_URL responded status ${r.status}`);
    } catch (e) {
      console.warn(`⚠ ONLINE_JSON_URL fetch failed (${e.message}). Falling back to local clients.json.`);
    }
  }

  // 3. Fallback to local clients.json
  res.json(readLocalData());
});

// POST /api/clients → save to local and attempt PHP sync
app.post('/api/clients', async (req, res) => {
  const clients = req.body;
  if (!Array.isArray(clients)) {
    return res.status(400).json({ error: 'Expected array of clients' });
  }

  // Always save locally first
  writeLocalData(clients);

  if (PHP_URL) {
    try {
      const r = await fetch(PHP_URL, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'X-Secret-Key':  SECRET_KEY || ''
        },
        body: JSON.stringify(clients)
      });
      if (r.ok) {
        const data = await r.json();
        return res.json(data);
      }
      console.warn(`⚠ Remote PHP save responded ${r.status}. Saved locally.`);
    } catch (e) {
      console.warn(`⚠ Remote PHP save failed (${e.message}). Saved locally.`);
    }
  }

  res.json({ ok: true, count: clients.length, source: 'local' });
});

app.listen(PORT, () => {
  console.log(`\n✅ ClientTrack running  → http://localhost:${PORT}`);
  console.log(`🌐 Online Data URL     → ${ONLINE_JSON_URL}`);
  if (PHP_URL) console.log(`✍️  PHP Sync URL       → ${PHP_URL}\n`);
});
