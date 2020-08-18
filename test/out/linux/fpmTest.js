"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_builder_1 = require("electron-builder");
const packTester_1 = require("../helpers/packTester");
if (process.platform === "win32") {
    const message = "fpmTest suite — Windows is not supported";
    fit("Skip " + message, () => {
        console.info(`[SKIP] ${message}`);
    });
}
// "apk" is very slow, don't test for now
test.ifAll.ifDevOrLinuxCi("targets", packTester_1.app({ targets: electron_builder_1.Platform.LINUX.createTarget(["sh", "freebsd", "pacman", "zip", "7z"]) }));
// https://github.com/electron-userland/electron-builder/issues/460
// for some reasons in parallel to fmp we cannot use tar
test.ifAll.ifDevOrLinuxCi("rpm and tar.gz", packTester_1.app({ targets: electron_builder_1.Platform.LINUX.createTarget(["rpm", "tar.gz"]) }));
//# sourceMappingURL=fpmTest.js.map