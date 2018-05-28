var Formats = ["Random", "Advanced", "Traditional", "Unlimited"];
// http://stackoverflow.com/questions/3426404/create-a-hexadecimal-colour-based-on-a-string-with-javascript
function hashCode(str) { // java String#hashCode
	str = toId(str);
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
       hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
} 
function intToARGB(i){
    return ((i>>24)&0xFF).toString(16) + 
           ((i>>16)&0xFF).toString(16) + 
           ((i>>8)&0xFF).toString(16) + 
           (i&0xFF).toString(16);
}
function hashColor(str) {
	return "#" + intToARGB(hashCode(str));
}

function newurl(url) {
	window.history.pushState({}, "", url);
}
function cookie(c_name, value, exdays) {
	if (value !== undefined) {
		if (value === "") return eatcookie(c_name);
		if (!exdays) exdays = 7;
		var exdate = new Date();
		exdate.setDate(exdate.getDate() + exdays);
		var c_value = escape(value) + ((exdays == null) ? "" : "; expires=" + exdate.toUTCString());
		document.cookie = c_name + "=" + c_value;
		return;
	}
	var i, x, y, ARRcookies = document.cookie.split(";");
	for (i = 0; i < ARRcookies.length; i++) {
		x = ARRcookies[i].substr(0,ARRcookies[i].indexOf("="));
		y = ARRcookies[i].substr(ARRcookies[i].indexOf("=") + 1);
		x = x.replace(/^\s+|\s+$/g,"");
		if (x == c_name) {
			return unescape(y);
		}
	}
}
function eatcookie(name) {
	document.cookie = name + '=; expires=Thu, 01-Jan-70 00:00:01 GMT;';
}
function timestamp() {
	var d = new Date();
	var hours = d.getHours() + "",
		minutes = d.getMinutes() + "",
		seconds = d.getSeconds() + "";
	if (hours.length == 1) hours = "0" + hours;
	if (minutes.length == 1) minutes = "0" + minutes;
	if (seconds.length == 1) seconds = "0" + seconds;
	var timestamp = "(" + hours + ":" + minutes + ":" + seconds + ")";
	return timestamp;
}
function urlify(str) {
	return str.replace(/(https?\:\/\/[a-z0-9-.]+(\/([^\s]*[^\s?.,])?)?|[a-z0-9]([a-z0-9-\.]*[a-z0-9])?\.(com|org|net|edu|tk)((\/([^\s]*[^\s?.,])?)?|\b))/ig, '<a href="$1" target="_blank">$1</a>').replace(/<a href="([a-z]*[^a-z:])/g, '<a href="http://$1').replace(/(\bgoogle ?\[([^\]<]+)\])/ig, '<a href="http://www.google.com/search?ie=UTF-8&q=$2" target="_blank">$1</a>').replace(/(\bgl ?\[([^\]<]+)\])/ig, '<a href="http://www.google.com/search?ie=UTF-8&btnI&q=$2" target="_blank">$1</a>').replace(/(\bwiki ?\[([^\]<]+)\])/ig, '<a href="http://en.wikipedia.org/w/index.php?title=Special:Search&search=$2" target="_blank">$1</a>').replace(/\[\[([^< ]([^<`]*?[^< ])?)\]\]/ig, '<a href="http://www.google.com/search?ie=UTF-8&btnI&q=$1" target="_blank">$1</a>');
}
function string(str) {
	if (typeof str === 'string' || typeof str === 'number') return '' + str;
	return '';
}
function toId(text) {
	if (text && text.id) text = text.id;
	else if (text && text.userid) text = text.userid;
	return string(text).toLowerCase().replace(/[^a-z0-9]+/g, '');
}
function escapeHTML(txt) {
	return $('<div/>').text(txt).html();
}
function allToNum(obj) {
	if (typeof obj === "string") return Number(obj);
	for (var i in obj) {
		if (obj[i] === "") {
			obj.splice(i, 1); //delete blank entries
			continue;
		}
		obj[i] = Number(obj[i]);
	}
	return obj;
}
var helpers = {
    isAndroid: function() {
        return navigator.userAgent.match(/Android/i);
    },
    isBlackBerry: function() {
        return navigator.userAgent.match(/BlackBerry/i);
    },
    isIOS: function() {
        return navigator.userAgent.match(/iPhone|iPad|iPod/i);
    },
    isOpera: function() {
        return navigator.userAgent.match(/Opera Mini/i);
    },
    isWindows: function() {
        return navigator.userAgent.match(/IEMobile/i);
    },
    isMobile: function() {
        return (this.isAndroid() || this.isBlackBerry() || this.isIOS() || this.isOpera() || this.isWindows());
    }
};
