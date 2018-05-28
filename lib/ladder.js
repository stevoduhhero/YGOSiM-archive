var LadderModel = models.LadderModel;
function GlickoPlayer(rating, rd) {
	if (!rating) rating = 1500;
	if (!rd) rd = 130.0;
	this.pi2 = 9.8696044;
	this.RDmax = 130.0;
	this.RDmin = 25.0;
	this.c = null;
	this.q = 0.00575646273 ;
	this.M = [];
	this.rating = rating;
	this.rd = rd;
	this.c = Math.sqrt((this.RDmax * this.RDmax - this.RDmin * this.RDmin) / 365.0);
}
GlickoPlayer.prototype.addWin = function(OtherPlayer) {
	this.M.push(OtherPlayer.MatchElement(1));
};
GlickoPlayer.prototype.addLoss = function(OtherPlayer) {
	this.M.push(OtherPlayer.MatchElement(0));
};
GlickoPlayer.prototype.addDraw = function(OtherPlayer) {
	this.M.push(OtherPlayer.MatchElement(0.5));
};
GlickoPlayer.prototype.update = function() {
	var results = this.AddMatches(this.M);
	this.rating = results['R'];
	this.rd = results['RD'];
	this.M = [];
};
GlickoPlayer.prototype.MatchElement = function(score) {
	return {'R': this.rating, 'RD': this.rd, 'score': score};
};
GlickoPlayer.prototype.AddMatches = function(M) {
	// This is where the Glicko rating calculation actually happens

	// Follow along the steps using: http://www.glicko.net/glicko/glicko.pdf
	var RD;
	if (M.length == 0) {
		RD = Math.sqrt((this.rd * this.rd) + (this.c * this.c));
		return {'R': this.rating, 'RD': RD};
	}

	var A = 0.0;
	var d2 = 0.0;
	var j, E, g;
	for (j = 0; j < M.length; j++) {
		E = this.E(this.rating, M[j]['R'], M[j]['RD']);
		g = this.g(M[j]['RD']);

		d2 +=  (g * g * E * (1 - E));

		A += g * (M[j]['score'] - E);
	}

	d2 = 1.0 / this.q / this.q / d2;

	RD = 1.0 / Math.sqrt(1.0 / (this.rd * this.rd) + 1.0 / d2);
	var R = this.rating + this.q * (RD * RD) * A;


	if (RD > this.RDmax) {
		RD = this.RDmax;
	}

	if (RD < this.RDmin) {
		RD = this.RDmin;
	}

	return {'R': R, 'RD': RD};
};
GlickoPlayer.prototype.g = function(RD) {
	return 1.0 / Math.sqrt(1.0 + 3.0 * this.q * this.q * RD * RD / this.pi2) ;
};
GlickoPlayer.prototype.E = function(R, R_j, RD_j) {
	return 1.0 / (1.0 + Math.pow(10.0, -this.g(RD_j) * (R - R_j) / 400.0));
};

