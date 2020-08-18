"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestAppAdapter = void 0;
const ElectronAppAdapter_1 = require("electron-updater/out/ElectronAppAdapter");
// do not implement AppAdapter directly, test that our ElectronAppAdapter implementation is correct
class TestAppAdapter extends ElectronAppAdapter_1.ElectronAppAdapter {
    constructor(version, _baseCachePath) {
        super(new MockApp(version));
        this._baseCachePath = _baseCachePath;
    }
    get baseCachePath() {
        return this._baseCachePath;
    }
    get userDataPath() {
        // use cache as user data in tests (only staging id is stored under user data)
        return this._baseCachePath;
    }
    get isPackaged() {
        return true;
    }
    whenReady() {
        return Promise.resolve();
    }
    quit() {
        // empty
    }
}
exports.TestAppAdapter = TestAppAdapter;
class MockApp {
    constructor(version) {
        this.version = version;
    }
    // noinspection JSMethodCanBeStatic,JSUnusedGlobalSymbols
    getVersion() {
        return this.version;
    }
    getName() {
        return "test-updater-app";
    }
    // noinspection JSMethodCanBeStatic,JSUnusedGlobalSymbols
    getAppPath() {
        return "";
    }
    // noinspection JSMethodCanBeStatic,JSUnusedGlobalSymbols
    getPath(type) {
        throw new Error("must be not called");
    }
    on() {
        // ignored
    }
    once() {
        // ignored
    }
    isReady() {
        return true;
    }
}
//# sourceMappingURL=TestAppAdapter.js.map