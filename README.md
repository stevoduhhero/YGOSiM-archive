# [YGOSiM](http://ygosim.com)

[![Build Status](https://travis-ci.org/CreaturePhil/YGOSiM.svg)](https://travis-ci.org/CreaturePhil/YGOSiM)
[![Dependency Status](https://david-dm.org/stevoduhhero/YGOSiM.svg)](https://david-dm.org/stevoduhhero/YGOSiM)
[![devDependency Status](https://david-dm.org/stevoduhhero/YGOSiM/dev-status.svg)](https://david-dm.org/stevoduhhero/YGOSiM#info=devDependencies)

Manual Yu-Gi-Oh! simulator.

## Prerequisites

<table>
  <tr>
    <td>
      <b>Node.js</b>
    </td>
    <td>
      <b>MongoDB</b>
    </td>
  </tr>
  <tr>
    <td>
      <a href="http://nodejs.org">
        <img src="http://i.imgur.com/p3A0qpY.png" height="50" title="Node.js">
      </a>
    </td>
    <td>
      <a href="http://www.mongodb.org/downloads">
        <img src="http://i.imgur.com/yHTrdiP.jpg" height="50" title="MongoDB">
      </a>
    </td>
  </tr>
</table>

## Getting Started

First, start up MongoDB:

```bash
$ mongod
```

Then, open up another terminal window:

```bash
$ git clone https://github.com/stevoduhhero/YGOSiM.git && cd YGOSiM
$ npm install
$ node lib/server.js
```

## Building

To build YGOSiM, you need to install [Grunt](http://gruntjs.com) globally:

```bash
$ npm install -g grunt-cli
```

Run `grunt build` to concat and minify CSS and JavaScript files.

Run `grunt iteration` to watch CSS and JavaScript files and as you make changes,
it minifies the CSS and JavaScript files.

You can also run `grunt test` to use linters to check if you made any errors
in your code.

## Setting up an Administrator account

Once your server is up, you probably want to make yourself an Administrator (-) on it.

### db.json

To become an Administrator, create a file named `db.json` containing

```js
{
    "auths": {
        "USER": 4
    }
}
```

Replace `USER` with the username that you would like to become an Administrator.

<<<<<<< HEAD
## Updating card images
Download ygopro, they're in the YGOPRO/pics/ folder

## Updating cards database
Download ygopro
export YGOPRO/cards.cdb as a .sql using sqlite3 .output & .dump functions
import into mysql
edit exportygoprodb.php
	edit these lines to connect to your mysql:
		$servername = "localhost";
		$username = "root";
		$password = "";
run exportygoprodb.php on the webserver connected to the mysql database
replace db.js with exportygoprodb.php output


=======
>>>>>>> 30f3aef14c50989fa4adbfef9706ba8e013e6b08
## License

[MIT](LICENSE)
