<<<<<<< HEAD
var low = require('lowdb');
var db = low('db.json');

//{"darkpoo": 4, "phil": 4}
if (!db.object.auths) {
    db.object.auths = {};
    db.save();
}

module.exports = {
	auths: db.object.auths,
	bannedIps: {},
	ranks: {
		0: ' ', //user
		1: '+', //voice -> tournaments and broadcast
		2: '*', //mod   -> ban,mute
		3: '#', //admin -> promote
		4: '-' //owner  -> console
	},
};
=======
var low = require('lowdb');
var db = low('db.json');

//{"darkpoo": 4, "phil": 4}
if (!db.object.auths) {
    db.object.auths = {};
    db.save();
}

module.exports = {
	auths: db.object.auths,
	bannedIps: {},
	ranks: {
		0: ' ', //user
		1: '+', //voice -> tournaments and broadcast
		2: '*', //mod   -> ban,mute
		3: '#', //admin -> promote
		4: '-' //owner  -> console
	},
};
>>>>>>> 30f3aef14c50989fa4adbfef9706ba8e013e6b08
