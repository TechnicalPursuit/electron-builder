"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.diff = exports.WineManager = void 0;
const builder_util_1 = require("builder-util");
const fs_1 = require("builder-util/out/fs");
const fs_extra_1 = require("fs-extra");
const fs_2 = require("fs");
const os_1 = require("os");
const path = __importStar(require("path"));
const path_sort_1 = __importDefault(require("path-sort"));
class WineManager {
    constructor() {
        this.wineDir = null;
        this.winePreparePromise = null;
        this.userDir = null;
    }
    async prepare() {
        if (this.env != null) {
            return;
        }
        this.wineDir = path.join(os_1.homedir(), "wine-test");
        const env = process.env;
        const user = env.SUDO_USER || env.LOGNAME || env.USER || env.LNAME || env.USERNAME || (env.HOME === "/root" ? "root" : null);
        if (user == null) {
            throw new Error(`Cannot determinate user name: ${builder_util_1.safeStringifyJson(env)}`);
        }
        this.userDir = path.join(this.wineDir, "drive_c", "users", user);
        this.winePreparePromise = this.prepareWine(this.wineDir);
        this.env = await this.winePreparePromise;
    }
    exec(...args) {
        return builder_util_1.exec("wine", args, { env: this.env });
    }
    async prepareWine(wineDir) {
        await fs_extra_1.emptyDir(wineDir);
        //noinspection SpellCheckingInspection
        const env = {
            ...process.env,
            WINEDLLOVERRIDES: "winemenubuilder.exe=d",
            WINEPREFIX: wineDir,
        };
        await builder_util_1.exec("wineboot", ["--init"], { env });
        // regedit often doesn't modify correctly
        let systemReg = await fs_2.promises.readFile(path.join(wineDir, "system.reg"), "utf8");
        systemReg = systemReg.replace('"CSDVersion"="Service Pack 3"', '"CSDVersion"=" "');
        systemReg = systemReg.replace('"CurrentBuildNumber"="2600"', '"CurrentBuildNumber"="10240"');
        systemReg = systemReg.replace('"CurrentVersion"="5.1"', '"CurrentVersion"="10.0"');
        systemReg = systemReg.replace('"ProductName"="Microsoft Windows XP"', '"ProductName"="Microsoft Windows 10"');
        // noinspection SpellCheckingInspection
        systemReg = systemReg.replace('"CSDVersion"=dword:00000300', '"CSDVersion"=dword:00000000');
        await fs_2.promises.writeFile(path.join(wineDir, "system.reg"), systemReg);
        // remove links to host OS
        const userDir = this.userDir;
        const desktopDir = path.join(userDir, "Desktop");
        await Promise.all([
            fs_1.unlinkIfExists(desktopDir),
            fs_1.unlinkIfExists(path.join(userDir, "My Documents")),
            fs_1.unlinkIfExists(path.join(userDir, "My Music")),
            fs_1.unlinkIfExists(path.join(userDir, "My Pictures")),
            fs_1.unlinkIfExists(path.join(userDir, "My Videos")),
        ]);
        await fs_extra_1.ensureDir(desktopDir);
        return env;
    }
}
exports.WineManager = WineManager;
var ChangeType;
(function (ChangeType) {
    ChangeType[ChangeType["ADDED"] = 0] = "ADDED";
    ChangeType[ChangeType["REMOVED"] = 1] = "REMOVED";
    ChangeType[ChangeType["NO_CHANGE"] = 2] = "NO_CHANGE";
})(ChangeType || (ChangeType = {}));
function diff(oldList, newList, rootDir) {
    const delta = {
        added: [],
        deleted: [],
    };
    const deltaMap = new Map();
    // const objHolder = new Set(oldList)
    for (const item of oldList) {
        deltaMap.set(item, ChangeType.REMOVED);
    }
    for (const item of newList) {
        // objHolder.add(item)
        const d = deltaMap.get(item);
        if (d === ChangeType.REMOVED) {
            deltaMap.set(item, ChangeType.NO_CHANGE);
        }
        else {
            deltaMap.set(item, ChangeType.ADDED);
        }
    }
    for (const [item, changeType] of deltaMap.entries()) {
        if (changeType === ChangeType.REMOVED) {
            delta.deleted.push(item.substring(rootDir.length + 1));
        }
        else if (changeType === ChangeType.ADDED) {
            delta.added.push(item.substring(rootDir.length + 1));
        }
    }
    delta.added = path_sort_1.default(delta.added);
    delta.deleted = path_sort_1.default(delta.deleted);
    return delta;
}
exports.diff = diff;
//# sourceMappingURL=wine.js.map