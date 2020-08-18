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
const builder_util_1 = require("builder-util");
const fs_1 = require("builder-util/out/fs");
const dmgUtil_1 = require("dmg-builder/out/dmgUtil");
const electron_builder_1 = require("electron-builder");
const path = __importStar(require("path"));
const fs_2 = require("fs");
const fs_extra_1 = require("fs-extra");
const fileAssert_1 = require("../helpers/fileAssert");
const packTester_1 = require("../helpers/packTester");
const dmgTarget = electron_builder_1.Platform.MAC.createTarget("dmg");
test.ifMac("dmg", packTester_1.app({
    targets: dmgTarget,
    config: {
        productName: "DefaultDmg",
        publish: null,
    },
}));
test.ifMac("no build directory", packTester_1.app({
    targets: dmgTarget,
    config: {
        // dmg can mount only one volume name, so, to test in parallel, we set different product name
        productName: "NoBuildDirectory",
        publish: null,
    },
    effectiveOptionComputed: async (it) => {
        if (!("volumePath" in it)) {
            return false;
        }
        const volumePath = it.volumePath;
        await fileAssert_1.assertThat(path.join(volumePath, ".background", "background.tiff")).isFile();
        await fileAssert_1.assertThat(path.join(volumePath, "Applications")).isSymbolicLink();
        expect(it.specification.contents).toMatchSnapshot();
        return false;
    },
}, {
    projectDirCreated: projectDir => fs_extra_1.remove(path.join(projectDir, "build")),
}));
test.ifMac("background color", packTester_1.app({
    targets: dmgTarget,
    config: {
        // dmg can mount only one volume name, so, to test in parallel, we set different product name
        productName: "BackgroundColor",
        publish: null,
        dmg: {
            backgroundColor: "orange",
            // speed-up test
            writeUpdateInfo: false,
        },
    },
    effectiveOptionComputed: async (it) => {
        if (!("volumePath" in it)) {
            return false;
        }
        delete it.specification.icon;
        expect(it.specification).toMatchSnapshot();
        return false;
    },
}));
test.ifMac("custom background - new way", () => {
    const customBackground = "customBackground.png";
    return packTester_1.assertPack("test-app-one", {
        targets: electron_builder_1.Platform.MAC.createTarget(),
        config: {
            publish: null,
            mac: {
                icon: "customIcon",
            },
            dmg: {
                background: customBackground,
                icon: "foo.icns",
                // speed-up test
                writeUpdateInfo: false,
            },
        },
        effectiveOptionComputed: async (it) => {
            expect(it.specification.background).toMatch(new RegExp(`.+${customBackground}$`));
            expect(it.specification.icon).toEqual("foo.icns");
            const packager = it.packager;
            expect(await packager.getIconPath()).toEqual(path.join(packager.projectDir, "build", "customIcon.icns"));
            return true;
        },
    }, {
        projectDirCreated: projectDir => Promise.all([
            fs_1.copyFile(path.join(dmgUtil_1.getDmgTemplatePath(), "background.tiff"), path.join(projectDir, customBackground)),
            // copy, but not rename to test that default icon is not used
            fs_1.copyFile(path.join(projectDir, "build", "icon.icns"), path.join(projectDir, "build", "customIcon.icns")),
            fs_1.copyFile(path.join(projectDir, "build", "icon.icns"), path.join(projectDir, "foo.icns")),
        ]),
    });
});
test.ifAll.ifMac("retina background as 2 png", () => {
    return packTester_1.assertPack("test-app-one", {
        targets: electron_builder_1.Platform.MAC.createTarget(),
        config: {
            publish: null,
        },
        effectiveOptionComputed: async (it) => {
            expect(it.specification.background).toMatch(/\.tiff$/);
            return true;
        },
    }, {
        projectDirCreated: async (projectDir) => {
            const resourceDir = path.join(projectDir, "build");
            await fs_1.copyFile(path.join(dmgUtil_1.getDmgTemplatePath(), "background.tiff"), path.join(resourceDir, "background.tiff"));
            async function extractPng(index, suffix) {
                await builder_util_1.exec("tiffutil", ["-extract", index.toString(), path.join(dmgUtil_1.getDmgTemplatePath(), "background.tiff")], {
                    cwd: projectDir
                });
                await builder_util_1.exec("sips", ["-s", "format", "png", "out.tiff", "--out", `background${suffix}.png`], {
                    cwd: projectDir
                });
            }
            await extractPng(0, "");
            await extractPng(1, "@2x");
            await fs_2.promises.unlink(path.join(resourceDir, "background.tiff"));
        },
    });
});
test.ifMac.ifAll("no Applications link", () => {
    return packTester_1.assertPack("test-app-one", {
        targets: electron_builder_1.Platform.MAC.createTarget(),
        config: {
            publish: null,
            productName: "NoApplicationsLink",
            dmg: {
                contents: [
                    {
                        x: 110,
                        y: 150
                    },
                    {
                        x: 410,
                        y: 440,
                        type: "link",
                        path: "/Applications/TextEdit.app"
                    }
                ],
            },
        },
        effectiveOptionComputed: async (it) => {
            if (!("volumePath" in it)) {
                return false;
            }
            const volumePath = it.volumePath;
            await Promise.all([
                fileAssert_1.assertThat(path.join(volumePath, ".background", "background.tiff")).isFile(),
                fileAssert_1.assertThat(path.join(volumePath, "Applications")).doesNotExist(),
                fileAssert_1.assertThat(path.join(volumePath, "TextEdit.app")).isSymbolicLink(),
                fileAssert_1.assertThat(path.join(volumePath, "TextEdit.app")).isDirectory(),
            ]);
            expect(it.specification.contents).toMatchSnapshot();
            return false;
        },
    });
});
test.ifMac("unset dmg icon", packTester_1.app({
    targets: dmgTarget,
    config: {
        publish: null,
        // dmg can mount only one volume name, so, to test in parallel, we set different product name
        productName: "Test ß No Volume Icon",
        dmg: {
            icon: null,
        }
    }
}, {
    packed: context => {
        return dmgUtil_1.attachAndExecute(path.join(context.outDir, "Test ß No Volume Icon-1.1.0.dmg"), false, () => {
            return Promise.all([
                fileAssert_1.assertThat(path.join("/Volumes/Test ß No Volume Icon 1.1.0/.background/background.tiff")).isFile(),
                fileAssert_1.assertThat(path.join("/Volumes/Test ß No Volume Icon 1.1.0/.VolumeIcon.icns")).doesNotExist(),
            ]);
        });
    }
}));
// test also "only dmg"
test.ifMac("no background", packTester_1.app({
    targets: dmgTarget,
    config: {
        publish: null,
        // dmg can mount only one volume name, so, to test in parallel, we set different product name
        productName: "NoBackground",
        dmg: {
            background: null,
            title: "Foo",
        },
    }
}, {
    packed: context => {
        return dmgUtil_1.attachAndExecute(path.join(context.outDir, "NoBackground-1.1.0.dmg"), false, () => {
            return fileAssert_1.assertThat(path.join("/Volumes/NoBackground 1.1.0/.background")).doesNotExist();
        });
    }
}));
// test also darkModeSupport
test.ifAll.ifMac("bundleShortVersion", packTester_1.app({
    targets: dmgTarget,
    config: {
        publish: null,
        // dmg can mount only one volume name, so, to test in parallel, we set different product name
        productName: "BundleShortVersion",
        mac: {
            bundleShortVersion: "2017.1-alpha5",
            darkModeSupport: true,
        },
    }
}));
test.ifAll.ifMac("disable dmg icon (light), bundleVersion", () => {
    return packTester_1.assertPack("test-app-one", {
        targets: electron_builder_1.Platform.MAC.createTarget(),
        config: {
            publish: null,
            dmg: {
                icon: null,
            },
            mac: {
                bundleVersion: "50"
            },
        },
        effectiveOptionComputed: async (it) => {
            expect(it.specification.icon).toBeNull();
            expect(it.packager.appInfo.buildVersion).toEqual("50");
            expect(await it.packager.getIconPath()).not.toBeNull();
            return true;
        },
    });
});
const packagerOptions = {
    targets: dmgTarget,
    config: {
        publish: null,
    }
};
test.ifAll.ifMac("multi language license", packTester_1.app(packagerOptions, {
    projectDirCreated: projectDir => {
        return Promise.all([
            // writeFile(path.join(projectDir, "build", "license_en.txt"), "Hi"),
            fs_2.promises.writeFile(path.join(projectDir, "build", "license_de.txt"), "Hallo"),
            fs_2.promises.writeFile(path.join(projectDir, "build", "license_ru.txt"), "Привет"),
        ]);
    },
}));
test.ifAll.ifMac("license ru", packTester_1.app(packagerOptions, {
    projectDirCreated: projectDir => {
        return fs_2.promises.writeFile(path.join(projectDir, "build", "license_ru.txt"), "Привет".repeat(12));
    },
}));
test.ifAll.ifMac("license en", packTester_1.app(packagerOptions, {
    projectDirCreated: projectDir => {
        return packTester_1.copyTestAsset("license_en.txt", path.join(projectDir, "build", "license_en.txt"));
    },
}));
test.ifAll.ifMac("license rtf", packTester_1.app(packagerOptions, {
    projectDirCreated: projectDir => {
        return packTester_1.copyTestAsset("license_de.rtf", path.join(projectDir, "build", "license_de.rtf"));
    },
}));
test.ifAll.ifMac("license buttons config", packTester_1.app({
    ...packagerOptions,
    effectiveOptionComputed: async (it) => {
        if ("licenseData" in it) {
            expect(it.licenseData).toMatchSnapshot();
        }
        return false;
    },
}, {
    projectDirCreated: projectDir => Promise.all([
        packTester_1.copyTestAsset("license_en.txt", path.join(projectDir, "build", "license_en.txt")),
        packTester_1.copyTestAsset("license_fr.txt", path.join(projectDir, "build", "license_fr.txt")),
        packTester_1.copyTestAsset("license_ja.txt", path.join(projectDir, "build", "license_ja.txt")),
        packTester_1.copyTestAsset("license_ko.txt", path.join(projectDir, "build", "license_ko.txt")),
        packTester_1.copyTestAsset("licenseButtons_en.yml", path.join(projectDir, "build", "licenseButtons_en.yml")),
        packTester_1.copyTestAsset("licenseButtons_fr.json", path.join(projectDir, "build", "licenseButtons_fr.json")),
        packTester_1.copyTestAsset("licenseButtons_ja.json", path.join(projectDir, "build", "licenseButtons_ja.json")),
        packTester_1.copyTestAsset("licenseButtons_ko.json", path.join(projectDir, "build", "licenseButtons_ko.json"))
    ]),
}));
//# sourceMappingURL=dmgTest.js.map