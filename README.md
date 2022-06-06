# Madcoins backend
Backend on Node JS for watching at cryptocurrency trades.

## Installation
```
git clone https://github.com/yodui/madcoins-backend.git
npm install
```
Application use PostgreSQL relational database. Structure of database you can find in [/src/db/database.sql](/src/db/database.sql), database connection parametrs sets in [/src/db/db.ts](/src/db/db.ts).

### Email notifications
Some endpoints sand email notifications to users (ex. user registration). In debug mode you can set your test SMTP settings or disabled sending. All mail settings you can set in [.env](/.env). For disabled sending notifications you can set [.env](./.env) variable `SMTP_SENDING=0` 

### Command line parameters

Through command line attributes and **.env** variables you can set application parameters for every instance. You can set parameters in command line directly (primary priority) or set it in environment file.
Application architecture means use few instance of application, one for API, others for cryptocurrencies exchange rates watching.

Command line parameters:
- `-mode` - application mode
- `-port` - application server port (only for REST API mode)

Application have three working modes:
* **api** - in this mode application run server at port 3000 (by default), and you can call REST API endpoints.
* **watcher** - in this mode app get list of exchanges and trading pairs for watching from command line and subscribe to trades of this pairs.
* **julius** - this is both modes in one, name - reference to *Julius Caesar*.

**Example:**

`node index.js -mode restapi -port 2800` - run only in REST API mode at port 2800

`node index.js -mode watcher` - run watcher mode

### Exchanges and pairs for watching

If you run application in *watcher* mode - you will subscribe to change coin prices, this changes will be saved in database.     
You can set exchanges for watching and pairs in [/config/default.json](/config/default.json) file for example. 

#### Use app instances

For watching rates you can use few of instances of application, for example: first instance for *Poloniex*, second for *Kraken* exchanges.
For every instance you can set batch of exchanges and pairs via different config files. For run each of instance with different config files - use `NODE_APP_INSTANCE` variable in command line.

**Example:**

`NODE_APP_INSTANCE=1 node dist/index.js -mode watcher` - run with `/config/default-1.json` file

`node dist/index.js -mode watcher` - run with `/config/default.json`


### Development scripts
| Command | Description |
| --- | --- |
| `npm run dev` | Run app in |
| `npm run wathcer` | Run app in *watcher* mode |
| `npm run restapi` | Run app in *API* mode |

You can change testing command line parameters in **package.json**.
