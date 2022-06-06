import config from 'config';

// Available command line arguments (TS style):
// -mode: watcher|api|julius - global app mode
// -port: number - number of port for REST API
// -ex: Array<string> - list of exchange tickers for watching (space separator)
enum AppMode {
    watcher = 'watcher',
    api = 'api',
    julius = 'julius' // reference to Julius Caesar, he can do all things immediately
}

interface IAppInstanceParams {
    mode: AppMode,
    port: number,
    watch: Array<string>,
}

console.log(config.util.getEnv());

let exchanges;
if(config.has('exchanges')) {
    exchanges = config.get('exchanges');
}

const env:IAppInstanceParams = {
    mode: Object.keys(AppMode).includes(process.env.mode) ? AppMode[process.env.mode] : AppMode.julius,
    port: parseInt(process.env.PORT) || 3000, // default
    watch: exchanges ? exchanges : [] // exchanges and pairs for watching
};

// get command line parameters
const argv = process.argv.slice(2);

// prepare regexp expressions for parsing command line params
const strCommands:string = Object.keys(env).join('|');
const isParam = new RegExp('^\-('+strCommands+')$');

let currentParam:string|boolean = false;

argv.forEach(val => {
    if(isParam.test(val)) {
        // this is parameter
        currentParam = val.slice(1);
    } else if(currentParam !== false) {
        // add value to mounted parameter
        switch(currentParam) {
            case 'mode':
                // check value in enum
                if(Object.keys(AppMode).includes(val)) {
                    env.mode = AppMode[val];
                }
                break;
            case 'port':
                // save port value
                env.port = parseInt(val);
                break;
        }
    }
})

export { env, AppMode };
