"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckingMacPackager = exports.CheckingWinPackager = void 0;
const macPackager_1 = __importDefault(require("app-builder-lib/out/macPackager"));
const winPackager_1 = require("app-builder-lib/out/winPackager");
class CheckingWinPackager extends winPackager_1.WinPackager {
    constructor(info) {
        super(info);
    }
    //noinspection JSUnusedLocalSymbols
    async pack(outDir, arch, targets, taskManager) {
        // skip pack
        const helperClass = require("electron-builder-squirrel-windows").default;
        this.effectiveDistOptions = await (new helperClass(this, outDir).computeEffectiveDistOptions());
        await this.sign(this.computeAppOutDir(outDir, arch));
    }
    //noinspection JSUnusedLocalSymbols
    packageInDistributableFormat(appOutDir, arch, targets, taskManager) {
        // skip
    }
}
exports.CheckingWinPackager = CheckingWinPackager;
class CheckingMacPackager extends macPackager_1.default {
    constructor(info) {
        super(info);
        this.effectiveSignOptions = null;
    }
    async pack(outDir, arch, targets, taskManager) {
        for (const target of targets) {
            // do not use instanceof to avoid dmg require
            if (target.name === "dmg") {
                this.effectiveDistOptions = await target.computeDmgOptions();
                break;
            }
        }
        // http://madole.xyz/babel-plugin-transform-async-to-module-method-gotcha/
        return await macPackager_1.default.prototype.pack.call(this, outDir, arch, targets, taskManager);
    }
    //noinspection JSUnusedLocalSymbols
    async doPack(outDir, appOutDir, platformName, arch, customBuildOptions, targets) {
        // skip
    }
    //noinspection JSUnusedGlobalSymbols
    async doSign(opts) {
        this.effectiveSignOptions = opts;
    }
    //noinspection JSUnusedGlobalSymbols,JSUnusedLocalSymbols
    async doFlat(appPath, outFile, identity, keychain) {
        // skip
    }
    //noinspection JSUnusedGlobalSymbols,JSUnusedLocalSymbols
    packageInDistributableFormat(appOutDir, arch, targets, taskManager) {
        // skip
    }
    async writeUpdateInfo(appOutDir, outDir) {
        // ignored
    }
}
exports.CheckingMacPackager = CheckingMacPackager;
//# sourceMappingURL=CheckingPackager.js.map