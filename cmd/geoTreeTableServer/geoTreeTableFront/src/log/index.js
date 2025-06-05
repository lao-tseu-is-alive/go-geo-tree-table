/* eslint-disable no-underscore-dangle */
/* eslint-disable  no-console */
/**
 * Log library for javascript
 * Created by CGil on 15/12/2017
 */
export var levelLog;
(function (levelLog) {
    levelLog[levelLog["none"] = 0] = "none";
    levelLog[levelLog["err"] = 1] = "err";
    levelLog[levelLog["warn"] = 2] = "warn";
    levelLog[levelLog["trace"] = 3] = "trace";
    levelLog[levelLog["info"] = 4] = "info";
})(levelLog || (levelLog = {}));
const getLogColor = function (level) {
    switch (level) {
        case levelLog.info:
            return "color: #1976d2";
        case levelLog.trace:
            return "color: #3D873FFF";
        case levelLog.warn:
            return "color: #ff9800";
        case levelLog.err:
            return "color: #f44336";
    }
    return "background: #dddddd; color: #000";
};
const _getCallerName = function (stackTrace) {
    if (!(typeof stackTrace === "undefined" || stackTrace === null)) {
        let callerName = stackTrace.replace(/^Error\s+/, ""); // Sanitize Chrome
        callerName = callerName.split("\n")[1]; // 1st item is this, 2nd item is caller
        callerName = callerName.replace(/^\s+at Object./, ""); // Sanitize Chrome
        callerName = callerName.replace(/ \(.+\)$/, ""); // Sanitize Chrome
        callerName = callerName.replace(/\@.+/, ""); // Sanitize Firefox
        callerName = callerName.replace("at ", "").trim();
        callerName = callerName.replace("VueComponent.", "").trim();
        return callerName;
    }
    else {
        return "";
    }
};
const _log = function (moduleName, callerName, msg, logtype, ...args) {
    let prefix;
    if (callerName.length > 1) {
        prefix = `${moduleName}::${callerName}()`;
    }
    else {
        prefix = `${moduleName}::`;
    }
    switch (logtype) {
        case levelLog.err:
            console.error(`%c ${prefix} ${msg}`, getLogColor(logtype));
            console.trace();
            break;
        case levelLog.warn:
            console.warn(`%c ${prefix} ${msg}`, getLogColor(logtype));
            break;
        default:
            console.log(`%c ${prefix} ${msg}`, getLogColor(logtype));
            break;
    }
    if (args.length > 0) {
        args.forEach((v) => console.log(v));
    }
};
export class Log {
    _moduleName = "";
    _logLevel = levelLog.info;
    constructor(moduleName = "", logLevel = levelLog.info) {
        this._moduleName = moduleName;
        this._logLevel = logLevel;
    }
    l(msg, ...args) {
        if (this._logLevel >= levelLog.info) {
            const callerName = _getCallerName(new Error().stack); // Only tested in latest FF and Chrome
            _log(this._moduleName, callerName, msg, levelLog.info, ...args);
        }
    }
    t(msg, ...args) {
        if (this._logLevel >= levelLog.trace) {
            const callerName = _getCallerName(new Error().stack); // Only tested in latest FF and Chrome
            _log(this._moduleName, callerName, msg, levelLog.trace, ...args);
        }
    }
    w(msg, ...args) {
        if (this._logLevel >= levelLog.warn) {
            const callerName = _getCallerName(new Error().stack); // Only tested in latest FF and Chrome
            _log(this._moduleName, callerName, msg, levelLog.warn, ...args);
        }
    }
    e(msg, ...args) {
        if (this._logLevel >= levelLog.err) {
            const callerName = _getCallerName(new Error().stack); // Only tested in latest FF and Chrome
            _log(this._moduleName, callerName, msg, levelLog.err, ...args);
        }
    }
}
