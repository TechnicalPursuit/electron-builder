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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getElectronCacheDir = exports.ELECTRON_VERSION = void 0;
const os = __importStar(require("os"));
const path = __importStar(require("path"));
exports.ELECTRON_VERSION = "8.2.5";
function getElectronCacheDir() {
    if (process.platform === "win32") {
        return path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local"), "Cache", "electron");
    }
    else if (process.platform === "darwin") {
        return path.join(os.homedir(), "Library", "Caches", "electron");
    }
    else {
        return path.join(os.homedir(), ".cache", "electron");
    }
}
exports.getElectronCacheDir = getElectronCacheDir;
//# sourceMappingURL=testConfig.js.map