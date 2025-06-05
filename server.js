const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3002;

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// All requests should return the index.html file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Web App A server running at http://localhost:${PORT}`);
});
