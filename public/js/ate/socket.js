function Socket() {
	var socket = io();

	socket.on('connect', function() {
		console.log('I AM CONNECTED!');
		ate.socketInitialized();
	});

	/**
	 * Retreiving an event.
	 *
	 * @param {Object or String} data
	 *
	 * The data should be one large string
	 * Example - event|data1|data2|data3\nevent|data1|data2
	 */

	socket.on('e', function(data) {
		console.log(data);
		var events = this.REFERENCE.events;
		if (typeof data === "string") {
			var roomid = '';
			if (data.substr(0,1) === '>') {
				var nlIndex = data.indexOf('\n');
				if (nlIndex < 0) return;
				roomid = toId(data.substr(1,nlIndex-1));
				data = data.substr(nlIndex+1);
			}
			if (roomid) {
				if (ate.rooms[roomid]) {
					ate.rooms[roomid].receive(data);
				}
				return;
			}
			var rows = data.split('|');
			var event = rows[0];
			if (typeof events[event] === "string") event = events[event];
			if (events[event]) {
				events[event](rows);
			} else {
				//message meant for lobby
				var room = ate.rooms['lobby'];
				if (!room) room = ate.rooms['global'];
				room.receive(data);
			}
		} else {
			//just in case data has to come in as an object
			var event = data.event;
			if (events[data.event] === "string") event = events[data.event];
			if (events[event]) events[event](data);
		}
	});

	/**
	 * Emit an event.
	 *
	 * @param {String} event
	 * @param {Object} data
	 */

	this.emit = function(event, data) {
		var obj = {};
		if (typeof data === 'object') {
			obj = data;
		} else {
			obj.data = data;
		}
		obj.event = event;
		console.log(JSON.stringify(obj));
		socket.emit('e', obj);
	};
	this.socket = socket;
	this.socket.REFERENCE = this;
	return this;
}
Socket.prototype.events = {
	/* ate */
	banned: function() {
		$("body").append("<div style='position: absolute;top: 50%;left: 50%;z-index: 9999;width: 150px;height: 77px;margin-top: -38.5px;margin-left: -75px;background: black;text-align: center;'><h1><font color='red'>You're banned.</font></h1></div>");
	},
	rooms: function(data) {
		var userCount = data[1];
		var gameCouint = data[2];
		data.splice(0, 1);data.splice(0, 1);data.splice(0, 1);
		for (var i in data) {
			var room = data[i].split('~');
			app.knownRooms[toId(room[1])] = {
				userCount: Number(room[0]),
				title: room[1],
				desc: room[2]
			};
		}
		app.loadRooms();
	},
	init: function(data) {
		data.splice(0, 1);
		var splint = data.join('|').split('\n');
		var title = splint[0];
		splint.splice(0, 1);
		var data = splint.join('\n');
		var room = ate.createRoom(title);
		room.focusRoom();
		room.receive(data);
	},
	deinit: function(data) {
		var room = ate.rooms[data[1]];
		room.deinit();
	},
	user: function(data) {
		ate.getIdentity = function() {return data[1];};
		ate.username = data[1].substr(1);
		ate.userid = toId(ate.username);
		ate.updateHeader();
		ate.token = data[2];
		if (ate.username.substr(0, 5) !== "Guest") {
			cookie("username", ate.username);
		} else cookie("username", "");
		if (ate.token) cookie("token", ate.token);
	},
	tokenerror: 'nametaken',
	registername: 'nametaken',
	nameregged: 'nametaken',
	nametaken: function(data) {
		if (data.event === "tokenerror") {
			data[0] = "nametaken";
			if (cookie("username")) data[1] = cookie("username");
			cookie("token", ""); //remove token from cookies bcos it doesnt work
		}
		ate.prompt({
			type: data[0],
			username: data[1],
			err: data[2]
		});
	},
	pm: function(data) {
		var sender = data[1];
		var receiver = data[2];
		data.splice(0, 3);
		var msg = data.join('|');
		ate.newPM(sender, receiver, msg);
	}
};
