# Madcoins backend
Backend on Node JS for watching at cryptocurrency trades.

## Installation
```
git clone https://github.com/yodui/madcoins-backend.git
npm install
```
Application use PostgreSQL relational database. Database dump (structure, functions, triggers and initial rows) you can find in [/src/db/database.sql](/src/db/database.sql), database connection parametrs sets in [/src/db/db.ts](/src/db/db.ts).

### Run application
For start full environment of backend applications you need to run two backend points - *backend* and *web socket servers*.  
Backend server will be response at backend endpoints, for ex. response at `/api/trades` by *http* protocol.  
Web socket server will be response by websocket protocol, instantly send and receive data. Websocket need for high reaction client interface.

[Development scripts](#development-scripts)

### Email notifications
Some endpoints sand email notifications to users (ex. user registration). In debug mode you can set your test SMTP settings or disabled sending. All mail settings you can set in [.env](/.env). For disabled sending notifications you can set [.env](./.env) variable `SMTP_SENDING=0` 

### Command line parameters

Through command line attributes and **.env** variables you can set parameters for every instance of application. You can set params in command line directly (primary priority) or set it in environment file.
Application architecture means use few instance of application, one for API, others for cryptocurrencies exchange rates watching.

Command line parameters:
- `-mode` - application mode
- `-port` - application server port (only for REST API mode)

Application have four working modes:
* **api** - in this mode application run server at port 3000 (by default), and you can call REST API endpoints.
* **watcher** - in this mode app get list of exchanges and trading pairs for watching from command line and subscribe to trades of this pairs.
* **caster** - sometimes we need regular calculations, based on time periods (ex. candles data), this mode provides this features
* **julius** - this is all modes in one, name - reference to *Julius Caesar*.

For all features of application you need to run all three first modes (**api**, **watcher** and **caster**). 
I recommended to use different instances (terminals) for each mode.

### Development scripts
| Command | Description |
| --- | --- |
| `npm run dev` | Run app in *Julius* (both modes, *API* and *watcher*) |
| `npm run wathcer` | Run app in *watcher* mode |
| `npm run api` | Run app in *API* mode |
| `npm run ws` | Run WebSocket server |
| `npm run caster` | Run app in *caster* mode |


**Example without scripts:**

`node index.js -mode api -port 2800` - run only in REST API mode at port 2800

`node index.js -mode watcher` - run watcher mode

`node index.js -mode julius` - run in both modes


### Exchanges and pairs for watching

If you run application in *watcher* or *julius* mode - you will subscribe to change coin rates, this changes will be saved in database.     
You can set markets for watching in [/config/default.json](/config/default.json) file for example.

**Notice**

On current time application is in develop and active state. Temporary don't used **/config/default.json** files.
All markets hardcoded in [/src/index.tsc](/src/index.tsc) file.

#### Use app instances

For watching rates you can use few of instances of application, for example: first instance for *Poloniex*, second for *Kraken* exchanges.
For every instance you can set batch of exchanges and pairs (its mean batch of markets) via different config files. For run each of instance with different config files - use `NODE_APP_INSTANCE` variable in command line.
App running with */config/default.json* file by default.

**Example:**

`NODE_APP_INSTANCE=1 node dist/index.js -mode watcher` - run with `/config/default-1.json` file

`node dist/index.js -mode watcher` - run with `/config/default.json`

