var mongoose = require('mongoose'),
	jwt = require('jsonwebtoken'), // used to create, sign, and verify tokens
	bcrypt = require('bcrypt-nodejs');
mongoose.connect("mongodb://localhost/ate", {useNewUrlParser: true}); // connect to database
var UserModel = models.UserModel;
var DeckModel = models.DeckModel;
var superSecret = 'blowfish';

var userCount = 0;
global.users = {};
function User(socket) {
	socket.send = function() {
		var room;
		var msg = '';
		if (arguments[1]) {
			//(room, msg)
			room = arguments[0];
			if (room.id) room = room.id;
			if (room && room !== 'lobby') msg += ">" + room + "\n";
			msg += arguments[1];
		} else {
			//(msg)
			msg = arguments[0];
		}
		this.emit('e', msg);
	};
	this.name = "Guest" + (++userCount);
	this.userid = toId(this.name);
	this.connections = [socket];
	this.connected = true;
	this.rooms = {};
	this.named = false;
	this.rank = 0;
	this.ips = {};
	this.challenges = {from: {}, to: {}};
	this.ips[socket.handshake.address] = 1;
	this.registered = false;
	socket.user = users[this.userid] = this;
	this.updateUser();
	return this;
}
User.prototype.afterRegister = function() {
	if (this.saveDeckOnRegister) {
		events['save deck'](this, this.saveDeckOnRegister);
		delete this.saveDeckOnRegister;
	}
};
User.prototype.finishRename = function(name, token, socket) {
	var oldUserid = this.userid;
	var userid = toId(name);
	//remove old user object
	this.destroyChallenges();
	delete users[this.userid];
	var targetUser = users[userid];
	if (!targetUser) {
		users[userid] = this;
	} else {
		//merge user
		users[userid].merge(this);
	}
	this.name = name;
	this.userid = userid;
	this.connected = true;
	this.named = true;
	this.rank = 0;
	this.registered = false;
	if (Config.auths[userid]) this.rank = Config.auths[userid];
	if (name.substr(0, 5) === "Guest") this.named = false;
	if (token) this.registered = true;
	if (token !== true && token !== false) {
		this.token = token;
		this.updateUser(token);
	} else this.updateUser();
	
	//let the rooms know about the name change
	var roomKeys = Object.keys(this.rooms);
	for (var i = 0; i < roomKeys.length; i++) {
		var room = rooms[roomKeys[i]];
		room.renameUser(oldUserid, userid);
	}
	var user = users[userid];
	user.connected = true;
	user.updateSocketsUser();
	user.sendChallenges();
	if (user.registered && socket) user.sendDecks(socket);
	if (user.game) user.game.reconnect(user, socket);
	if (user.connections.length === 1) user.firstConnection();
};
User.prototype.updateUser = function(token) {
	this.send('user|' + this.getIdentity() + '|' + (token ? token : ''));
};
User.prototype.merge = function(oldUser) {
	//merge connections
	var connections = oldUser.connections;
	var connectionCount = connections.length;
	for (var i = 0; i < connectionCount; i++) {
		var connection = connections[i];
		if (connections.channels) {
			//if in any rooms add them to user object
			for (var x in connections.channels) this.rooms[x] = true;
		}
		this.connections.push(connection);
	}
	
	//merge ips
	var ipKeys = Object.keys(oldUser.ips);
	for (var i = 0; i < ipKeys.length; i++) {
		var ip = ipKeys[i];
		this.ips[ip] = 1;
	}
};
User.prototype.updateSocketsUser = function() {
	var connections = this.connections;
	var connectionCount = connections.length;
	for (var i = 0; i < connectionCount; i++) {
		var connection = connections[i];
		connection.user = this;
	}
};
User.prototype.disconnect = function(connection) {
	var connectionCount = this.connections.length;
	for (var i = 0; i < connectionCount; i++) {
		if (connection === this.connections[i]) {
			this.logoutSocket(connection, i);
			break;
		}
	}
	if (!this.connections.length) this.logout();
};
User.prototype.logoutSocket = function(connection, key) {
	connection.send = function() {};
	//disconnect from all rooms
	if (connection.channels) {
		var keys = Object.keys(connection.channels);
		for (var i = 0; i < keys.length; i++) rooms[keys[i]].leave(connection);
	}
	//remove socket from connections
	this.connections.splice(key, 1);
};
User.prototype.ban = function() {
	for (var ip in this.ips) Config.bannedIps[ip] = this.userid;
	this.send('banned');
	this.disconnectAll();
};
User.prototype.unban = function() {
	for (var ip in Config.bannedIps) {
		var userid = Config.bannedIps[ip];
		if (this.userid === userid) delete Config.bannedIps[ip];
	}
};
User.prototype.kick = function(targetRoom) {
	for (var i in this.connections) {
		var socket = this.connections[i];
		if (socket.channels && !socket.channels[targetRoom.id]) {
			//skip sockets not inside of targetRoom
			continue;
		}
		targetRoom.leave(socket);
	}
};
User.prototype.disconnectAll = function(room) {
	for (var i in this.connections) {
		var socket = this.connections[i];
		socket.disconnect();
	}
	this.connections = [];
};
User.prototype.firstJoin = function(room) {
	//check if this is the first connection to join a room
	var id = room.id || room;
	var connectionsToRoom = 0;
	for (var i = 0; i < this.connections.length; i++) {
		var connection = this.connections[i];
		if (!connection.channels) continue;
		if (connection.channels[id]) {
			if (++connectionsToRoom === 2) break; //we don't need to go any further, we know this is not the first join
		}
	}
	if (connectionsToRoom === 1) return true;
	return false;
};
User.prototype.lastLeave = function(room) {
	//check if no connections are left to a room
	var id = room.id || room;
	var connectionsToRoom = 0;
	for (var i = 0; i < this.connections.length; i++) {
		var connection = this.connections[i];
		if (!connection.channels) continue;
		if (connection.channels[id]) {
			if (++connectionsToRoom === 1) break; //we don't need to go any further, we know we still have active connections to the room
		}
	}
	if (connectionsToRoom === 0) return true;
	return false;
};
User.prototype.isIn = function(room) {
	return !this.lastLeave(room);
};
User.prototype.firstConnection = function() {
	
};
User.prototype.logout = function() {
	this.destroyChallenges();
	this.connected = false;
	if (this.finding) {
		//cancel find by finding again
		events.search(this);
	}
	if (!this.named) {
		//it's a guest account
		//we can remove these automatically
		this.destroy();
	}
	if (this.game) {
		if (this.game.isPlayer(this)) {
			//soft leave if it's a player in the game
			this.game.notifyLeave(this);
		} else this.game.leave(this);
	}
};
User.prototype.destroy = function() {
	if (this.game) this.game.leave(this);
	delete users[this.userid];
};
User.prototype.register = function(name, password) {
	//creating a user
	if (this.game) return this.send('err|You may not change your name while in a duel.');
	name = name || '';
	if (name.length > 20) return this.send('registername||Names should be 20 or less characters.');
	name = this.filterName(name);
	var userid = toId(name);
	if (!userid || userid.substr(0, 5) === "guest") return this.send('registername||This name is invalid.');
	if (!password) return this.send('registername|' + name + '|No password.');
	var self = this;
	function cb(password) {
		var user = new UserModel({
			userid: userid,
			name: name,
			password: password
		});
		user.save(function(err) {
			if (err) throw err;
			//success
			console.log('user has been saved');
		});
		
		var token = jwt.sign(user.toJSON(), superSecret, {
			expiresIn: 60 * 1440 * 7 // expires in a week
		});
		self.finishRename(name, token);
		self.afterRegister();
	}
	bcrypt.genSalt(10, function(err, salt) {
		if (err) return console.log(err);
		bcrypt.hash(password, salt, null, function(err, hash) {
			if (err) return console.log(err);
			cb(hash);
		});
	});
};
User.prototype.rename = function(name) {
	//if regged show them the prompt
	if (this.game) return this.send('err|You may not change your name while in a duel.');
	name = name || '';
	if (name.length > 20) return this.send('nametaken||Names should be 20 or less characters.');
	name = this.filterName(name);
	var userid = toId(name);
	if (!userid || userid.substr(0, 5) === "guest") return this.send('nametaken||This name is invalid.');
	var self = this;
	console.log(userid);
	UserModel.findOne({
		userid: userid
	}, function(err, user) {
		if (err) throw err;
		if (user) return self.send('nameregged|' + name + '|This username is registered.');
		//not registered
		if (users[userid] && users[userid].connected) return self.send('nametaken|' + name + '|This name is currently being used.');
		self.finishRename(name);
	});
};
User.prototype.login = function(name, password, socket) {
	//authenticating a user with name and password
	if (this.game) return this.send('err|You may not change your name while in a duel.');
	name = this.filterName(name || '');
	var self = this;
	UserModel.findOne({
		userid: toId(name)
	}, function(err, user) {
		if (err) throw err;
		if (!user) {
			//authentication failed user not found
			return;
		}
		function cb(err, match) {
			if (err) return console.log(err);
			if (!match) {
				//wrong pass
				return self.send('nameregged|' + name + '|Authentication failed. Wrong password.');
			} else {
				// if user is found and password is right
				// create a token
				var token = jwt.sign(user.toJSON(), superSecret, {
					expiresIn: 60 * 1440 * 7 // expires in a week
				});

				// return the information including token as JSON
				self.finishRename(name, token, socket);
			}
		}
		bcrypt.compare(password, user.password, function(err, isMatch) {
			if (err) return cb(err);
			cb(null, isMatch);
		});
	});
};
User.prototype.loginByToken = function(token, socket) {
	//authenticating a user with a token
	if (this.game) return this.send('err|You may not change your name while in a duel.');
	var self = this;
	jwt.verify(token, superSecret, function(err, dbUser) {
		if (err) {
			//token couldnt be authenticated
			return self.send('tokenerror||Token could not be authenticated');
		}
		// if everything is good, save to request for use in other routes
		self.finishRename(dbUser.name, true, socket);
	});
};
User.prototype.getIdentity = function() {
	return Config.ranks[this.rank] + this.name;
};
User.prototype.filterName = function(name) {
	function toName(name) {
		name = string(name);
		name = name.replace(/[\|\s\[\]\,]+/g, ' ').trim();
		if (name.length > 20) name = name.substr(0, 20).trim();
		return name;
	}
	name = toName(name);
	name = name.replace(/^[^A-Za-z0-9]+/, "");
	return name;
};
User.prototype.send = function(data) {
	var connections = this.connections;
	var connectionCount = connections.length;
	for (var i = 0; i < connectionCount; i++) connections[i].send(data);
};
/* game stuff */
User.prototype.sendDecks = function(socket) {
	if (!socket) socket = this;
	DeckModel.find({
		userid: this.userid
	}, function(err, decks) {
		if (err) throw err;
		if (decks.length === 0) return console.log('no decks');
		var decksList = '';
		for (var i = 0; i < decks.length; i++) decksList += decks[i].name + '|';
		decksList = decksList.slice(0, -1);
		socket.send('decks|' + decksList);
	});
};
User.prototype.findDeck = function(name, cb) {
	DeckModel.findOne({
		userid: this.userid,
		name: name
	}, function(err, deck) {
		if (err) throw err;
		if (!deck) return cb({});
		return cb(deck);
	});
};
User.prototype.openDeck = function(data) {
	if (typeof data !== 'object') {
		data = {
			socket: this,
			name: data,
			id: data
		};
	}
	this.findDeck(data.name, function(deck) {
		data.socket.send('deckString|' + data.id + '|' + deck.deck);
	});
};
User.prototype.saveDeck = function(data) {
	var self = this;
	DeckModel.findOneAndUpdate({
		name: data.name,
		userid: self.userid
	}, {
		deck: data.deckString,
		name: data.name,
		userid: self.userid
	}, {
		upsert: true
	}, function() {}); //for some reason it doesn't update unless i have a callback
};
User.prototype.deleteDeck = function(deckName) {
	DeckModel.findOneAndRemove({
		name: deckName,
		userid: this.userid
	}, function() {}); //for some reason it doesn't update unless i have a callback
};
User.prototype.sendChallenges = function() {
	//send challenges
	var challString = '';
	var lists = ["from", "to"];
	var challCount = 0;
	for (var i = 0; i < 2; i++) {
		var list = lists[i];
		var keys = Object.keys(this.challenges[list]);
		var _challCount = keys.length;
		challCount += _challCount;
		for (var x = 0; x < _challCount; x++) {
			var chall = this.challenges[list][keys[x]];
			challString += chall.sender + ',' + chall.receiver + ',' + chall.tier + '|';
		}
	}
	if (challCount) this.send('chall|' + challString.slice(0, -1));
};
User.prototype.cancelChallenge = function(opp) {
	var user = this;
	delete user.challenges.from[opp.userid];
	delete user.challenges.to[opp.userid];
	delete opp.challenges.to[user.userid];
	delete opp.challenges.from[user.userid];
	opp.send('reject|' + user.userid);
	user.send('reject|' + opp.userid);
};
User.prototype.destroyChallenges = function() {
	var lists = ["from", "to"];
	for (var i = 0; i < 2; i++) {
		var list = lists[i];
		var keys = Object.keys(this.challenges[list]);
		var challCount = keys.length;
		for (var x = 0; x < challCount; x++) this.cancelChallenge(users[keys[x]]);
	}
};

module.exports = User;
