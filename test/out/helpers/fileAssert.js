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
exports.assertThat = void 0;
const fs_1 = require("builder-util/out/fs");
const fs_2 = require("fs");
const path = __importStar(require("path"));
// http://joel-costigliola.github.io/assertj/
function assertThat(actual) {
    return new Assertions(actual);
}
exports.assertThat = assertThat;
const appVersion = require(path.join(__dirname, "../../../packages/app-builder-lib/package.json")).version;
class Assertions {
    constructor(actual) {
        this.actual = actual;
    }
    containsAll(expected) {
        expect(this.actual.slice().sort()).toEqual(Array.from(expected).slice().sort());
    }
    isAbsolute() {
        if (!path.isAbsolute(this.actual)) {
            throw new Error(`Path ${this.actual} is not absolute`);
        }
    }
    async isFile() {
        const info = await fs_1.statOrNull(this.actual);
        if (info == null) {
            throw new Error(`Path ${this.actual} doesn't exist`);
        }
        if (!info.isFile()) {
            throw new Error(`Path ${this.actual} is not a file`);
        }
    }
    async isSymbolicLink() {
        const info = await fs_2.promises.lstat(this.actual);
        if (!info.isSymbolicLink()) {
            throw new Error(`Path ${this.actual} is not a symlink`);
        }
    }
    async isDirectory() {
        const file = this.actual;
        const info = await fs_1.statOrNull(file);
        if (info == null) {
            throw new Error(`Path ${file} doesn't exist`);
        }
        if (!info.isDirectory()) {
            throw new Error(`Path ${file} is not a directory`);
        }
    }
    async doesNotExist() {
        if (await fs_1.exists(this.actual)) {
            throw new Error(`Path ${this.actual} must not exist`);
        }
    }
    async throws(customErrorAssert) {
        let actualError = null;
        let result;
        try {
            result = await this.actual;
        }
        catch (e) {
            actualError = e;
        }
        let m;
        if (actualError == null) {
            m = result;
        }
        else {
            m = actualError.code || actualError.message;
            if (m.includes("HttpError: ") && m.indexOf("\n") > 0) {
                m = m.substring(0, m.indexOf("\n"));
            }
            if (m.startsWith("Cannot find specified resource")) {
                m = m.substring(0, m.indexOf(","));
            }
            m = m.replace(appVersion, "<appVersion>");
            m = m.replace(/\((C:)?([\/\\])[^(]+([\/\\])([^(\/\\]+)\)/g, `(<path>/$4)`);
            m = m.replace(/"(C:)?([\/\\])[^"]+([\/\\])([^"\/\\]+)"/g, `"<path>/$4"`);
            m = m.replace(/'(C:)?([\/\\])[^']+([\/\\])([^'\/\\]+)'/g, `'<path>/$4'`);
        }
        try {
            if (customErrorAssert == null) {
                expect(m).toMatchSnapshot();
            }
            else {
                customErrorAssert(actualError);
            }
        }
        catch (matchError) {
            throw new Error(matchError + " " + actualError);
        }
    }
}
//# sourceMappingURL=fileAssert.js.map