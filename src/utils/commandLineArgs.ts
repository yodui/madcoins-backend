// Available command line arguments (TS style):
// -mode: watcher|restapi - global app mode
// -port: number - number of port for RESTAPI
// -ex: Array<string> - list of exchange tickers for watching (space separator)
// -pairs: Array<string> - list of pairs for watching (space separator)
enum AppMode {
    watcher = 'watcher',
    restapi = 'restapi',
    julius = 'julius' // reference to Julius Caesar, he can do all things immediately
}

interface IAppInstanceParams {
    mode: AppMode,
    port: number,
    ex: Array<string>,
    pairs: Array<string>
}

const clParams:IAppInstanceParams = {
    mode: AppMode.julius,
    port: 3000, // default
    ex: [], // exchanges for watching
    pairs: [] // pairs for watching
};

// get command line parameters
const argv = process.argv.slice(2);

// prepare regexp expressions for parsing command line params
const strCommands:string = Object.keys(clParams).join('|');
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
                    clParams.mode = AppMode[val];
                }
                break;
            case 'port':
                // save port value
                clParams.port = parseInt(val);
                break;
            case 'ex':
                // add exchange to watch list
                clParams.ex.push(val.toString());
                break;
            case 'pairs':
                clParams.pairs.push(val.toString());
                break;
        }
    }
})

export { clParams, AppMode };

