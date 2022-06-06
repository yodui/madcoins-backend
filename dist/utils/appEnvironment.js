import config from 'config';
var AppMode;
(function (AppMode) {
    AppMode["watcher"] = "watcher";
    AppMode["api"] = "api";
    AppMode["julius"] = "julius";
})(AppMode || (AppMode = {}));
const exchanges = config.get('exchanges');
const env = {
    mode: Object.keys(AppMode).includes(process.env.mode) ? AppMode[process.env.mode] : AppMode.julius,
    port: parseInt(process.env.PORT) || 3000,
    watch: exchanges ? exchanges : []
};
const argv = process.argv.slice(2);
const strCommands = Object.keys(env).join('|');
const isParam = new RegExp('^\-(' + strCommands + ')$');
let currentParam = false;
argv.forEach(val => {
    if (isParam.test(val)) {
        currentParam = val.slice(1);
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
        }
    }
});
export { env, AppMode };
//# sourceMappingURL=appEnvironment.js.map