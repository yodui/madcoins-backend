# Madcoins backend
Backend on Node JS for watching at cryptocurrency trades.

## Installation
```
git clone https://github.com/yodui/madcoins-backend.git
npm install
```

Application use PostgreSQL relational database. Structure of database you can find in [/src/db/database.sql](/src/db/database.sql), database connection parametrs sets in [/src/db/db.ts](/src/db/db.ts).

### Command line parameters

Through command line attributes you can set application parameters for every instance. You can set parameters in command line directly or link config file.
Application architecture means use few instance of application, one for API, others for cryptocurrencies rate watching.
Use of config files can be more easily when we need to divide a cryptocurrencies for watching by batches.

Command line parameters:
- `-config` - name of config file for app instance
- `-mode` - application mode
- `-port` - application server port (only for REST API mode)
- `-ex` - list of exchanges for watching (only for watcher mode)
- `-pairs` - list of trading pairs for watching (only for watcher mode)

Application have three working modes: 
* **restapi** - in this mode application run server at port 3000 (by default), and you can call REST API endpoints.
* **watcher** - in this mode app get list of exchanges and trading pairs for watching from command line and subscribe to trades of this pairs.
* **julius** - this is both modes in one, name - reference to *Julius Caesar*.

**Example:**
`node index.js -mode restapi -port 2800` - run only in REST API mode at port 2800
`node index.js -mode watcher -ex bitfinex -pairs ethbtc ethusdt` - run watcher mode and subscribe to all trades in Bitfinex ETH-BTC and ETH-USDT

####

### Development scripts
| Command | Description |
| --- | --- |
| `npm run dev` | Run app in |
| `npm run wathcer` | Run app in *watcher* mode |
| `npm run restapi` | Run app in *REST API* mode |

You can change testing command line parameters in **package.json**.
