var ydk_dir = "C:\\Users\\steve\\nodes\\YGOSiM\\lib\\starter decks\\ydk";
/* this file will iterate through the folder path you gave looking for ygopro deck files (.ydk) and output a .dek version */
/* used to rip starter decks from ygopro */

var fs = require('fs');
fs.readdir(ydk_dir, (err, files) => {
  files.forEach((file, index) => {
	if (!file.endsWith('.ydk')) return;
	let deck = '';
	const newPath = file.substr(0, file.length - 3) + "dek";
    fs.readFile(ydk_dir +  "\\" + file, (err, buff) => {
		const ydk_deck = (buff + '').replace(/\r/g, '').split('#main\n')[1].replace(/\n#extra\n/g, '@').replace(/\n!side\n/g, '@').split('\n');
		if (ydk_deck[ydk_deck.length - 1] === "") ydk_deck.pop();
		deck = exportDeck(importDeck(ydk_deck.join('|')));
		console.log('\n-----' + newPath + '-----\n' + deck);
		fs.writeFile(newPath, deck);
	});
  });
});

  
function importDeck(deckString) {
	var deck = {
		main: new Object(),
		extra: new Object(),
		side: new Object()
	};
	var decks = deckString.split('@');
	var deckKeys = ["main", "extra", "side"];
	for (var deckKey in decks) {
		var cards = decks[deckKey].split('|');
		for (var x in cards) {
			var copies = cards[x].split('+').length,
				cardId = cards[x].replace(/|/g, "").replace(/\+/g, "");
			var cardExists = deck[deckKeys[deckKey]][cardId];
			if (cardExists !== undefined) {
				deck[deckKeys[deckKey]][cardId]++;
				continue;
			}
			for (var addCount = 0; addCount < copies; addCount++) if (cardId > 0) deck[deckKeys[deckKey]][cardId] = copies;
		}
	}
	return deck;
}
function exportDeck(deck) {
	var decks = ["main", "extra", "side"],
		deckString = "";
	for (var deckTypeKey in decks) {
		var deckType = decks[deckTypeKey],
			deckTypeCount = 0;
		for (var card in deck[deckType]) {
			var count = deck[deckType][card],
				pluses = "";
			for (var i = 0; i < count - 1; i++) pluses += "+";
			deckString += card + pluses + "|";
			deckTypeCount++;
		}
		if (deckTypeCount != 0) deckString = deckString.slice(0, -1);
		deckString += "@";
	}
	deckString = deckString.slice(0, -1);
	return deckString;
}