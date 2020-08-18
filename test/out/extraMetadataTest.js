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
const asar_1 = require("app-builder-lib/out/asar/asar");
const builder_1 = require("electron-builder/out/builder");
const fs_extra_1 = require("fs-extra");
const path = __importStar(require("path"));
const fileAssert_1 = require("./helpers/fileAssert");
const packTester_1 = require("./helpers/packTester");
function createExtraMetadataTest(asar) {
    return packTester_1.app({
        targets: electron_builder_1.Platform.LINUX.createTarget(electron_builder_1.DIR_TARGET),
        config: builder_1.coerceTypes({
            asar,
            linux: {
                executableName: "new-name",
            },
            extraMetadata: {
                version: "1.0.0-beta.19",
                foo: {
                    bar: 12,
                    updated: "true",
                    disabled: "false",
                },
                rootKey: "false",
                rootKeyT: "true",
                rootKeyN: "null",
            },
        }),
    }, {
        projectDirCreated: projectDir => packTester_1.modifyPackageJson(projectDir, data => {
            data.scripts = {};
            data.devDependencies = { foo: "boo" };
            data.foo = {
                bar: 42,
                existingProp: 22,
            };
        }),
        packed: async (context) => {
            await fileAssert_1.assertThat(path.join(context.getContent(electron_builder_1.Platform.LINUX), "new-name")).isFile();
            if (asar) {
                expect(await asar_1.readAsarJson(path.join(context.getResources(electron_builder_1.Platform.LINUX), "app.asar"), "package.json")).toMatchSnapshot();
            }
            else {
                expect(await fs_extra_1.readJson(path.join(context.getResources(electron_builder_1.Platform.LINUX), "app", "package.json"))).toMatchSnapshot();
            }
        }
    });
}
test.ifDevOrLinuxCi("extra metadata", createExtraMetadataTest(true));
test.ifDevOrLinuxCi("extra metadata (no asar)", createExtraMetadataTest(false));
test("cli", async () => {
    // because these methods are internal
    const { configureBuildCommand, normalizeOptions } = require("electron-builder/out/builder");
    const yargs = require("yargs")
        .strict()
        .fail((message, error) => {
        throw error || new Error(message);
    });
    configureBuildCommand(yargs);
    function parse(input) {
        return normalizeOptions(yargs.parse(input.split(" ")));
    }
    function parseExtraMetadata(input) {
        const result = parse(input);
        delete result.targets;
        return result;
    }
    expect(parseExtraMetadata("--c.extraMetadata.foo=bar")).toMatchSnapshot();
    expect(parseExtraMetadata("--c.extraMetadata.dev.login-url")).toMatchSnapshot();
});
//# sourceMappingURL=extraMetadataTest.js.map