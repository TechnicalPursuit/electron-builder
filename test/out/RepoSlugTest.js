"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const repositoryInfo_1 = require("app-builder-lib/out/util/repositoryInfo");
function checkInfo(info) {
    delete info.pathmatch;
    delete info.pathtemplate;
    delete info.httpstemplate;
    delete info.filetemplate;
    delete info.docstemplate;
    delete info.opts;
    expect(info).toMatchSnapshot();
}
test("repo slug from TRAVIS_REPO_SLUG", async () => {
    const oldValue = process.env.TRAVIS_REPO_SLUG;
    try {
        process.env.TRAVIS_REPO_SLUG = "travis-ci/travis-build";
        const info = await repositoryInfo_1.getRepositoryInfo(process.cwd());
        checkInfo(info);
    }
    finally {
        if (oldValue != null) {
            restoreEnv("TRAVIS_REPO_SLUG", oldValue);
        }
    }
});
test("repo slug from APPVEYOR", async () => {
    const oldAppveyorRepoName = process.env.APPVEYOR_REPO_NAME;
    const travisSlug = process.env.TRAVIS_REPO_SLUG;
    try {
        if (travisSlug != null) {
            delete process.env.TRAVIS_REPO_SLUG;
        }
        process.env.APPVEYOR_REPO_NAME = "travis-ci/travis-build";
        const info = await repositoryInfo_1.getRepositoryInfo(process.cwd());
        checkInfo(info);
    }
    finally {
        restoreEnv("APPVEYOR_REPO_NAME", oldAppveyorRepoName);
        if (travisSlug != null) {
            process.env.TRAVIS_REPO_SLUG = travisSlug;
        }
    }
});
function restoreEnv(name, value) {
    if (value != null) {
        // otherwise will be set to string value "undefined"
        process.env[name] = value;
    }
}
//# sourceMappingURL=RepoSlugTest.js.map