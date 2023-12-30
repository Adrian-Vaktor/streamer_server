
// This program is part of the STREAMER MVP
// It is the node.js + express server

// This first iteration will be following the concept plan on this miro board:
// https://miro.com/welcomeonboard/VmY5M3NiWllRMHpsNTZ4dVpEOEFHN0VhYnVGMnl0V1FWeFVzYTVHNUZSVGNoQ2JwNEpCTDBWWDVMUEFRVzU2bnwzNDU4NzY0NTMzNTY3NDczMzg5fDI=?share_link_id=927839796842


// 1) Users will innitialize a new session for their listening ( for now - as soon as they log in )
// this will return the sessionID that they created for their audio stream.
// /create-session

// 2) Users can choose to listen to another user's active stream
// /connect-to-stream/:sessionId


//--------------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------


// Imports 
//--------------------------------------------------------------------------------------------------
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const { Readable } = require('stream');
const fs = require('fs');
const lame = require('lame')
const wav = require('wav');


// Instantiate server instance
//--------------------------------------------------------------------------------------------------
const app = express();
const server = http.createServer(app);
const socket_io = socketIO(server);


// Server Dependencies
//--------------------------------------------------------------------------------------------------

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


// Constants and app-wide variables
//--------------------------------------------------------------------------------------------------

const chunkSize = 1024;

// Dynamic App variables and stores
//--------------------------------------------------------------------------------------------------

const sessions = {};

// Audio file encoders and decoders 
//--------------------------------------------------------------------------------------------------

const mp3_decoder = new lame.Decoder();
const pcm_encoder = new wav.Writer({
  sampleRate: 44100, // Replace with your desired sample rate
  channels: 2, // Replace with your desired number of channels
  bitDepth: 16, // Replace with your desired bit depth
});

// Custom Data Types and Structs 
//--------------------------------------------------------------------------------------------------

// Used to track the Active Listener's song stream position and effect on changes
class SongStream_ActiveListener_ClientInformation{
  constructor(){
    this.listener_id = null
    this.session_id = null
    this.socket_id = null
    this.songdata = null
    this.playback_position_time = null
    this.playback_position_samples = null
  }
}

// Used to track a passive listener's song stream position
class SongStream_PassiveListener_ClientInformation{
  constructor(){
    this.listener_id = null
    this.session_id = null
    this.socket_id = null
    this.songdata = null
    this.playback_position_time = null
    this.playback_position_samples = null
  }
}

// Used to fetch and store the currently selected or playing song's data and information
class SongData{
  constructor(){
    this.audio_file_id = null
    this.audio_file_data = null
    this.audio_file_length_time = null
    this.audio_file_length_samples = null
    this.number_of_channels = null
    this.sample_rate = null
    this.stream_chunk_width_per_second = null
    this.song_information = null

    // this.read_stream = new Readable({
    //   readableHighWaterMark: chunkSize,
    //   read( present_chunk_size ){

    //     // If no signal or at the end of the signal --> send null flag to end of the stream.
    //     // Else: 
    //     // Slice out the chunk size of data from the start of the remaining file data --> then redeclare the file data with the remaing data.
    //     // Push the chunk into the readstream.

    //     if (this.audio_file_data.length <= 0) {
    //       this.push(null);
    //       return
    //     }
    //     const present_chunk = this.audio_file_data.slice(0, present_chunk_size);
    //     this.audio_file_data = songData.slice( present_chunk_size );
    //     this.push( present_chunk );
    //   }
    // })
  }
  fetch_song_audio_data = () => {}
  fetch_song_metadata = () => {}
  // calculate_chunk_width_per_second = () => {}

  init = () => {}

  get_song_file_from_song_id = ( song_id ) => {
    // Logic to fetch data from database or create readstream from this place of the database
    const song_file = song_id
    return song_file
  }

  get_song_stream_from_id = ( song_id ) => {
    const audio_file_data = get_song_pcm_data_from_song_id( song_id )
    const songStream = new Readable({
      read( present_chunk_size ) {

      },
    });
    this.read_stream = fs.createReadStream()
    return this
  }

  // Get a readstream from the audio file location
  get_song_stream_from_location = ( song_location ) => {
    const audioFilePath = song_location || 'path/to/your/audio/file.pcm' ;
    this.read_stream = audioFilePath
    return this
  }  
}

// Used to create and store the readstream for the currently selected or playing song
class SongReadStream{
  constructor( song_data ){
    this.song_data = song_data
    this.last_chunk_sample_position = 0
    this.song_read_stream = null
  }
  create_read_stream = ( on_data_callback, on_end_callback) => {
    // NEEDED: Logic that handles the correct file conversions to PCM
    const current_decoder = mp3_decoder
    const current_encoder = pcm_encoder
    this.song_read_stream = fs.createReadStream( song_data )
      .pipe(current_decoder)
      .pipe(current_encoder)
      .on('data', on_data_callback)
      .on('end', on_end_callback)
    
      // .on('data', (chunk) => {
      //   // This event is emitted when PCM data is available
      //   // Push the chunk into the PCM stream
      //   pcmStream.push(chunk);
      // })
      // .on('end', () => {
      //   // Signal the end of the PCM stream when decoding is complete
      //   pcmStream.push(null);
      // });
  }
}



// System Functions
//--------------------------------------------------------------------------------------------------

// Send a chunk of data down the sockets from the Audio ReadStream
const send_data_to_all_sockets = ( data_chunk, sockets_array ) => {
  sockets_array.forEach((socket) => {
    socket.emit( 'data', data_chunk)
  })  
}

// Send the end flag for the audio ReadStream to all the sockets
const send_endflag_to_all_sockets = ( sockets_array ) => {
  sockets_array.forEach((socket) => {
    socket.emit('audioEnd')
  })  
}

// Read the audio file in chunks and send to the client
const stream_song_to_sockets = ( song_location, sockets_array ) => {
  const song_stream = new SongReadStream()
  song_stream.get_song_stream_from_location(song_location)
  song_stream.read_stream.on( 'data' , ( data_chunk ) => { setTimeout(() => send_data_to_all_sockets( data_chunk, sockets_array ), 100) })
  song_stream.read_stream.on( 'end' , () => { send_endflag_to_all_sockets( sockets_array ) });
}

// Innitialize a new session for the user's listening stream and return a newID
app.get('/create-session', (req, res) => {
  const new_sessionId = generateSessionId();
  const new_session = { id: new_sessionId, audioStream: generateAudioStream(),  sockets: [] };
  sessions[new_sessionId] = new_session;

  res.json({ new_sessionId, socketUrl: `/stream/${new_sessionId}` });
});

app.post('/play-song', (req,res) => {
  // Access data from the request body
  const postData = req.body;
  const userId = postData.userId
  const songId = postData.songId

  
  
  // Send a response
  res.json({ message: 'Data received successfully' });
})


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

  // Handle data sent from the client
  socket.on('clientMessage', (data) => {
    console.log('Received message from client:', data);

    // Broadcast the message to all connected clients
    io.emit('serverMessage', 'Hello, client! I received your message.');
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });


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