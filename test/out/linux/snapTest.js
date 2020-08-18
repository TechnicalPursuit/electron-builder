"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_builder_1 = require("electron-builder");
const packTester_1 = require("../helpers/packTester");
if (process.env.SNAP_TEST === "false") {
    fit("Skip snapTest suite — SNAP_TEST is set to false or Windows", () => {
        console.warn("[SKIP] Skip snapTest suite — SNAP_TEST is set to false");
    });
}
else if (process.platform === "win32") {
    fit("Skip snapTest suite — Windows is not supported", () => {
        console.warn("[SKIP] Skip snapTest suite — Windows is not supported");
    });
}
test.ifAll.ifDevOrLinuxCi("snap", packTester_1.app({
    targets: packTester_1.snapTarget,
    config: {
        extraMetadata: {
            name: "sep",
        },
        productName: "Sep",
    },
}));
test.ifAll.ifDevOrLinuxCi("arm", packTester_1.app({
    targets: electron_builder_1.Platform.LINUX.createTarget("snap", electron_builder_1.Arch.armv7l),
    config: {
        extraMetadata: {
            name: "sep",
        },
        productName: "Sep",
    },
}));
test.ifAll.ifDevOrLinuxCi("default stagePackages", async () => {
    for (const p of [["default"], ["default", "custom"], ["custom", "default"], ["foo1", "default", "foo2"]]) {
        await packTester_1.assertPack("test-app-one", {
            targets: electron_builder_1.Platform.LINUX.createTarget("snap"),
            config: {
                extraMetadata: {
                    name: "sep",
                },
                productName: "Sep",
                snap: {
                    stagePackages: p,
                    plugs: p,
                    confinement: "classic",
                    // otherwise "parts" will be removed
                    useTemplateApp: false,
                }
            },
            effectiveOptionComputed: async ({ snap, args }) => {
                delete snap.parts.app.source;
                expect(snap).toMatchSnapshot();
                expect(args).not.toContain("--exclude");
                return true;
            },
        });
    }
});
test.ifAll.ifDevOrLinuxCi("classic confinement", packTester_1.app({
    targets: packTester_1.snapTarget,
    config: {
        extraMetadata: {
            name: "cl-co-app",
        },
        productName: "Snap Electron App (classic confinement)",
        snap: {
            confinement: "classic",
        },
    },
}));
test.ifAll.ifDevOrLinuxCi("buildPackages", async () => {
    await packTester_1.assertPack("test-app-one", {
        targets: electron_builder_1.Platform.LINUX.createTarget("snap"),
        config: {
            extraMetadata: {
                name: "sep",
            },
            productName: "Sep",
            snap: {
                buildPackages: ["foo1", "default", "foo2"],
                // otherwise "parts" will be removed
                useTemplateApp: false,
            }
        },
        effectiveOptionComputed: async ({ snap }) => {
            delete snap.parts.app.source;
            expect(snap).toMatchSnapshot();
            return true;
        },
    });
});
test.ifDevOrLinuxCi("plugs option", async () => {
    for (const p of [
        [
            {
                "browser-sandbox": {
                    interface: "browser-support",
                    "allow-sandbox": true
                },
            },
            "another-simple-plug-name",
        ],
        {
            "browser-sandbox": {
                interface: "browser-support",
                "allow-sandbox": true
            },
            "another-simple-plug-name": null,
        },
    ]) {
        await packTester_1.assertPack("test-app-one", {
            targets: electron_builder_1.Platform.LINUX.createTarget("snap"),
            config: {
                snap: {
                    plugs: p,
                    // otherwise "parts" will be removed
                    useTemplateApp: false,
                }
            },
            effectiveOptionComputed: async ({ snap, args }) => {
                delete snap.parts.app.source;
                expect(snap).toMatchSnapshot();
                expect(args).not.toContain("--exclude");
                return true;
            },
        });
    }
});
test.ifDevOrLinuxCi("slots option", packTester_1.app({
    targets: electron_builder_1.Platform.LINUX.createTarget("snap"),
    config: {
        extraMetadata: {
            name: "sep",
        },
        productName: "Sep",
        snap: {
            slots: ["foo", "bar"],
        }
    },
    effectiveOptionComputed: async ({ snap }) => {
        expect(snap).toMatchSnapshot();
        return true;
    },
}));
test.ifDevOrLinuxCi("custom env", packTester_1.app({
    targets: electron_builder_1.Platform.LINUX.createTarget("snap"),
    config: {
        extraMetadata: {
            name: "sep",
        },
        productName: "Sep",
        snap: {
            environment: {
                FOO: "bar",
            },
        }
    },
    effectiveOptionComputed: async ({ snap }) => {
        expect(snap).toMatchSnapshot();
        return true;
    },
}));
test.ifDevOrLinuxCi("custom after, no desktop", packTester_1.app({
    targets: electron_builder_1.Platform.LINUX.createTarget("snap"),
    config: {
        extraMetadata: {
            name: "sep",
        },
        productName: "Sep",
        snap: {
            after: ["bar"],
        }
    },
    effectiveOptionComputed: async ({ snap }) => {
        expect(snap).toMatchSnapshot();
        return true;
    },
}));
test.ifDevOrLinuxCi("no desktop plugs", packTester_1.app({
    targets: electron_builder_1.Platform.LINUX.createTarget("snap"),
    config: {
        extraMetadata: {
            name: "sep",
        },
        productName: "Sep",
        snap: {
            plugs: ["foo", "bar"]
        }
    },
    effectiveOptionComputed: async ({ snap, args }) => {
        expect(snap).toMatchSnapshot();
        expect(args).toContain("--exclude");
        return true;
    },
}));
test.ifAll.ifDevOrLinuxCi("auto start", packTester_1.app({
    targets: packTester_1.snapTarget,
    config: {
        extraMetadata: {
            name: "sep",
        },
        productName: "Sep",
        snap: {
            autoStart: true
        }
    },
    effectiveOptionComputed: async ({ snap, args }) => {
        expect(snap).toMatchSnapshot();
        expect(snap.apps.sep.autostart).toEqual("sep.desktop");
        return true;
    },
}));
//# sourceMappingURL=snapTest.js.map