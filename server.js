const express = require('express');
const app = express();
var bodyParser = require('body-parser');
const path = require('path');
const port = 3001;

const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/chatmessages');
mongoose.set("debug", true);
let db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('Connected to Mongo!');
});

const messageService = require('./services/message');

let usersInChat = [];

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());



app.get('/', (req, res, next) => {
	res.sendFile(path.join(__dirname, '/public/index.html'));
});

app.use(express.static('public'));

app.post('/', (req, res, next) => {
	console.log(req.body.userNick);
	usersInChat.push(req.body.userNick);
	res.send();
});

app.delete('/', (req, res, next) => {
	console.log(req.body.userNick);
	usersInChat.splice(usersInChat.indexOf(req.body.userNick), 1);
	// res.send();
});


app.get('/messages', (req, res, next) => {
	messageService.findAllMessages((err, data) => {
		if (!err) {
			let respData = {
				data,
				usersInChat
			}
			res.send(JSON.stringify(respData));
			return
		}
		next(err);
	})
});

app.post('/messages', (req, res, next) => {
	messageService.saveMessage(req.body, (err, data) => {
		if (!err) {
			res.send(200);
			return
		}
		next(err);
	})
});



app.use((req, res, next) => {
		res.status(404);
});
app.use((err, req, res, next) => {
	console.log('500', err);
	res.status(500);
});

app.listen(port);