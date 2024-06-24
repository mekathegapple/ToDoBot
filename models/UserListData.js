const mongoose = require('mongoose');
const todos = new mongoose.Schema({
    Title: String,
    Description: String,
    Status: Boolean
}, {timestamps : true});

const ButtonDataSchema = new mongoose.Schema({
	UserID: String,
    ToDos: [todos]
}, {timestamps : true});

const MessageModel = module.exports = mongoose.model('UserListData', ButtonDataSchema);