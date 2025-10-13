const http = require('http');
const mysql = require('mysql2');
const fs = require('fs');

const PORT = 3000;

// MySQL Connection Configuration
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Rajkayal@05',
  database: 'test_db'
});

// Connect to MySQL and initialize table
db.connect((err) => {
  if (err) {
    console.error('MySQL connection failed:', err);
    return;
  }
  console.log('Connected to MySQL!');

  // Create table if it doesn't exist
  const createTable = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) NOT NULL
    )
  `;
  db.query(createTable, (err) => {
    if (err) console.error('Error creating table:', err);
    else console.log('Table ready!');
  });
});

// Helper function to handle POST body parsing
function getPostData(req, callback) {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    try {
      callback(null, JSON.parse(body));
    } catch (e) {
      callback(e);
    }
  });
}

// Create HTTP Server
const server = http.createServer((req, res) => {

  // Serve the HTML file
  if (req.method === 'GET' && req.url === '/') {
    fs.readFile('index2.html', (err, data) => {
      if (err) {
        // Handle error if index.html is missing
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error loading index.html file.');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
  }

  // CREATE endpoint
  else if (req.method === 'POST' && req.url === '/create') {
    getPostData(req, (err, data) => {
      if (err) return res.writeHead(400).end('Invalid JSON');
      db.query('INSERT INTO users (name, email) VALUES (?, ?)', [data.name, data.email], (dbErr) => {
        if (dbErr) { console.error('DB Error:', dbErr); res.writeHead(500).end('DB Error'); return; }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'User created' }));
      });
    });
  }

  // READ endpoint
  else if (req.method === 'GET' && req.url === '/read') {
    db.query('SELECT * FROM users', (err, rows) => {
      if (err) { console.error('DB Error:', err); res.writeHead(500).end('DB Error'); return; }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(rows || []));
    });
  }

  // UPDATE endpoint
  else if (req.method === 'POST' && req.url === '/update') {
    getPostData(req, (err, data) => {
      if (err) return res.writeHead(400).end('Invalid JSON');
      db.query('UPDATE users SET name=?, email=? WHERE id=?', [data.name, data.email, data.id], (dbErr) => {
        if (dbErr) { console.error('DB Error:', dbErr); res.writeHead(500).end('DB Error'); return; }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'User updated' }));
      });
    });
  }

  // DELETE endpoint
  else if (req.method === 'POST' && req.url === '/delete') {
    getPostData(req, (err, data) => {
      if (err) return res.writeHead(400).end('Invalid JSON');
      db.query('DELETE FROM users WHERE id=?', [data.id], (dbErr) => {
        if (dbErr) { console.error('DB Error:', dbErr); res.writeHead(500).end('DB Error'); return; }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'User deleted' }));
      });
    });
  }

  // 404 handler
  else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  console.log('🚀 Server running at http://localhost:' + PORT);
});