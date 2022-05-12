# Madcoins backend
Backend on Node JS for watching at cryptocurrency trades.

## Installation
`git clone https://github.com/yodui/madcoins-backend.git`

### Command line parameters

Through command line attributes you can set application parameters for every instance. Currently we have four parameters for running:
- -mode - application mode
- -port - application server port (only for REST API mode)
- -ex - list of exchanges for watching
- -pairs - list of trading pairs for watching

Application have three working modes: 
* **restapi** - in this mode application run server at port 3000 (by default), and you can call REST API endpoints.
* **watcher** - in this mode app get list of exchanges and trading pairs for watching from command line and subscribe to trades of this pairs.
* **julius** - this is both modes in one, name - reference to *Julius Caesar*.

**Example:**
`node index.js -mode restapi -port 2800` - run only in REST API mode at port 2800
`node index.js -mode watcher -ex bitfinex -pairs ethbtc ethusdt` - run watcher mode and subscribe to all trades in Bitfinex ETH-BTC and ETH-USDT

### Development scripts
| Command | Description |
| --- | --- |
| `npm run dev` | Run app in |
| `npm run wathcer` | Run app in *watcher* mode |
| `npm run restapi` | Run app in *REST API* mode |

You can change testing command line parameters in **package.json**.
