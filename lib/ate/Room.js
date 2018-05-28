<<<<<<< HEAD
global.rooms = {};
function Room(title) {
	this.title = title;
	this.id = toId(title);
	this.logs = [];
	this.users = {};
	rooms[this.id] = this;
	return this;
}
Room.prototype.addLog = function(msg) {
	this.sendLog(msg);
};
Room.prototype.add = function(msg) {
	this.sendLog('|' + msg, true);
};
Room.prototype.addRaw = function(msg) {
	this.sendLog('raw|' + msg, true);
};
Room.prototype.sendLog = function(originalMessage, exact) {
	var msg = '';
	if (this.id !== 'lobby') msg += '>' + this.id + '\n';
	if (!exact) originalMessage = 'c|' + originalMessage;
	msg += originalMessage;
	this.logs.push(originalMessage);
	this.send(msg);
};
Room.prototype.send = function(msg) {
	var userKeys = Object.keys(this.users);
	var userCount = userKeys.length;
	for (var i = 0; i < userCount; i++) {
		var connections = this.users[userKeys[i]].connections;
		var connectionCount = connections.length;
		for (var x = 0; x < connectionCount; x++) {
			var connection = connections[x];
			if (!connection.channels) continue;
			if (connection.channels[this.id]) connection.send(msg);
		}
	}
};
Room.prototype.initSocket = function(connection) {
	var data = 'init|' + this.title + '\n';
	data += 'users|';
	var userKeys = Object.keys(this.users);
	for (var i = 0; i < userKeys.length; i++) {
		var user = this.users[userKeys[i]];
		if (!user.named) continue;
		data += user.getIdentity() + ",";
	}
	if (data.substr(-1) != "|") data = data.slice(0, -1);
	data += "\n";
	var logsLen = this.logs.length;
	var logsToProvide = 100;
	if (logsLen < 100) logsToProvide = logsLen;
	for (var i = logsLen - logsToProvide; i < logsLen; i++) {
		log = this.logs[i];
		if (!log) break;
		data += log + "\n";
	}
	if (logsLen) data = data.slice(0, -1);
	connection.send(data);
};
Room.prototype.join = function(connection) {
	var user = connection.user;
	if (connection.channels && connection.channels[this.id]) {
		//you've already joined this room
		return;
	}
	if (!connection.channels) connection.channels = {};
	connection.channels[this.id] = true;
	this.initSocket(connection);
	if (user.firstJoin(this)) {
		this.users[user.userid] = user;
		user.rooms[this.id] = true;
		if (user.named) this.sendLog('j|' + user.getIdentity(), true);
	}
};
Room.prototype.leave = function(connection) {
	var user = connection.user;
	if (!connection.channels || !connection.channels[this.id]) {
		//you're not even in this room
		return;
	}
	connection.send('deinit|' + this.id);
	delete connection.channels[this.id];
	if (user.lastLeave(this)) {
		delete this.users[user.userid];
		delete user.rooms[this.id];
		if (user.named) this.sendLog('l|' + user.userid, true);
	}
};
Room.prototype.renameUser = function(from, to) {
	var user = this.users[from];
	if (from !== to) { //just changed symbol, no need to reassign user objects
		//change userid of objects on name change
		delete this.users[from];
		this.users[to] = user;
	}
	
	if (user.named) {
		if (from.substr(0, 5) === "guest") {
			//renaming from guest
			this.sendLog('j|' + user.getIdentity(), true);
		} else {
			//changing name
			this.sendLog('n|' + user.getIdentity() + '|' + from, true);
		}
	} else {
		//turned into a guest
		this.sendLog('l|' + user.userid, true);
	}
};
(function initializeRooms() {
	var defaultRooms = [{
		title: 'Lobby',
	}, {
		title: 'Staff',
	}];
	for (var i = 0; i < defaultRooms.length; i++) {
		var room = defaultRooms[i];
		new Room(room.title);
	}
})();

