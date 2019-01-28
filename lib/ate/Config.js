var low = require('lowdb');
var FileSync = require('lowdb/adapters/FileSync');
var adapter = new FileSync('db.json');
var db = low(adapter);

//{"darkpoo": 4, "phil": 4}
db.defaults({ gameCount: 0, auths: {} }).write();
var auths = db.get('auths');

module.exports = {
	auths: auths.value(),
	bannedIps: {},
	ranks: {
		0: ' ', //user
		1: '+', //voice -> tournaments and broadcast
		2: '*', //mod   -> ban,mute
		3: '#', //admin -> promote
		4: '-' //owner  -> console
	},
};
