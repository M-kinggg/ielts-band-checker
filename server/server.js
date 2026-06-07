require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

// Load environment variables from root directory .env
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config(); // Also check locally

const { parseFile } = require('./utils/parser');
const { gradeEssay } = require('./utils/grader');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Set up Multer for handling file uploads in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'IELTS Band Checker Server is running',
    timestamp: new Date().toISOString(),
    apiConfigured: !!(process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'your_key_here')
  });
});

// File parser endpoint
app.post('/api/parse-file', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file was uploaded. Please upload a PDF, DOCX, or Image file." });
    }

    console.log(`Parsing file: ${req.file.originalname} (${req.file.mimetype})`);
    const text = await parseFile(req.file);
    
    if (!text || text.trim().length === 0) {
      return res.status(422).json({ error: "No readable English text could be extracted from the file." });
    }

    res.json({
      filename: req.file.originalname,
      text: text.trim()
    });
  } catch (error) {
    console.error("File parsing route error:", error.message);
    res.status(500).json({ error: error.message || "Failed to process the uploaded file." });
  }
});

// Grading endpoint
app.post('/api/grade', async (req, res) => {
  try {
    const { text, taskType, prompt, targetBand } = req.body;

    if (!text || text.trim().length < 50) {
      return res.status(400).json({ 
        error: "The essay is too short. Please submit at least 50 words to receive feedback." 
      });
    }

    console.log(`Grading requested for: ${taskType || 'task2'} (Target: ${targetBand || 'not specified'}). Essay length: ${text.length} chars.`);
    const report = await gradeEssay(text, taskType, prompt, targetBand);
    
    res.json(report);
  } catch (error) {
    console.error("Grading route error:", error.message);
    res.status(500).json({ error: error.message || "An error occurred during evaluation." });
  }
});

// Serve frontend in production
{
  const path = require('path')

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../client/dist')))
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '../client/dist/index.html'))
    })
  }
}

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled server error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

// Start listening
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`IELTS Band Checker server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`====================================================`);
});
