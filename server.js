const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Routes - Proxy to Emika API
const API_BASE = 'https://api.emika.ai/seat-skills/comms';
const headers = {
  'X-Seat-Token': process.env.SEAT_TOKEN || '',
  'Content-Type': 'application/json'
};

// Helper function for API calls
async function proxyApiCall(endpoint) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, { headers });
    if (!response.ok) {
      throw new Error(`API call failed: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`API Error for ${endpoint}:`, error);
    throw error;
  }
}

// GET /api/workflows - Get all workflows
app.get('/api/workflows', async (req, res) => {
  try {
    const data = await proxyApiCall('/workflows');
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch workflows', details: error.message });
  }
});

// GET /api/tasks - Get all tasks
app.get('/api/tasks', async (req, res) => {
  try {
    const data = await proxyApiCall('/tasks');
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tasks', details: error.message });
  }
});

// GET /api/directory - Get team directory
app.get('/api/directory', async (req, res) => {
  try {
    const data = await proxyApiCall('/directory');
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch directory', details: error.message });
  }
});

// Serve the main app
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`COO Operations Dashboard running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Seat Token: ${process.env.SEAT_TOKEN ? 'Set' : 'Not Set'}`);
});