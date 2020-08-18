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
const builder_util_1 = require("builder-util");
const builder_util_runtime_1 = require("builder-util-runtime");
const electron_builder_1 = require("electron-builder");
const fs_extra_1 = require("fs-extra");
const fs_1 = require("fs");
const path = __importStar(require("path"));
const path_sort_1 = __importDefault(require("path-sort"));
const fileAssert_1 = require("../helpers/fileAssert");
const packTester_1 = require("../helpers/packTester");
test.ifMac.ifAll("invalid target", () => fileAssert_1.assertThat(packTester_1.createMacTargetTest(["ttt"])()).throws());
test.ifNotWindows.ifAll("only zip", packTester_1.createMacTargetTest(["zip"], undefined, false /* no need to test sign */));
test.ifNotWindows.ifAll("tar.gz", packTester_1.createMacTargetTest(["tar.gz"]));
const it = process.env.CSC_KEY_PASSWORD == null ? test.skip : test.ifMac;
it("pkg", packTester_1.createMacTargetTest(["pkg"]));
test.ifAll.ifMac("empty installLocation", packTester_1.app({
    targets: electron_builder_1.Platform.MAC.createTarget("pkg"),
    config: {
        pkg: {
            installLocation: "",
        }
    }
}, {
    signed: false,
    projectDirCreated: projectDir => {
        return Promise.all([
            packTester_1.copyTestAsset("license.txt", path.join(projectDir, "build", "license.txt")),
        ]);
    },
}));
test.ifAll.ifMac("extraDistFiles", packTester_1.app({
    targets: electron_builder_1.Platform.MAC.createTarget("zip"),
    config: {
        mac: {
            extraDistFiles: "extra.txt"
        }
    }
}, {
    signed: false,
    projectDirCreated: projectDir => {
        return Promise.all([
            fs_extra_1.outputFile(path.join(projectDir, "extra.txt"), "test"),
        ]);
    },
}));
test.ifAll.ifMac("pkg extended configuration", packTester_1.app({
    targets: electron_builder_1.Platform.MAC.createTarget("pkg"),
    config: {
        pkg: {
            isRelocatable: false,
            isVersionChecked: false,
            hasStrictIdentifier: false,
            overwriteAction: "update",
        }
    }
}, {
    signed: false,
    packed: async (context) => {
        const pkgPath = path.join(context.outDir, "Test App ßW-1.1.0.pkg");
        const unpackedDir = path.join(context.outDir, "pkg-unpacked");
        await builder_util_1.exec("pkgutil", ["--expand", pkgPath, unpackedDir]);
        const packageInfoFile = path.join(unpackedDir, "org.electron-builder.testApp.pkg", "PackageInfo");
        const info = builder_util_runtime_1.parseXml(await fs_1.promises.readFile(packageInfoFile, "utf8"));
        const relocateElement = info.elementOrNull("relocate");
        if (relocateElement != null) {
            expect(relocateElement.elements).toBeNull();
        }
        const upgradeBundleElement = info.elementOrNull("upgrade-bundle");
        if (upgradeBundleElement != null) {
            expect(upgradeBundleElement.elements).toBeNull();
        }
        const updateBundleElement = info.elementOrNull("update-bundle");
        if (updateBundleElement != null) {
            expect(updateBundleElement.elements).toHaveLength(1);
        }
        const strictIdentifierElement = info.elementOrNull("strict-identifier");
        if (strictIdentifierElement != null) {
            expect(strictIdentifierElement.elements).toBeNull();
        }
    }
}));
test.ifAll.ifMac("pkg scripts", packTester_1.app({
    targets: electron_builder_1.Platform.MAC.createTarget("pkg"),
}, {
    signed: false,
    projectDirCreated: async (projectDir) => {
        await fs_1.promises.symlink(path.join(packTester_1.getFixtureDir(), "pkg-scripts"), path.join(projectDir, "build", "pkg-scripts"));
    },
    packed: async (context) => {
        const pkgPath = path.join(context.outDir, "Test App ßW-1.1.0.pkg");
        console.log("CALL");
        const fileList = path_sort_1.default(packTester_1.parseFileList(await builder_util_1.exec("pkgutil", ["--payload-files", pkgPath]), false));
        expect(fileList).toMatchSnapshot();
        const unpackedDir = path.join(context.outDir, "pkg-unpacked");
        await builder_util_1.exec("pkgutil", ["--expand", pkgPath, unpackedDir]);
        const info = builder_util_runtime_1.parseXml(await fs_1.promises.readFile(path.join(unpackedDir, "Distribution"), "utf8"));
        for (const element of info.getElements("pkg-ref")) {
            element.removeAttribute("installKBytes");
            const bundleVersion = element.elementOrNull("bundle-version");
            if (bundleVersion != null) {
                bundleVersion.element("bundle").removeAttribute("CFBundleVersion");
            }
        }
        // delete info.product.version
        info.element("product").removeAttribute("version");
        expect(info).toMatchSnapshot();
        const scriptDir = path.join(unpackedDir, "org.electron-builder.testApp.pkg", "Scripts");
        await Promise.all([
            fileAssert_1.assertThat(path.join(scriptDir, "postinstall")).isFile(),
            fileAssert_1.assertThat(path.join(scriptDir, "preinstall")).isFile(),
        ]);
    }
}));
// todo failed on Travis CI
//test("tar.xz", createTargetTest(["tar.xz"], ["Test App ßW-1.1.0-mac.tar.xz"]))
//# sourceMappingURL=macArchiveTest.js.map