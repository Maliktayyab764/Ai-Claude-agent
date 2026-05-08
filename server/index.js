import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { initializeDatabase } from './config/database.js';
import Orchestrator from './agents/Orchestrator.js';
import userRoutes from './routes/users.js';
import jobRoutes from './routes/jobs.js';
import createAgentRoutes from './routes/agents.js';
import createResumeRoutes from './routes/resume.js';
import gmailRoutes from './routes/gmail.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

initializeDatabase();

const orchestrator = new Orchestrator();

app.use('/api/users', userRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/agents', createAgentRoutes(orchestrator));
app.use('/api/resume', createResumeRoutes(orchestrator));
app.use('/api/gmail', gmailRoutes);

app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    name: 'AI Job Apply Multi-Agent Platform',
    agents: orchestrator.listAgents().length,
    timestamp: new Date().toISOString()
  });
});

app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, '..', 'client', 'dist', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.json({ message: 'API is running. Frontend not built yet. Run: cd client && npm run build' });
  }
});

app.use((err, req, res, _next) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: err.message });
});

app.listen(PORT, () => {
  console.log(`\n🚀 AI Job Apply Platform running on http://localhost:${PORT}`);
  console.log(`📊 ${orchestrator.listAgents().length} AI Agents active`);
  console.log(`💾 Database initialized\n`);
});

export default app;
