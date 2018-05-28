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
