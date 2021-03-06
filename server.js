// const express = require('express');
const express = require('express');
const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const path = require('path');
var bodyParser = require('body-parser');

const port = 3001;

const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/chatmessages');
mongoose.set("debug", true);
let db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
	console.log('Connected to Mongo!');
});

const messageService = require('./services/message');

let usersInChat = [];
let usersJustJoined = [];

app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(bodyParser.json());

app.use(express.static('public'));
app.get('/', (req, res, next) => {
	res.sendFile(path.join(__dirname, '/public/index.html'));
});

//Socket CONNECTED
io.on('connection', (socket) => {
	console.log('a user connected!');

	//CHAT MESSAGE 
	let newMsg = {};
	socket.on('chat message', function (msg) {
		messageService.saveMessage(msg, (err, data) => {
			if (!err) {
				socket.broadcast.emit('chat message', msg);
				socket.emit('chat message', msg);
			}
			// console.log(err);
		})

	});

	// when the client emits 'add user', this listens and executes
	socket.on('add user', function (user) {
		
		// we store the username in the socket session for this client
		socket.userName = user.userName;
		socket.userNick = user.userNick;


		if (!usersInChat.includes(socket.userNick)) {
			usersInChat.push(socket.userNick);
		}
		if (!usersJustJoined.includes(socket.userNick)) {
			usersJustJoined.push(socket.userNick);
			setTimeout(() => {
				usersJustJoined.splice(usersJustJoined.indexOf(socket.userNick), 1);
				socket.emit('user joined', {usersInChat, usersJustJoined});
				socket.broadcast.emit('user joined', {usersInChat, usersJustJoined});
			}, 5000)
		}
		

		let messages = [];

		messageService.findAllMessages((err, data) => {
			if (!err) {
				messages = [...data];
				socket.emit('user joined', {
					usersInChat,
					messages,
					usersJustJoined
				});
			}
		})

		// echo globally (all clients) that a person has connected
		socket.broadcast.emit('user joined', {usersInChat, usersJustJoined});


	});

	// when the client emits 'typing', we broadcast it to others
	socket.on('typing', function (userNick) {
		socket.broadcast.emit('typing', userNick);
	});

	// when the client emits 'stop typing', we broadcast it to others
	socket.on('stop typing', function () {
		socket.broadcast.emit('stop typing', {
			usernick: socket.userNick
		});
	});

	//Socket DISCONNECTED
	socket.on('disconnect', function (userNick) {
		console.log('user disconnected');
		if (usersInChat.includes(socket.userNick)) {
			usersInChat.splice(usersInChat.indexOf(socket.userNick), 1);
			socket.broadcast.emit('user joined', usersInChat);
			socket.broadcast.emit('user disconnected', socket.userNick);
		}
		socket.broadcast.emit('user joined', usersInChat);
	});
})


app.use((req, res, next) => {
	res.status(404);
});
app.use((err, req, res, next) => {
	console.log('500', err);
	res.status(500);
});

// app.listen(port);
http.listen(port, () => {
	console.log(`Server started. Listening on port ${port}`);
})