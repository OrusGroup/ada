const express = require('express');
const app = express();
const path = require('path');
const PORT = process.env.PORT || 3000;

console.log("Starting Minimal Server...");

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Mock API endpoints to prevent 404s/Client Errors
app.post('/api/scan', (req, res) => res.json({ success: false, error: 'Scanner Temporarily Disabled for Maintenance' }));
app.get('/api/history', (req, res) => res.json([]));
app.get('/api/auth/me', (req, res) => res.json({ user: null }));

// Catch-all to index.html for SPA-like behavior (if needed, but mostly static)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Minimal Server running on port ${PORT}`);
});
