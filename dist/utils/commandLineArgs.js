var AppMode;
(function (AppMode) {
    AppMode["watcher"] = "watcher";
    AppMode["restapi"] = "restapi";
    AppMode["julius"] = "julius";
})(AppMode || (AppMode = {}));
const clParams = {
    mode: AppMode.julius,
    port: 3000,
    ex: [],
    pairs: []
};
const argv = process.argv.slice(2);
const strCommands = Object.keys(clParams).join('|');
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
                    clParams.mode = AppMode[val];
                }
                break;
            case 'port':
                clParams.port = parseInt(val);
                break;
            case 'ex':
                clParams.ex.push(val.toString());
                break;
            case 'pairs':
                clParams.pairs.push(val.toString());
                break;
        }
    }
});
export { clParams, AppMode };
//# sourceMappingURL=commandLineArgs.js.map