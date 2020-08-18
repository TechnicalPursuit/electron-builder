"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getCiTag = getCiTag;
Object.defineProperty(exports, "ProgressCallback", {
  enumerable: true,
  get: function () {
    return _progress().ProgressCallback;
  }
});
exports.HttpPublisher = exports.Publisher = void 0;

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

function _log() {
  const data = require("builder-util/out/log");

  _log = function () {
    return data;
  };

  return data;
}

function _chalk() {
  const data = _interopRequireDefault(require("chalk"));

  _chalk = function () {
    return data;
  };

  return data;
}

function _fsExtra() {
  const data = require("fs-extra");

  _fsExtra = function () {
    return data;
  };

  return data;
}

var _path = require("path");

function _progress() {
  const data = require("./progress");

  _progress = function () {
    return data;
  };

  return data;
}

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const progressBarOptions = {
  incomplete: " ",
  width: 20
};

class Publisher {
  constructor(context) {
    this.context = context;
  }

  createProgressBar(fileName, size) {
    _builderUtil().log.info({
      file: fileName,
      provider: this.providerName
    }, "uploading");

    if (this.context.progress == null || size < 512 * 1024) {
      return null;
    }

    return this.context.progress.createBar(`${" ".repeat(_log().PADDING + 2)}[:bar] :percent :etas | ${_chalk().default.green(fileName)} to ${this.providerName}`, {
      total: size,
      ...progressBarOptions
    });
  }

  createReadStreamAndProgressBar(file, fileStat, progressBar, reject) {
    const fileInputStream = (0, _fsExtra().createReadStream)(file);
    fileInputStream.on("error", reject);

    if (progressBar == null) {
      return fileInputStream;
    } else {
      const progressStream = new (_builderUtilRuntime().ProgressCallbackTransform)(fileStat.size, this.context.cancellationToken, it => progressBar.tick(it.delta));
      progressStream.on("error", reject);
      return fileInputStream.pipe(progressStream);
    }
  }

}

exports.Publisher = Publisher;

class HttpPublisher extends Publisher {
  constructor(context, useSafeArtifactName = false) {
    super(context);
    this.context = context;
    this.useSafeArtifactName = useSafeArtifactName;
  }

  async upload(task) {
    const fileName = (this.useSafeArtifactName ? task.safeArtifactName : null) || (0, _path.basename)(task.file);

    if (task.fileContent != null) {
      await this.doUpload(fileName, task.arch || _builderUtil().Arch.x64, task.fileContent.length, it => it.end(task.fileContent));
      return;
    }

    const fileStat = await (0, _fsExtra().stat)(task.file);
    const progressBar = this.createProgressBar(fileName, fileStat.size);
    await this.doUpload(fileName, task.arch || _builderUtil().Arch.x64, fileStat.size, (request, reject) => {
      if (progressBar != null) {
        // reset (because can be called several times (several attempts)
        progressBar.update(0);
      }

      return this.createReadStreamAndProgressBar(task.file, fileStat, progressBar, reject).pipe(request);
    }, task.file);
  }

}

exports.HttpPublisher = HttpPublisher;

function getCiTag() {
  const tag = process.env.TRAVIS_TAG || process.env.APPVEYOR_REPO_TAG_NAME || process.env.CIRCLE_TAG || process.env.BITRISE_GIT_TAG || process.env.CI_BUILD_TAG;
  return tag != null && tag.length > 0 ? tag : null;
} 
// __ts-babel@6.0.4
//# sourceMappingURL=publisher.js.map