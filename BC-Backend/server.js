const express = require('express');
const cors = require('cors');
require('dotenv').config()
const app = express();
const db = require('./db/dbConfig.js')




const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/api/test-db', async (req,res)=>{
    try {
        const result = await db.one('SELECT NOW()');
        res.json({
            message: 'Database Connection successful!',
            timestamp: result.now
        })
    } catch (error) {
        res.status(500).json({
            message: 'FAILED TO CONNECT',
            error: error.message
        })
    }
})

app.get('/', (req, res) => {
    res.json({message:"Running server for Batch Calculator..."});
});

app.listen(PORT, ()=>{
    console.log(`Server running on port ${PORT}`);    
})