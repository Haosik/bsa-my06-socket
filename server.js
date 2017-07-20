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
let numUsers = 0;

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
	let addedUser = false;
	console.log('a user connected!');

	//CHAT MESSAGE 
	socket.on('chat message', function (msg) {
		io.emit('chat message', msg);
	});

	// when the client emits 'add user', this listens and executes
	socket.on('add user', function (username) {
		if (addedUser) return;

		// we store the username in the socket session for this client
		socket.username = username;
		++numUsers;
		addedUser = true;
		socket.emit('login', {
			numUsers: numUsers
		});

		// echo globally (all clients) that a person has connected
		socket.broadcast.emit('user joined', {
			username: socket.userName,
			usernick: socket.adapter.userNick,
			numUsers: numUsers
		});
	});

	// when the client emits 'typing', we broadcast it to others
	socket.on('typing', function () {
		socket.broadcast.emit('typing', {
			usernick: socket.userNick
		});
	});

	// when the client emits 'stop typing', we broadcast it to others
	socket.on('stop typing', function () {
		socket.broadcast.emit('stop typing', {
			usernick: socket.userNick
		});
	});

	//Socket DISCONNECTED
	socket.on('disconnect', function () {
		console.log('user disconnected');
	});
})

// app.post('/', (req, res, next) => {
// 	console.log(req.body.userNick);
// 	usersInChat.push(req.body.userNick);
// 	res.send();
// });

// app.delete('/', (req, res, next) => {
// 	console.log(req.body.userNick);
// 	usersInChat.splice(usersInChat.indexOf(req.body.userNick), 1);
// 	// res.send();
// });


// app.get('/messages', (req, res, next) => {
// 	messageService.findAllMessages((err, data) => {
// 		if (!err) {
// 			let respData = {
// 				data,
// 				usersInChat
// 			}
// 			res.send(JSON.stringify(respData));
// 			return
// 		}
// 		next(err);
// 	})
// });

// app.post('/messages', (req, res, next) => {
// 	messageService.saveMessage(req.body, (err, data) => {
// 		if (!err) {
// 			res.send(200);
// 			return
// 		}
// 		next(err);
// 	})
// });



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