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
const fileAssert_1 = require("../helpers/fileAssert");
const packTester_1 = require("../helpers/packTester");
const testConfig_1 = require("../helpers/testConfig");
const fs_1 = require("fs");
const appImageTarget = electron_builder_1.Platform.LINUX.createTarget("appimage");
// test update info file name
const testPublishConfig = {
    provider: "generic",
    url: "https://example.com/download",
};
test.ifNotWindows("AppImage", packTester_1.app({
    targets: appImageTarget,
    config: {
        publish: testPublishConfig,
    },
}));
// also test os macro in output dir
test.ifAll.ifNotWindows.ifNotCiMac("AppImage ia32", packTester_1.app({
    targets: electron_builder_1.Platform.LINUX.createTarget("Appimage", electron_builder_1.Arch.ia32),
    config: {
        directories: {
            // tslint:disable:no-invalid-template-strings
            output: "dist/${os}",
        },
        publish: testPublishConfig,
    },
}));
test.ifAll.ifNotWindows.ifNotCiMac("AppImage arm, max compression", packTester_1.app({
    targets: electron_builder_1.Platform.LINUX.createTarget("Appimage", electron_builder_1.Arch.armv7l),
    config: {
        publish: testPublishConfig,
        compression: "maximum",
    },
}));
test.ifNotWindows.ifNotCiMac.ifAll("AppImage - deprecated systemIntegration", packTester_1.appThrows({
    targets: appImageTarget,
    config: {
        appImage: {
            systemIntegration: "doNotAsk",
        },
    },
}));
test.ifNotWindows.ifNotCiMac.ifAll("text license and file associations", packTester_1.app({
    targets: appImageTarget,
    config: {
        extraResources: {
            from: "build/icons"
        },
        fileAssociations: [
            {
                ext: "my-app",
                name: "Test Foo",
                mimeType: "application/x-example",
            }
        ],
    },
}, {
    projectDirCreated: projectDir => {
        return Promise.all([
            // copy full text to test presentation
            packTester_1.copyTestAsset("license_en.txt", path.join(projectDir, "build", "license.txt")),
        ]);
    }
}));
test.ifNotWindows.ifNotCiMac.ifAll("html license", packTester_1.app({
    targets: appImageTarget,
}, {
    projectDirCreated: projectDir => {
        return Promise.all([
            fs_extra_1.outputFile(path.join(projectDir, "build", "license.html"), `
<html>
<body>
  <a href="http://example.com">Test link</a>
</body>      
</html>
      `)
        ]);
    }
}));
test.ifNotWindows.ifNotCiMac("AppImage - default icon, custom executable and custom desktop", packTester_1.app({
    targets: appImageTarget,
    config: {
        linux: {
            executableName: "Foo",
            desktop: {
                "X-Foo": "bar",
                Terminal: "true",
            },
        },
        appImage: {
            // tslint:disable-next-line:no-invalid-template-strings
            artifactName: "boo-${productName}",
        }
    },
    effectiveOptionComputed: async (it) => {
        const content = it.desktop;
        expect(content.split("\n").filter(it => !it.includes("X-AppImage-BuildId") && !it.includes("X-AppImage-Version")).join("\n")).toMatchSnapshot();
        return false;
    },
}, {
    projectDirCreated: it => fs_extra_1.remove(path.join(it, "build")),
    packed: async (context) => {
        const projectDir = context.getContent(electron_builder_1.Platform.LINUX);
        await fileAssert_1.assertThat(path.join(projectDir, "Foo")).isFile();
    },
}));
test.ifNotWindows("icons from ICNS (mac)", packTester_1.app({
    targets: appImageTarget,
    config: {
        publish: null,
        mac: {
            icon: "resources/time.icns",
        },
        // test https://github.com/electron-userland/electron-builder/issues/3510
        linux: {
            artifactName: "app-${version}-${arch}.${ext}",
        }
    },
}, {
    projectDirCreated: async (projectDir) => {
        await fs_1.promises.mkdir(path.join(projectDir, "resources"), { recursive: true }).then(() => fs_1.promises.rename(path.join(projectDir, "build", "icon.icns"), path.join(projectDir, "resources", "time.icns")));
        await fs_extra_1.remove(path.join(projectDir, "build"));
    },
    packed: async (context) => {
        const projectDir = context.getResources(electron_builder_1.Platform.LINUX);
        await fileAssert_1.assertThat(projectDir).isDirectory();
    },
}));
test.ifNotWindows("icons from ICNS if nothing specified", packTester_1.app({
    targets: appImageTarget,
    config: {
        publish: null,
    },
}, {
    projectDirCreated: async (projectDir) => {
        await fs_extra_1.remove(path.join(projectDir, "build", "icons"));
    },
}));
test.ifNotWindows("icons from dir and one icon with suffix", packTester_1.app({
    targets: appImageTarget,
    config: {
        publish: null,
    },
}, {
    projectDirCreated: async (projectDir) => {
        await fs_1.promises.copyFile(path.join(projectDir, "build", "icons", "16x16.png"), path.join(projectDir, "build", "icons", "16x16-dev.png"));
    },
    packed: async (context) => {
        const projectDir = context.getResources(electron_builder_1.Platform.LINUX);
        await fileAssert_1.assertThat(projectDir).isDirectory();
    },
}));
test.ifNotWindows("icons dir with images without size in the filename", packTester_1.app({
    targets: appImageTarget,
    config: {
        publish: null,
        win: {
            // doesn't matter, but just to be sure that presense of this configuration doesn't lead to errors
            icon: "icons/icon.ico",
        },
    },
}, {
    projectDirCreated: async (projectDir) => {
        await fs_1.promises.rename(path.join(projectDir, "build", "icons", "256x256.png"), path.join(projectDir, "build", "icon.png"));
        await fs_extra_1.remove(path.join(projectDir, "build", "icons"));
        await fs_1.promises.rename(path.join(projectDir, "build"), path.join(projectDir, "icons"));
    },
    packed: async (context) => {
        const projectDir = context.getResources(electron_builder_1.Platform.LINUX);
        await fileAssert_1.assertThat(projectDir).isDirectory();
    },
}));
// test prepacked asar also https://github.com/electron-userland/electron-builder/issues/1102
test.ifNotWindows("icons from ICNS", packTester_1.app({
    targets: appImageTarget,
    config: {
        publish: null,
    },
}, {
    projectDirCreated: it => fs_extra_1.remove(path.join(it, "build", "icons")),
    packed: async (context) => {
        const projectDir = context.getResources(electron_builder_1.Platform.LINUX);
        await fs_extra_1.remove(path.join(projectDir, "inspector"));
        await electron_builder_1.build({
            targets: appImageTarget,
            projectDir,
            publish: "never",
            config: {
                electronVersion: testConfig_1.ELECTRON_VERSION,
                compression: "store",
                npmRebuild: false,
            }
        });
        await fileAssert_1.assertThat(path.join(projectDir, "dist")).isDirectory();
    },
}));
test.ifNotWindows("no-author-email", packTester_1.appThrows({ targets: electron_builder_1.Platform.LINUX.createTarget("deb") }, {
    projectDirCreated: projectDir => packTester_1.modifyPackageJson(projectDir, data => {
        data.author = "Foo";
    })
}));
test.ifNotWindows("forbid desktop.Exec", packTester_1.appThrows({
    targets: electron_builder_1.Platform.LINUX.createTarget("AppImage"),
    config: {
        linux: {
            desktop: {
                Exec: "foo"
            }
        }
    }
}));
//# sourceMappingURL=linuxPackagerTest.js.map