const mongoose = require('mongoose');
const Message = require('./../models/message');
mongoose.Promise = global.Promise;

module.exports = {
	findAllMessages: (callback) => {
		let q = Message.find({}).limit(100).sort({date: -1});
		q.exec((err, data) => {
			if (!err) {
				callback(null, data);
				return
			}
			callback(err);
		})
	},

	saveMessage: (message, callback) => {
		let newMsg = new Message( message );
		Message.create(newMsg, (err, data) => {
			if (!err) {
				console.log('Message saved to db!');
				return
			}
			callback(err);
		});
	}
}