const express = require('express');
const http = require('http');
const fs = require('fs');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Store sessions and listeners
const sessions = {};

app.use(express.static('public')); // Serve static files from the public folder
app.get('/createSession', (req, res) => {
  const sessionId = generateSessionId();
  const session = {
    id: sessionId,
    audioStream: generateAudioStream(), // Replace with your audio stream setup
    sockets: [],
  };

  sessions[sessionId] = session;

  res.json({
    sessionId,
    socketUrl: `/stream/${sessionId}`,
  });
});

app.get('/stream/:sessionId', (req, res) => {
  const sessionId = req.params.sessionId;
  if (!sessions[sessionId]) {
    return res.status(404).send('Session not found');
  }
  res.sendFile(__dirname + '/index.html'); // Replace with your HTML file
  const socket = io.of(`/stream/${sessionId}`).on('connection', (clientSocket) => {
    sessions[sessionId].sockets.push(clientSocket);
    clientSocket.on('disconnect', () => {
      sessions[sessionId].sockets = sessions[sessionId].sockets.filter(s => s !== clientSocket);
    });
  });
});

// Helper function to generate a unique session ID
function generateSessionId() {
  return Math.random().toString(36).substr(2, 9);
}

// Helper function to generate a dummy audio stream
function generateAudioStream() {
  // Replace this with your audio stream logic
  // Example: return fs.createReadStream('path/to/audio/file.pcm');
  return "stream"
}

// Dummy route to serve the HTML file
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});