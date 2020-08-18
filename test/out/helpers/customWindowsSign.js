"use strict";
// test custom windows sign using path to file
Object.defineProperty(exports, "__esModule", { value: true });
async function default_1(configuration) {
    const info = configuration.cscInfo;
    expect(info.file).toEqual("secretFile");
    expect(info.password).toEqual("pass");
}
exports.default = default_1;
//# sourceMappingURL=customWindowsSign.js.map