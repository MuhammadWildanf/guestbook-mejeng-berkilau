const cors = require('cors')
const express = require('express');
require('dotenv').config();
const admin = require('firebase-admin');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3002;

// --- FIREBASE INITIALIZATION ---
// Check if firebase is already initialized to avoid "Default app already exists" error
// and allow Vercel to reuse the warm instance.
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        type: process.env.FIREBASE_TYPE,
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        // Ensure private key handles newlines correctly
        private_key: process.env.FIREBASE_PRIVATE_KEY
          ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
          : undefined,
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: process.env.FIREBASE_AUTH_URI,
        token_uri: process.env.FIREBASE_TOKEN_URI,
        auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
        client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
        universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN,
      }),
      databaseURL: process.env.FIREBASE_DATABASE_URL
    });
    console.log("🔥 Firebase initialized successfully.");
  } catch (error) {
    console.error("❌ Firebase initialization failed:", error);
  }
}

// --- MIDDLEWARE ---
app.use(express.static(path.join(__dirname, 'frontend')));
app.use(express.json());
app.use(bodyParser.json());
app.use(cors({ origin: true }));

// --- ROUTES ---

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// SUBMIT FORM
app.post('/submit-form', async (req, res) => {
  try {
    if (!admin.apps.length) {
      throw new Error("Firebase not initialized");
    }
    const db = admin.database();

    // Log payload for debugging
    console.log("📩 Received submission:", req.body);

    const { name, char, comment } = req.body;
    const timestamp = admin.database.ServerValue.TIMESTAMP;
    const ref = db.ref('guestbook');

    // Use timeout for the DB operation so it fails fast if hung
    const newRef = ref.push();
    await newRef.set({ name, char, comment, timestamp });

    const newKey = newRef.key;
    console.log("✅ Data saved with key:", newKey);

    res.status(200).json({ key: newKey, name, char });
  } catch (error) {
    console.error('❌ Error submitting data:', error);
    res.status(500).json({ error: 'Error submitting data', details: error.message });
  }
});

app.post('/update-form', async (req, res) => {
  try {
    const db = admin.database()
    const { key, name, char, comment } = req.body;
    const ref = db.ref(`/guestbook/${key}`);
    const timestamp = admin.database.ServerValue.TIMESTAMP;
    await ref.update({ name, char, comment, timestamp });
    res.status(200).json({ msg: "Data Updated Successfully" });
  } catch (error) {
    console.error('Error updating data:', error);
    res.status(500).send('Error updating data');
  }
});

app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "dashboard.html"));
});


// Ambil semua data
app.get("/entries", async (req, res) => {
  try {
    const db = admin.database();
    const ref = db.ref("guestbook");
    const snapshot = await ref.once("value");
    res.json(snapshot.val());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ambil data by key
app.get("/entries/:key", async (req, res) => {
  try {
    const db = admin.database();
    const ref = db.ref(`guestbook/${req.params.key}`);
    const snapshot = await ref.once("value");
    res.json(snapshot.val());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/entries/:key", async (req, res) => {
  try {
    const db = admin.database();
    const ref = db.ref(`guestbook/${req.params.key}`);
    await ref.update(req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/entries/:key", async (req, res) => {
  try {
    const db = admin.database();
    const ref = db.ref(`guestbook/${req.params.key}`);
    await ref.remove();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/entries-all", async (req, res) => {
  try {
    const db = admin.database();
    const ref = db.ref("guestbook");
    await ref.remove();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🔹 Seeder untuk data dummy BackToSchool90s
app.get('/seed-random', async (req, res) => {
  try {
    const db = admin.database();
    const ref = db.ref('guestbook');

    const names = ['Andi', 'Rina', 'Dewi', 'Bayu', 'Budi', 'Sinta', 'Agus', 'Tono', 'Susi', 'Tina'];
    const comments = [
      'Seru banget acaranya!',
      'Kangen masa sekolah nih 😍',
      'Nostalgia abis!',
      'Gokil vibes-nya!',
      'Pokoknya mantap!',
      'Lucu banget semua kostumnya!',
      'Asli kayak balik ke 90an!',
      'Pengen acara kayak gini lagi!',
    ];

    const total = parseInt(req.query.total) || 50; // ?total=100 misalnya
    const batch = [];

    for (let i = 0; i < total; i++) {
      const name = names[Math.floor(Math.random() * names.length)];
      const comment = comments[Math.floor(Math.random() * comments.length)];
      const char = Math.floor(Math.random() * 8) + 1;

      const newData = {
        name,
        comment,
        char,
        timestamp: Date.now(),
      };

      batch.push(ref.push(newData));
    }

    await Promise.all(batch);

    res.json({ success: true, message: `${total} data dummy berhasil ditambahkan!` });
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    res.status(500).json({ error: error.message });
  }
});

// --- SERVER LISTEN / EXPORT ---
// For local development
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running in port:${PORT}`);
  });
}

// For Vercel Serverless Function
module.exports = app;
