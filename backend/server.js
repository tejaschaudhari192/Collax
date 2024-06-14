const express = require('express');
const http = require('http');


const cors = require("cors");
const { Server } = require("socket.io");

const { v4: uuidv4 } = require('uuid');

const app = express();
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:3000", // Allow requests from this origin
        methods: ["GET", "POST"] // Allow only GET and POST requests
    }
});
const PORT = process.env.PORT || 5000;

const { ExpressPeerServer } = require('peer');
const peerServer = ExpressPeerServer(httpServer, {
    debug: true
});
// const { v4: uuidV4 } = require('uuid')

app.use('/peerjs', peerServer);



io.on('connection', (socket) => {
    console.log('A user connected'); // Add this line

    // Handle joining a room with user ID, name, and room name
    socket.on('joinRoom', ({ userId, userName, room }) => {
        socket.join(room);
        console.log(`${userId} joined room ${room}`); // Add this line
        console.log('---------------------------------------------\n')

        // const uId = uuidv4();
        // Broadcast to all users in the room that a new user has joined
        // socket.to(room).emit('userJoined', { userId, userName });
        socket.on('ready', () => {
            socket.broadcast.to(room).emit('userJoined', { userId, userName });
        })
    });

    // Handle changing text within a room
    socket.on('changeText', ({ text, user, room }) => {
        io.to(room).emit('updateText', text); // Emit updateText event to all users in the room
        // console.log(`${user} changed text in room ${room}`);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('A user disconnected'); // Add this line
    });
});


httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
