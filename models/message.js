const mongoose = require('mongoose');

const Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;
 
var messageSchema = new Schema({
    userName: String,
	userNick: { type: String, required: true, unique: true },
	receiver: String,
	text: String,
	date: { type: Date, default: Date.now }
});

const Message = mongoose.model('msg', messageSchema);

module.exports = Message;