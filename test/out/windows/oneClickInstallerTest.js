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
const winHelper_1 = require("../helpers/winHelper");
const nsisTarget = electron_builder_1.Platform.WINDOWS.createTarget(["nsis"]);
test("one-click", packTester_1.app({
    targets: electron_builder_1.Platform.WINDOWS.createTarget(["nsis"], electron_builder_1.Arch.x64),
    config: {
        publish: {
            provider: "bintray",
            owner: "actperepo",
            package: "TestApp",
        },
        nsis: {
            deleteAppDataOnUninstall: true,
            packElevateHelper: false
        },
    }
}, {
    signedWin: true,
    packed: async (context) => {
        await winHelper_1.checkHelpers(context.getResources(electron_builder_1.Platform.WINDOWS, electron_builder_1.Arch.x64), false);
        await winHelper_1.doTest(context.outDir, true, "TestApp Setup", "TestApp", null, false);
        await winHelper_1.expectUpdateMetadata(context, electron_builder_1.Arch.x64, true);
    }
}));
test.ifAll("custom guid", packTester_1.app({
    targets: electron_builder_1.Platform.WINDOWS.createTarget(["nsis"], electron_builder_1.Arch.ia32),
    config: {
        appId: "boo",
        productName: "boo Hub",
        publish: null,
        nsis: {
            guid: "Foo Technologies\\Bar"
        },
    }
}));
test.ifAll.ifNotCiMac("multi language license", packTester_1.app({
    targets: electron_builder_1.Platform.WINDOWS.createTarget("nsis"),
    config: {
        publish: null,
        nsis: {
            uninstallDisplayName: "Hi!!!",
            createDesktopShortcut: false,
        },
    },
}, {
    projectDirCreated: projectDir => {
        return Promise.all([
            fs_extra_1.writeFile(path.join(projectDir, "build", "license_en.txt"), "Hi"),
            fs_extra_1.writeFile(path.join(projectDir, "build", "license_ru.txt"), "Привет"),
            fs_extra_1.writeFile(path.join(projectDir, "build", "license_ko.txt"), "Привет"),
            fs_extra_1.writeFile(path.join(projectDir, "build", "license_fi.txt"), "Привет"),
        ]);
    },
}));
test.ifAll.ifNotCiMac("html license", packTester_1.app({
    targets: electron_builder_1.Platform.WINDOWS.createTarget("nsis"),
    config: {
        publish: null,
        nsis: {
            uninstallDisplayName: "Hi!!!",
            createDesktopShortcut: false,
        }
    },
}, {
    projectDirCreated: projectDir => {
        return Promise.all([
            fs_extra_1.writeFile(path.join(projectDir, "build", "license.html"), '<html><body><p>Hi <a href="https://google.com" target="_blank">google</a></p></body></html>'),
        ]);
    },
}));
test.ifAll.ifDevOrWinCi("createDesktopShortcut always", packTester_1.app({
    targets: electron_builder_1.Platform.WINDOWS.createTarget("nsis"),
    config: {
        publish: null,
        nsis: {
            createDesktopShortcut: "always",
        }
    },
}));
test.ifDevOrLinuxCi("perMachine, no run after finish", packTester_1.app({
    targets: electron_builder_1.Platform.WINDOWS.createTarget(["nsis"], electron_builder_1.Arch.ia32),
    config: {
        // wine creates incorrect file names and registry entries for unicode, so, we use ASCII
        productName: "TestApp",
        fileAssociations: [
            {
                ext: "foo",
                name: "Test Foo",
            }
        ],
        nsis: {
            perMachine: true,
            runAfterFinish: false,
        },
        publish: {
            provider: "generic",
            // tslint:disable:no-invalid-template-strings
            url: "https://develar.s3.amazonaws.com/test/${os}/${arch}",
        },
        win: {
            electronUpdaterCompatibility: ">=2.16",
        },
    },
}, {
    projectDirCreated: projectDir => {
        return Promise.all([
            packTester_1.copyTestAsset("headerIcon.ico", path.join(projectDir, "build", "foo test space.ico")),
            packTester_1.copyTestAsset("license.txt", path.join(projectDir, "build", "license.txt")),
        ]);
    },
    packed: async (context) => {
        await winHelper_1.expectUpdateMetadata(context);
        await winHelper_1.checkHelpers(context.getResources(electron_builder_1.Platform.WINDOWS, electron_builder_1.Arch.ia32), true);
        await winHelper_1.doTest(context.outDir, false);
    },
}));
test.ifNotCiMac("installerHeaderIcon", () => {
    let headerIconPath = null;
    return packTester_1.assertPack("test-app-one", {
        targets: nsisTarget,
        effectiveOptionComputed: async (it) => {
            const defines = it[0];
            expect(defines.HEADER_ICO).toEqual(headerIconPath);
            return false;
        }
    }, {
        projectDirCreated: projectDir => {
            headerIconPath = path.join(projectDir, "build", "installerHeaderIcon.ico");
            return Promise.all([packTester_1.copyTestAsset("headerIcon.ico", headerIconPath), packTester_1.copyTestAsset("headerIcon.ico", path.join(projectDir, "build", "uninstallerIcon.ico"))]);
        }
    });
});
test.ifDevOrLinuxCi("custom include", packTester_1.app({ targets: nsisTarget }, {
    projectDirCreated: projectDir => packTester_1.copyTestAsset("installer.nsh", path.join(projectDir, "build", "installer.nsh")),
    packed: context => Promise.all([
        fileAssert_1.assertThat(path.join(context.projectDir, "build", "customHeader")).isFile(),
        fileAssert_1.assertThat(path.join(context.projectDir, "build", "customInit")).isFile(),
        fileAssert_1.assertThat(path.join(context.projectDir, "build", "customInstall")).isFile(),
    ]),
}));
test.skip("big file pack", packTester_1.app({
    targets: nsisTarget,
    config: {
        extraResources: ["**/*.mov"],
        nsis: {
            differentialPackage: false,
        },
    },
}, {
    projectDirCreated: async (projectDir) => {
        await fs_extra_1.copyFile("/Volumes/Pegasus/15.02.18.m4v", path.join(projectDir, "foo/bar/video.mov"));
    },
}));
test.ifDevOrLinuxCi("custom script", packTester_1.app({ targets: nsisTarget }, {
    projectDirCreated: projectDir => packTester_1.copyTestAsset("installer.nsi", path.join(projectDir, "build", "installer.nsi")),
    packed: context => fileAssert_1.assertThat(path.join(context.projectDir, "build", "customInstallerScript")).isFile(),
}));
test.ifAll.ifNotCiMac("menuCategory", packTester_1.app({
    targets: electron_builder_1.Platform.WINDOWS.createTarget(["nsis"], electron_builder_1.Arch.ia32),
    config: {
        extraMetadata: {
            name: "test-menu-category",
            productName: "Test Menu Category"
        },
        publish: null,
        nsis: {
            oneClick: false,
            menuCategory: true,
            artifactName: "${productName} CustomName ${version}.${ext}"
        },
    }
}, {
    projectDirCreated: projectDir => packTester_1.modifyPackageJson(projectDir, data => {
        data.name = "test-menu-category";
    }),
    packed: context => {
        return winHelper_1.doTest(context.outDir, false, "Test Menu Category", "test-menu-category", "Foo Bar");
    }
}));
test.ifNotCiMac("string menuCategory", packTester_1.app({
    targets: electron_builder_1.Platform.WINDOWS.createTarget(["nsis"], electron_builder_1.Arch.ia32),
    config: {
        extraMetadata: {
            name: "test-menu-category",
            productName: "Test Menu Category '"
        },
        publish: null,
        nsis: {
            oneClick: false,
            runAfterFinish: false,
            menuCategory: "Foo/Bar",
            // tslint:disable-next-line:no-invalid-template-strings
            artifactName: "${productName} CustomName ${version}.${ext}"
        },
    }
}, {
    projectDirCreated: projectDir => packTester_1.modifyPackageJson(projectDir, data => {
        data.name = "test-menu-category";
    }),
    packed: async (context) => {
        await winHelper_1.doTest(context.outDir, false, "Test Menu Category", "test-menu-category", "Foo Bar");
    }
}));
test.ifDevOrLinuxCi("file associations per user", packTester_1.app({
    targets: electron_builder_1.Platform.WINDOWS.createTarget(["nsis"], electron_builder_1.Arch.ia32),
    config: {
        publish: null,
        fileAssociations: [
            {
                ext: "foo",
                name: "Test Foo",
            }
        ],
    },
}));
//# sourceMappingURL=oneClickInstallerTest.js.map