function NTBBLadder(serverid, formatid) {
	this.serverid = serverid;
	this.formatid = formatid;
	this.formatid = toId(formatid);
	this.serverid = toId(serverid);
	this.rplen = 24*60*60;
	this.rpoffset = 9*60*60;
}
NTBBLadder.prototype.getrp = function() {
	var rpnum = parseInt(((new Date() / 1) - this.rpoffset) / this.rplen) + 1;
	return rpnum * this.rplen + this.rpoffset;
};
NTBBLadder.prototype.nextrp = function(rp) {
	var rpnum = parseInt(rp / this.rplen);
	return (rpnum+1) * this.rplen + this.rpoffset;
};
NTBBLadder.prototype.getRating = function(user, create, cb) {
	if (!cb) cb = function() {};
	if (!create) create = false;
	if (!user['rating']) {
		var self = this;
		LadderModel.findOne({
			serverid: this.serverid,
			formatid: this.formatid,
			userid: user.userid
		}, function(err, res) {
			if (err) return cb(false);
			var data = res;
			var rp = self.getrp();
			var defaults = {
				'formatid': self.formatid,
				'userid': user['userid'],
				'username': user['username'],
				'r': 1500,
				'rd': 130,
				'sigma': 0,
				'rpr': 1500,
				'rprd': 130,
				'rpsigma': 0,
				'rptime': rp,
				'rpdata': '',
				'w': 0,
				'l': 0,
				't': 0,
				'gxe': 50,
				'acre': 1000,
				'lacre': 1000
			};
			if (data) {
				var obj = {};
				var keys = Object.keys(defaults);
				for (var i = 0; i < keys.length; i++) {
					var key = keys[i];
					if (data[key]) {
						obj[key] = data[key];
						continue;
					}
					obj[key] = defaults[key];
				}
				obj.entryid = data.entryid;
				user['rating'] = obj;
				return cb(true);
			} else {
				if (!create) return cb(false);
				//echo "INSERT INTO `{$ladderdb.prefix}ladder` (`formatid`,`userid`,`username`) VALUES ('{this.formatid}','".$ladderdb.escape($user['userid'])."','".$ladderdb.escape($user['username'])."')";
				var entry = new LadderModel({
					formatid: self.formatid,
					serverid: self.serverid,
					userid: user.userid,
					username: user.username,
					rptime: rp
				});
				entry.save(function(err, doc) {
					if (err) throw err;
					defaults.entryid = doc.entryid;
					user['rating'] = defaults;
					return cb(true);
				});
			}
		});
	} else return cb(true);
};
NTBBLadder.prototype.getAllRatings = function(user, cb) {
	if (!cb) cb = function() {};
	if (!user['ratings']) {
		LadderModel.find({
			serverid: this.serverid,
			userid: user.userid
		}, function(err, res) {
			if (err || !res) {
				return cb(false);
			}
			user['ratings'] = [];
			var count = res.length;
			for (var i = 0; i < count; i++) {
				var row = res[i];
				delete row.rpdata;
				user.ratings.push(row);
			}
			return cb(true);
		});
	} else return cb(true);
};
NTBBLadder.prototype.getTop = function(cb) {
	if (!cb) cb = function() {};
	var self = this;
	var needUpdate = true;
	var top = [];
	var i = 0;
	var limit = 500;
	var initiateLoop = function() {
		function loop() {
			if (!needUpdate) {
				return cb(top);
			}
			i++;
			if (i > 2) return cb(top);
			
			needUpdate = false;
			top = [];
			calculateTop();
		}
		function calculateTop() {
			// if (isset($GLOBALS['curuser']) && $GLOBALS['curuser']['group'] != 0) {
			// 	$limit = 1000;
			// }
			LadderModel.find({
				formatid: self.formatid,
				serverid: self.serverid
			}).sort({'lacre': -1}).limit(limit).exec(function(err, res) {
				var count = res.length;
				for (var j = 0; j < count; j++) {
					var row = res[j];
					// if ($row['lacre'] < 0 && $j > 50) break;
					var user = {
						'username': row['username'],
						'userid': row['userid'],
						'rating': row
					};

					if (self.update(user)) {
						self.saveRating(user);
						needUpdate = true;
					}

					delete row['rpdata'];
					top.push(row);
				}
				loop();
			});
		}
		loop();
	};
	initiateLoop();
};
NTBBLadder.prototype.clearAllRatings = function() {
	LadderModel.remove({
		formatid: this.formatid,
		serverid: this.serverid
	}, function() {
	
	});
};
NTBBLadder.prototype.saveRating = function(user, cb) {
	if (!cb) cb = function() {};
	if (!user['rating']) return cb(false);
	var id = user.rating.entryid;
	LadderModel.findByIdAndUpdate(id, {
		w: user.rating.w,
		l: user.rating.l,
		t: user.rating.t,
		r: user.rating.r,
		rd: user.rating.rd,
		sigma: user.rating.sigma,
		rptime: user.rating.rptime,
		rpr: user.rating.rpr,
		rprd: user.rating.rprd,
		rpsigma: user.rating.rpsigma,
		rpdata: user.rating.rpdata,
		gxe: user.rating.gxe,
		acre: user.rating.acre,
		lacre: user.rating.lacre
	}, function() {
		cb(true);
	});
};
NTBBLadder.prototype.update = function(user, newM, newMelo, force) {
	if (!newM) newM = false;
	if (!newMelo) newMelo = 1000;
	if (!force) force = false;
	var offset = 0;

	var rp = this.getrp();
	if (rp <= user['rating']['rptime'] && !newM && !force) {
		return false;
	}

	var elo = user['rating']['acre'];

	var rating = new GlickoPlayer(user['rating']['r'], user['rating']['rd']);
	if (user['rating']['rpdata']) {
		var rpdata = ('##',user['rating']['rpdata']).split('##');
		if ((rpdata).length > 1) offset = parseFloat(rpdata[1]);
		rating.M = JSON.parse(rpdata[0], true);
		//var_export($rating.M);
	}

	if (rp > user['rating']['rptime']) {
		var i=0;
		while (rp > user['rating']['rptime']) {
			i++;
			if (i > 1000) break;

			// decay
			if (elo >= 1400) {
				if ((rating.M).length) {
					// user was active
					elo -= 0 + parseInt((elo-1400)/100);
				} else {
					// user was inactive
					elo -= 1 + parseInt((elo-1400)/50);
				}
			}

			rating.update();
			if (offset) {
				rating.rating += offset;
				offset = 0;
			}

			user['rating']['rptime'] = this.nextrp(user['rating']['rptime']);
		}
		user['rating']['r'] = rating.rating;
		user['rating']['rd'] = rating.rd;
		user['rating']['lacre'] = user['rating']['acre'] = elo;
	}

	if (newM) {
		rating.M.push(newM);
		if (newM['score'] > 0.99) {
			user['rating']['w']++;
		} else if (newM['score'] < 0.01) {
			user['rating']['l']++;
		} else {
			user['rating']['t']++;
		}
	}

	if ((rating.M).length) {
		user['rating']['rpdata'] = JSON.stringify(rating.M);
	} else {
		user['rating']['rpdata'] = '';
	}

	rating.update();

	var oldrpr = user['rating']['rpr'];

	user['rating']['rpr'] = rating.rating;
	user['rating']['rprd'] = rating.rd;

	// $user['rating']['gxe'] = round(100 / (1 + Math.pow(10,((1500 - $rating.rating) * pi() / Math.sqrt(3 * log(10)*log(10) * $rating.rd*$rating.rd + 2500 * (64 * pi()*pi() + 147 * log(10)*log(10)))))), 1);
	user['rating']['gxe'] = Math.round(100 / (1 + Math.pow(10,((1500 - rating.rating) / 400 / Math.sqrt(1 + 0.0000100724 * (rating.rd*rating.rd + 130*130))))), 1);

	if (newM) {
		// compensate for Glicko2 bug: don't lose rating on win, don't gain rating on lose
		// if ($newM['score'] > .9 && $rating.rating < $oldrpr) {
		// 	$delta = $oldrpr - $rating.rating;
		// 	$offset += $delta;
		// 	$user['rating']['rpr'] += $delta;
		// }
		// if ($newM['score'] < .1 && $rating.rating > $oldrpr) {
		// 	$delta = $oldrpr - $rating.rating;
		// 	$offset += $delta;
		// 	$user['rating']['rpr'] += $delta;
		// }
	}
	if (offset) {
		user['rating']['rpdata'] += '##' + offset;
	}

	if (newM) {
		user['rating']['oldacre'] = elo;

		var K = 50;
		if (elo < 1100) {
			if (newM['score'] < 0.5) {
				K = 20 + (elo - 1000)*30/100;
			} else if (newM['score'] > 0.5) {
				K = 80 - (elo - 1000)*30/100;
			}
		} else if (elo > 1300) {
			K = 40;
		} else if (elo > 1600) {
			K = 32;
		}

		var E = 1 / (1 + Math.pow(10, (newMelo - elo) / 400));
		elo += K * (newM['score'] - E);

		if (elo < 1000) elo = 1000;

		user['rating']['lacre'] = user['rating']['acre'] = elo;
	}
	return true;
};
NTBBLadder.prototype.updateRating = function(p1, p2, p1score, cb) {
	if (!cb) cb = function() {};
	var self = this;
	var p1M = false;
	var p2M = false;
	function exec() {
		if (!p1M) {
			var p2rating = new GlickoPlayer(p2['rating']['r'], p2['rating']['rd']);
			p1M = p2rating.MatchElement(p1score);
		}
		if (!p2M) {
			var p1rating = new GlickoPlayer(p1['rating']['r'], p1['rating']['rd']);
			p2M = p1rating.MatchElement(1 - p1score);
		}
		p1M['score'] = p1score;
		p2M['score'] = 1 - p1score;
		var p1Macre = p2['rating']['acre'];
		var p2Macre = p1['rating']['acre'];

		self.update(p1, p1M, p1Macre);
		self.update(p2, p2M, p2Macre);

		self.saveRating(p1, function() {
			self.saveRating(p2, function() {
				cb();
			});
		});
	}
	if (!p1['rating']) {
		self.getRating(p1, true, function() {
			if (!p2['rating']) {
				self.getRating(p2, true, function() {
					exec();
				});
			} else exec();
		});
	} else if (!p2['rating']) {
		self.getRating(p2, true, function() {
			exec();
		});
	} else {
		exec();
	}
};
module.exports = NTBBLadder;
