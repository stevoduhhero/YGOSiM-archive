// get an instance of mongoose and mongoose.Schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// set up a mongoose model and pass it using module.exports
var models = {};
models.UserModel = mongoose.model('UserModel', new Schema({
	userid: String,
    name: String,
    password: String
}));
models.DeckModel = mongoose.model('DeckModel', new Schema({
	deck: String,
    name: {
		type: String,
		unique: true
	},
    userid: String
}));
models.ReplayModel = mongoose.model('ReplayModel', new Schema({
	id: {
		type: String,
		unique: true
	},
	p1: String,
	p2: String,
	logs: String
}));
var LadderSchema = new Schema({
	serverid: String,
	formatid: String,
	userid: String,
	username: String,
	w: Number,
	l: Number,
	t: Number,
	gxe: Number,
	r: Number,
	rd: Number,
	sigma: Number,
	rptime: Number,
	rpr: Number,
	rprd: Number,
	rpsigma: Number,
	rpdata: String,
	acre: Number,
	lacre: Number
});
LadderSchema.virtual('entryid').get(function() {
	return this._id;
});
models.LadderModel = mongoose.model('LadderModel', LadderSchema);
module.exports = models;
