var AppMode;
(function (AppMode) {
    AppMode["watcher"] = "watcher";
    AppMode["restapi"] = "restapi";
    AppMode["julius"] = "julius";
})(AppMode || (AppMode = {}));
const commandLineParams = {
    mode: AppMode.julius,
    port: 3000,
    ex: [],
    pairs: []
};
let section = false;
const argv = process.argv;
argv.forEach(param => {
    console.log(param);
    console.log(Object.keys(commandLineParams));
});
export default commandLineParams;
//# sourceMappingURL=commandLineArguments.js.map