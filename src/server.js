
// This program is part of the STREAMER MVP
// It is the node.js + express server

// This first iteration will be following the concept plan on this miro board:
// https://miro.com/welcomeonboard/VmY5M3NiWllRMHpsNTZ4dVpEOEFHN0VhYnVGMnl0V1FWeFVzYTVHNUZSVGNoQ2JwNEpCTDBWWDVMUEFRVzU2bnwzNDU4NzY0NTMzNTY3NDczMzg5fDI=?share_link_id=927839796842


// 1) Users will innitialize a new session for their listening ( for now - as soon as they log in )
// this will return the sessionID that they created for their audio stream.
// /create-session

// 2) Users can choose to listen to another user's active stream
// /connect-to-stream/:sessionId



// Imports
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const fs = require('fs');


// Instantiate server instance
const app = express();
const server = http.createServer(app);
const socket_io = socketIO(server);

// constants and app-wide variables
const chunkSize = 1024;

// Store sessions and listeners
const sessions = {};



const get_song_and_stream_to_sockets = ( sockets ) => {

  // Read the audio file in chunks and send to the client
  const audioFilePath = 'path/to/your/audio/file.pcm';
  
  const stream = fs.createReadStream(audioFilePath, { highWaterMark: chunkSize });


  sockets.forEach( socket => {
    
      fileStream.on('data', (data) => {
        setTimeout(() => {
          encoder.write(data);
        }, 100);
      });
      
      stream.on('end', () => {
          // Signal the end of the audio stream
          socket.emit('audioEnd');
      });
      
      socket.on('disconnect', () => {
          console.log('User disconnected');
          stream.close(); // Close the stream when the user disconnects
      });

  })
  

}





// Innitialize a new session for the user's listening stream and return a newID
app.get('/create-session', (req, res) => {
  const new_sessionId = generateSessionId();
  const new_session = { id: new_sessionId, audioStream: generateAudioStream(),  sockets: [] };
  sessions[new_sessionId] = new_session;

  res.json({ new_sessionId, socketUrl: `/stream/${new_sessionId}` });

  // Handle data sent from the client
  socket.on('clientMessage', (data) => {
    console.log('Received message from client:', data);

    // Broadcast the message to all connected clients
    io.emit('serverMessage', 'Hello, client! I received your message.');
  });
});


// Try connecting to another user's session.
app.get('/connect-to-stream/:sessionId', (req, res) => {
  const sessionId = req.params.sessionId;
  if (!sessions[sessionId]) return res.status(404).send('Invalid Session Id');

  const handle_disconnect_socket = () => {
    sessions[sessionId].sockets = sessions[sessionId].sockets.filter(s => s !== clientSocket);
  }
  const handle_connect_socket = ( clientSocket ) => {
    clientSocket.on('disconnect', handle_disconnect_socket )
    sessions[sessionId].sockets.push(clientSocket);
  };

  const socket = socket_io.of(`/stream/${sessionId}`)
  .on('connection', handle_connect_socket );
  res.json({ clientSocket })
});


// Test Case to see what happens trying to emit data
app.get('/sendData/:sessionId',(req,res) => {
  const sessionId = req.params.sessionId;
  if (!sessions[sessionId]) return res.status(404).send('Invalid Session Id');

  sessions[sessionId].sockets.forEach(socket => {
    socket.emit('serverEvent', { data: 'here is a test data'} )
  });
  
})






// Helper function to generate a unique session ID
function generateSessionId() {
  return Math.random().toString(36).substr(2, 9);
}

// Helper function to generate a dummy audio stream
function generateAudioStream() {
  // Replace this with your audio stream logic
  // Example: return fs.createReadStream('path/to/audio/file.pcm');
}

// Dummy route to serve the HTML file
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});


// app.use(express.static('public')); // Serve static files from the public folder





// Start the server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});