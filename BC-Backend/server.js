require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db/dbConfig');
const routes = require('./Routes/routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/api/test-db', async (req, res) => {
  try {
    const data = await db.one('SELECT NOW() as current_time');
    res.json({ success: true, time: data.current_time });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

app.use('/api', routes);

app.get('/', (req, res) => {
  res.json({ message: 'Batch Calculator API Running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});