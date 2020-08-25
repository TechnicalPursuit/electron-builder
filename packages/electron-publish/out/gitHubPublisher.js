"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.GitHubPublisher = void 0;

function _builderUtil() {
  const data = require("builder-util");

  _builderUtil = function () {
    return data;
  };

  return data;
}

function _builderUtilRuntime() {
  const data = require("builder-util-runtime");

  _builderUtilRuntime = function () {
    return data;
  };

  return data;
}

function _nodeHttpExecutor() {
  const data = require("builder-util/out/nodeHttpExecutor");

  _nodeHttpExecutor = function () {
    return data;
  };

  return data;
}

function _lazyVal() {
  const data = require("lazy-val");

  _lazyVal = function () {
    return data;
  };

  return data;
}

function _mime() {
  const data = _interopRequireDefault(require("mime"));

  _mime = function () {
    return data;
  };

  return data;
}

function _url() {
  const data = require("url");

  _url = function () {
    return data;
  };

  return data;
}

function _publisher() {
  const data = require("./publisher");

  _publisher = function () {
    return data;
  };

  return data;
}

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class GitHubPublisher extends _publisher().HttpPublisher {
  constructor(context, info, version, options = {}) {
    super(context, true);
    this.info = info;
    this.version = version;
    this.options = options;
    this._release = new (_lazyVal().Lazy)(() => this.token === "__test__" ? Promise.resolve(null) : this.getOrCreateRelease());
    this.providerName = "GitHub";
    this.releaseLogFields = null;
    let token = info.token;

    if ((0, _builderUtil().isEmptyOrSpaces)(token)) {
      token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;

      if ((0, _builderUtil().isEmptyOrSpaces)(token)) {
        throw new (_builderUtil().InvalidConfigurationError)(`GitHub Personal Access Token is not set, neither programmatically, nor using env "GH_TOKEN"`);
      }

      token = token.trim();

      if (!(0, _builderUtil().isTokenCharValid)(token)) {
        throw new (_builderUtil().InvalidConfigurationError)(`GitHub Personal Access Token (${JSON.stringify(token)}) contains invalid characters, please check env "GH_TOKEN"`);
      }
    }

    this.token = token;

    if (version.startsWith("v")) {
      throw new (_builderUtil().InvalidConfigurationError)(`Version must not start with "v": ${version}`);
    }

    this.tag = info.vPrefixedTagName === false ? version : `v${version}`;

    if ((0, _builderUtil().isEnvTrue)(process.env.EP_DRAFT)) {
      this.releaseType = "draft";

      _builderUtil().log.info({
        reason: "env EP_DRAFT is set to true"
      }, "GitHub provider release type is set to draft");
    } else if ((0, _builderUtil().isEnvTrue)(process.env.EP_PRE_RELEASE) || (0, _builderUtil().isEnvTrue)(process.env.EP_PRELEASE)
    /* https://github.com/electron-userland/electron-builder/issues/2878 */
    ) {
        this.releaseType = "prerelease";

        _builderUtil().log.info({
          reason: "env EP_PRE_RELEASE is set to true"
        }, "GitHub provider release type is set to prerelease");
      } else if (info.releaseType != null) {
      this.releaseType = info.releaseType;
    } else if (options.prerelease) {
      this.releaseType = "prerelease";
    } else {
      // noinspection PointlessBooleanExpressionJS
      this.releaseType = options.draft === false ? "release" : "draft";
    }
  }

  async getOrCreateRelease() {
    const logFields = {
      tag: this.tag,
      version: this.version
    }; // we don't use "Get a release by tag name" because "tag name" means existing git tag, but we draft release and don't create git tag

    const releases = await this.githubRequest(`/repos/${this.info.owner}/${this.info.repo}/releases`, this.token);

    for (const release of releases) {
      if (!(release.tag_name === this.tag || release.tag_name === this.version)) {
        continue;
      }

      if (release.draft) {
        return release;
      } // https://github.com/electron-userland/electron-builder/issues/1197
      // https://github.com/electron-userland/electron-builder/issues/2072


      if (this.releaseType === "draft") {
        this.releaseLogFields = {
          reason: "existing type not compatible with publishing type",
          ...logFields,
          existingType: release.prerelease ? "pre-release" : "release",
          publishingType: this.releaseType
        };

        _builderUtil().log.warn(this.releaseLogFields, "GitHub release not created");

        return null;
      } // https://github.com/electron-userland/electron-builder/issues/1133
      // https://github.com/electron-userland/electron-builder/issues/2074
      // if release created < 2 hours — allow to upload


      const publishedAt = release.published_at == null ? null : Date.parse(release.published_at);

      if (publishedAt != null && Date.now() - publishedAt > 2 * 3600 * 1000) {
        // https://github.com/electron-userland/electron-builder/issues/1183#issuecomment-275867187
        this.releaseLogFields = {
          reason: "existing release published more than 2 hours ago",
          ...logFields,
          date: new Date(publishedAt).toString()
        };

        _builderUtil().log.warn(this.releaseLogFields, "GitHub release not created");

        return null;
      }

      return release;
    } // https://github.com/electron-userland/electron-builder/issues/1835


    if (this.options.publish === "always" || (0, _publisher().getCiTag)() != null) {
      _builderUtil().log.info({
        reason: "release doesn't exist",
        ...logFields
      }, `creating GitHub release`);

      return this.createRelease();
    }

    this.releaseLogFields = {
      reason: "release doesn't exist and not created because \"publish\" is not \"always\" and build is not on tag",
      ...logFields
    };
    return null;
  }

  async overwriteArtifact(fileName, release) {
    // delete old artifact and re-upload
    _builderUtil().log.warn({
      file: fileName,
      reason: "already exists on GitHub"
    }, "overwrite published file");

    const assets = await this.githubRequest(`/repos/${this.info.owner}/${this.info.repo}/releases/${release.id}/assets`, this.token, null);

    for (const asset of assets) {
      if (asset.name === fileName) {
        await this.githubRequest(`/repos/${this.info.owner}/${this.info.repo}/releases/assets/${asset.id}`, this.token, null, "DELETE");
        return;
      }
    }

    _builderUtil().log.debug({
      file: fileName,
      reason: "not found on GitHub"
    }, "trying to upload again");
  }

  async doUpload(fileName, arch, dataLength, requestProcessor) {
    const release = await this._release.value;

    if (release == null) {
      _builderUtil().log.warn({
        file: fileName,
        ...this.releaseLogFields
      }, "skipped publishing");

      return;
    }

    const parsedUrl = (0, _url().parse)(release.upload_url.substring(0, release.upload_url.indexOf("{")) + "?name=" + fileName);
    return await this.doUploadFile(0, parsedUrl, fileName, dataLength, requestProcessor, release);
  }

  doUploadFile(attemptNumber, parsedUrl, fileName, dataLength, requestProcessor, release) {
    return _nodeHttpExecutor().httpExecutor.doApiRequest((0, _builderUtilRuntime().configureRequestOptions)({
      hostname: parsedUrl.hostname,
      path: parsedUrl.path,
      method: "POST",
      headers: {
        accept: "application/vnd.github.v3+json",
        "Content-Type": _mime().default.getType(fileName) || "application/octet-stream",
        "Content-Length": dataLength
      }
    }, this.token), this.context.cancellationToken, requestProcessor).catch(e => {
      if (e.statusCode === 422 && e.description != null && e.description.errors != null && e.description.errors[0].code === "already_exists") {
        return this.overwriteArtifact(fileName, release).then(() => this.doUploadFile(attemptNumber, parsedUrl, fileName, dataLength, requestProcessor, release));
      }

      if (attemptNumber > 3) {
        return Promise.reject(e);
      } else {
        return new Promise((resolve, reject) => {
          const newAttemptNumber = attemptNumber + 1;
          setTimeout(() => {
            this.doUploadFile(newAttemptNumber, parsedUrl, fileName, dataLength, requestProcessor, release).then(resolve).catch(reject);
          }, newAttemptNumber * 2000);
        });
      }
    });
  }

  createRelease() {
    return this.githubRequest(`/repos/${this.info.owner}/${this.info.repo}/releases`, this.token, {
      tag_name: this.tag,
      name: this.version,
      draft: this.releaseType === "draft",
      prerelease: this.releaseType === "prerelease"
    });
  } // test only
  //noinspection JSUnusedGlobalSymbols


  async getRelease() {
    return this.githubRequest(`/repos/${this.info.owner}/${this.info.repo}/releases/${(await this._release.value).id}`, this.token);
  } //noinspection JSUnusedGlobalSymbols


  async deleteRelease() {
    if (!this._release.hasValue) {
      return;
    }

    const release = await this._release.value;

    for (let i = 0; i < 3; i++) {
      try {
        return await this.githubRequest(`/repos/${this.info.owner}/${this.info.repo}/releases/${release.id}`, this.token, null, "DELETE");
      } catch (e) {
        if (e instanceof _builderUtilRuntime().HttpError) {
          if (e.statusCode === 404) {
            _builderUtil().log.warn({
              releaseId: release.id,
              reason: "doesn't exist"
            }, "cannot delete release");

            return;
          } else if (e.statusCode === 405 || e.statusCode === 502) {
            continue;
          }
        }

        throw e;
      }
    }

    _builderUtil().log.warn({
      releaseId: release.id
    }, "cannot delete release");
  }

  githubRequest(path, token, data = null, method) {
    // host can contains port, but node http doesn't support host as url does
    const baseUrl = (0, _url().parse)(`https://${this.info.host || "api.github.com"}`);
    return (0, _builderUtilRuntime().parseJson)(_nodeHttpExecutor().httpExecutor.request((0, _builderUtilRuntime().configureRequestOptions)({
      hostname: baseUrl.hostname,
      port: baseUrl.port,
      path: this.info.host != null && this.info.host !== "github.com" ? `/api/v3${path.startsWith("/") ? path : `/${path}`}` : path,
      headers: {
        accept: "application/vnd.github.v3+json"
      }
    }, token, method), this.context.cancellationToken, data));
  }

  toString() {
    return `Github (owner: ${this.info.owner}, project: ${this.info.repo}, version: ${this.version})`;
  }

} exports.GitHubPublisher = GitHubPublisher;
// __ts-babel@6.0.4
//# sourceMappingURL=gitHubPublisher.js.map