module.exports = Room;
=======
global.rooms = {};
function Room(title) {
	this.title = title;
	this.id = toId(title);
	this.logs = [];
	this.users = {};
	rooms[this.id] = this;
	return this;
}
Room.prototype.addLog = function(msg) {
	this.sendLog(msg);
};
Room.prototype.add = function(msg) {
	this.sendLog('|' + msg, true);
};
Room.prototype.addRaw = function(msg) {
	this.sendLog('raw|' + msg, true);
};
Room.prototype.sendLog = function(originalMessage, exact) {
	var msg = '';
	if (this.id !== 'lobby') msg += '>' + this.id + '\n';
	if (!exact) originalMessage = 'c|' + originalMessage;
	msg += originalMessage;
	this.logs.push(originalMessage);
	this.send(msg);
};
Room.prototype.send = function(msg) {
	var userKeys = Object.keys(this.users);
	var userCount = userKeys.length;
	for (var i = 0; i < userCount; i++) {
		var connections = this.users[userKeys[i]].connections;
		var connectionCount = connections.length;
		for (var x = 0; x < connectionCount; x++) {
			var connection = connections[x];
			if (!connection.channels) continue;
			if (connection.channels[this.id]) connection.send(msg);
		}
	}
};
Room.prototype.initSocket = function(connection) {
	var data = 'init|' + this.title + '\n';
	data += 'users|';
	var userKeys = Object.keys(this.users);
	for (var i = 0; i < userKeys.length; i++) {
		var user = this.users[userKeys[i]];
		if (!user.named) continue;
		data += user.getIdentity() + ",";
	}
	if (data.substr(-1) != "|") data = data.slice(0, -1);
	data += "\n";
	var logsLen = this.logs.length;
	var logsToProvide = 100;
	if (logsLen < 100) logsToProvide = logsLen;
	for (var i = logsLen - logsToProvide; i < logsLen; i++) {
		log = this.logs[i];
		if (!log) break;
		data += log + "\n";
	}
	if (logsLen) data = data.slice(0, -1);
	connection.send(data);
};
Room.prototype.join = function(connection) {
	var user = connection.user;
	if (connection.channels && connection.channels[this.id]) {
		//you've already joined this room
		return;
	}
	if (!connection.channels) connection.channels = {};
	connection.channels[this.id] = true;
	this.initSocket(connection);
	if (user.firstJoin(this)) {
		this.users[user.userid] = user;
		user.rooms[this.id] = true;
		if (user.named) this.sendLog('j|' + user.getIdentity(), true);
	}
};
Room.prototype.leave = function(connection) {
	var user = connection.user;
	if (!connection.channels || !connection.channels[this.id]) {
		//you're not even in this room
		return;
	}
	connection.send('deinit|' + this.id);
	delete connection.channels[this.id];
	if (user.lastLeave(this)) {
		delete this.users[user.userid];
		delete user.rooms[this.id];
		if (user.named) this.sendLog('l|' + user.userid, true);
	}
};
Room.prototype.renameUser = function(from, to) {
	var user = this.users[from];
	if (from !== to) { //just changed symbol, no need to reassign user objects
		//change userid of objects on name change
		delete this.users[from];
		this.users[to] = user;
	}
	
	if (user.named) {
		if (from.substr(0, 5) === "guest") {
			//renaming from guest
			this.sendLog('j|' + user.getIdentity(), true);
		} else {
			//changing name
			this.sendLog('n|' + user.getIdentity() + '|' + from, true);
		}
	} else {
		//turned into a guest
		this.sendLog('l|' + user.userid, true);
	}
};
(function initializeRooms() {
	var defaultRooms = [{
		title: 'Lobby',
	}, {
		title: 'Staff',
	}];
	for (var i = 0; i < defaultRooms.length; i++) {
		var room = defaultRooms[i];
		new Room(room.title);
	}
})();

module.exports = Room;
>>>>>>> 30f3aef14c50989fa4adbfef9706ba8e013e6b08
