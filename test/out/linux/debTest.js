"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_builder_1 = require("electron-builder");
const fs_1 = require("fs");
const packTester_1 = require("../helpers/packTester");
test.ifNotWindows("deb", packTester_1.app({
    targets: electron_builder_1.Platform.LINUX.createTarget("deb"),
}));
test.ifNotWindows("arm", packTester_1.app({ targets: electron_builder_1.Platform.LINUX.createTarget("deb", electron_builder_1.Arch.armv7l, electron_builder_1.Arch.arm64) }));
test.ifNotWindows("custom depends", packTester_1.app({
    targets: electron_builder_1.Platform.LINUX.createTarget("deb"),
    config: {
        linux: {
            executableName: "Boo",
        },
        deb: {
            depends: ["foo"],
        },
    },
}));
test.ifNotWindows("no quotes for safe exec name", packTester_1.app({
    targets: electron_builder_1.Platform.LINUX.createTarget("deb"),
    config: {
        productName: "foo",
        linux: {
            executableName: "Boo",
        },
    },
    effectiveOptionComputed: async (it) => {
        const content = await fs_1.promises.readFile(it[1], "utf8");
        expect(content).toMatchSnapshot();
        return false;
    }
}));
test.ifNotWindows.ifAll("deb file associations", packTester_1.app({
    targets: electron_builder_1.Platform.LINUX.createTarget("deb"),
    config: {
        fileAssociations: [
            {
                ext: "my-app",
                name: "Test Foo",
                mimeType: "application/x-example",
            }
        ],
    },
}, {
    packed: async (context) => {
        const mime = (await packTester_1.execShell(`ar p '${context.outDir}/TestApp_1.1.0_amd64.deb' data.tar.xz | ${await packTester_1.getTarExecutable()} Jx --to-stdout ./usr/share/mime/packages/testapp.xml`, {
            maxBuffer: 10 * 1024 * 1024,
        })).stdout;
        expect(mime.trim()).toMatchSnapshot();
    }
}));
//# sourceMappingURL=debTest.js.map