const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json()); // Middleware to parse JSON bodies

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/output', (req, res) => {
    const data = req.body;
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const filePath = path.join(__dirname, 'output', `${timestamp}.json`);
    
    fs.writeFile(filePath, JSON.stringify(data), (err) => {
        if (err) {
            return res.status(500).send('Error saving file');
        }
        res.status(200).send('File saved successfully');
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
