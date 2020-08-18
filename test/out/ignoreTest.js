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
const electron_builder_1 = require("electron-builder");
const fs_extra_1 = require("fs-extra");
const path = __importStar(require("path"));
const fileAssert_1 = require("./helpers/fileAssert");
const packTester_1 = require("./helpers/packTester");
test.ifDevOrLinuxCi("ignore build resources", packTester_1.app({
    targets: electron_builder_1.Platform.LINUX.createTarget(electron_builder_1.DIR_TARGET),
    config: {
        asar: false
    }
}, {
    projectDirCreated: projectDir => {
        return fs_extra_1.outputFile(path.join(projectDir, "one/build/foo.txt"), "data");
    },
    packed: context => {
        return fileAssert_1.assertThat(path.join(context.getResources(electron_builder_1.Platform.LINUX), "app", "one", "build", "foo.txt")).isFile();
    },
}));
test.ifDevOrLinuxCi("2 ignore", packTester_1.app({
    targets: electron_builder_1.Platform.LINUX.createTarget(electron_builder_1.DIR_TARGET),
    config: {
        asar: false,
        files: [
            "**/*",
            "!{app,build,electron,mobile,theme,uploads,util,dist,dist-app/aot,dist-app/app.bundle.js,dist-app/dependencies/shim.min.js,dist-app/dependencies/classList.min.js,dist-app/dependencies/web-animations.min.js,main.js,main-aot.js,favicon.ico,index.html,index-aot.html,index-cordova.html,index-aot.js,index-electron.js,index.bundle.js,systemjs.config.js,systemjs-angular-loader.js,package-lock.json}",
            "!*config*.json",
            "!**/*.{ts,scss,map,md,csv,wrapped}",
            "!**/*.{hprof,orig,pyc,pyo,rbc}",
            "!**/._*",
            "!**/{.DS_Store,.git,.hg,.svn,CVS,RCS,SCCS,__pycache__,thumbs.db,.gitignore,.gitattributes,.flowconfig,.yarn-metadata.json,.idea,appveyor.yml,.travis.yml,circle.yml,npm-debug.log,.nyc_output,yarn.lock,.yarn-integrity}"
        ],
    }
}, {
    projectDirCreated: projectDir => {
        return fs_extra_1.outputFile(path.join(projectDir, "electron/foo.txt"), "data");
    },
    packed: context => {
        return fileAssert_1.assertThat(path.join(context.getResources(electron_builder_1.Platform.LINUX), "app", "electron", "foo.txt")).doesNotExist();
    },
}));
test.ifDevOrLinuxCi("ignore known ignored files", packTester_1.app({
    targets: electron_builder_1.Platform.LINUX.createTarget(electron_builder_1.DIR_TARGET),
    config: {
        asar: false
    }
}, {
    projectDirCreated: projectDir => Promise.all([
        fs_extra_1.outputFile(path.join(projectDir, ".svn", "foo"), "data"),
        fs_extra_1.outputFile(path.join(projectDir, ".git", "foo"), "data"),
        fs_extra_1.outputFile(path.join(projectDir, "node_modules", ".bin", "f.txt"), "data"),
        fs_extra_1.outputFile(path.join(projectDir, "node_modules", ".bin2", "f.txt"), "data"),
    ]),
    packed: context => packTester_1.checkDirContents(path.join(context.getResources(electron_builder_1.Platform.LINUX), "app")),
}));
// skip on macOS because we want test only / and \
test.ifNotCiMac("ignore node_modules dev dep", packTester_1.app({
    targets: electron_builder_1.Platform.LINUX.createTarget(electron_builder_1.DIR_TARGET),
    config: {
        asar: false,
    },
}, {
    projectDirCreated: projectDir => {
        return Promise.all([
            packTester_1.modifyPackageJson(projectDir, data => {
                data.devDependencies = {
                    "electron-osx-sign": "*", ...data.devDependencies
                };
            }),
            fs_extra_1.outputFile(path.join(projectDir, "node_modules", "electron-osx-sign", "package.json"), "{}"),
        ]);
    },
    packed: context => {
        return Promise.all([
            fileAssert_1.assertThat(path.join(context.getResources(electron_builder_1.Platform.LINUX), "app", "node_modules", "electron-osx-sign")).doesNotExist(),
            fileAssert_1.assertThat(path.join(context.getResources(electron_builder_1.Platform.LINUX), "app", "ignoreMe")).doesNotExist(),
        ]);
    },
}));
//# sourceMappingURL=ignoreTest.js.map