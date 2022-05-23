import { config } from 'dotenv';
var AppMode;
(function (AppMode) {
    AppMode["watcher"] = "watcher";
    AppMode["api"] = "api";
    AppMode["julius"] = "julius";
})(AppMode || (AppMode = {}));
config();
const env = {
    mode: Object.keys(AppMode).includes(process.env.mode) ? AppMode[process.env.mode] : AppMode.julius,
    port: parseInt(process.env.PORT) || 3000,
    ex: process.env.exchanges ? process.env.exchanges.split(',') : [],
    pairs: process.env.pairs ? process.env.pairs.split(',') : []
};
const argv = process.argv.slice(2);
const strCommands = Object.keys(env).join('|');
const isParam = new RegExp('^\-(' + strCommands + ')$');
let currentParam = false;
argv.forEach(val => {
    if (isParam.test(val)) {
        currentParam = val.slice(1);
        if (['ex', 'pairs'].includes(currentParam))
            env[currentParam] = [];
    }
    else if (currentParam !== false) {
        switch (currentParam) {
            case 'mode':
                if (Object.keys(AppMode).includes(val)) {
                    env.mode = AppMode[val];
                }
                break;
            case 'port':
                env.port = parseInt(val);
                break;
            case 'ex':
                env.ex.push(val.toString());
                break;
            case 'pairs':
                env.pairs.push(val.toString());
                break;
        }
    }
});
export { env, AppMode };
//# sourceMappingURL=appEnvironment.js.map