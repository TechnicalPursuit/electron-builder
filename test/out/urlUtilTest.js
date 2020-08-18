"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const url_1 = require("url");
const electron_updater_1 = require("electron-updater");
test("newUrlFromBase", () => {
    const fileUrl = new url_1.URL("https://AWS_S3_HOST/bucket-yashraj/electron%20Setup%2011.0.3.exe");
    const newBlockMapUrl = electron_updater_1.newUrlFromBase(`${fileUrl.pathname}.blockmap`, fileUrl);
    expect(newBlockMapUrl.href).toBe("https://aws_s3_host/bucket-yashraj/electron%20Setup%2011.0.3.exe.blockmap");
});
test("add no cache", () => {
    const baseUrl = new url_1.URL("https://gitlab.com/artifacts/master/raw/dist?job=build_electron_win");
    const newBlockMapUrl = electron_updater_1.newUrlFromBase("latest.yml", baseUrl, true);
    expect(newBlockMapUrl.href).toBe("https://gitlab.com/artifacts/master/raw/latest.yml?job=build_electron_win");
});
//# sourceMappingURL=urlUtilTest.js.map