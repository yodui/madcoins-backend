# Madcoins backend
Backend on Node JS for watching at cryptocurrency trades.

## Installation
`git `

### Command line parameters

Application have two working modes: 
* **restapi** - in this mode application run server at port 3000 (by default), and you can call REST API endpoints.
* **watcher** - in this mode app get list of exchanges and trading pairs for watching from command line and subscribe to trades of this pairs.
* **julius** - this is both modes in one, name - reference to *Julius Caesar*.

**Example:**
`node index.js -mode restapi` - run in REST API node
`node index.js -mode watcher -ex bitfinex -pairs ethbtc ethusdt` - run watcher mode and subscribe to all trades in Bitfinex ETH-BTC and ETH-USDT


### Development scripts
| Command | Description |
| --- | --- |
| `npm run dev` | Run app in |
| `npm run wathcer` | Run app in *watcher* mode |
| `npm run restapi` | Run app in *REST API* mode |

You can change testing command line parameters in **package.json**.
