"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_builder_1 = require("electron-builder");
const packTester_1 = require("../helpers/packTester");
test.ifAll.ifNotWindows.ifDevOrLinuxCi("tar", packTester_1.app({ targets: electron_builder_1.Platform.LINUX.createTarget(["tar.xz", "tar.lz", "tar.bz2"]) }));
//# sourceMappingURL=linuxArchiveTest.js.map