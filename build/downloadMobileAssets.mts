/**
 * voicevox/voicevox_coreのmodelディレクトリをダウンロードしてZip圧縮し、
 * またOpenJTalkの辞書をzip圧縮するスクリプト。
 */
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { runCommand, __dirname } from "./utils.mjs";

let sevenZipCommand: string;
switch (process.platform) {
  case "win32": {
    sevenZipCommand = "7za.exe";
    break;
  }
  case "linux": {
    sevenZipCommand = "7zzs";
    break;
  }
  case "darwin": {
    sevenZipCommand = "7zz";
    break;
  }
  default: {
    throw new Error("Unsupported platform");
  }
}
const sevenZip = path.resolve(__dirname, "vendored", "7z", sevenZipCommand);

// FIXME: ダミーモデルを使っているので製品版に変える
const downloadAndCompressModel = async () => {
  const modelZipPath = path.resolve(
    __dirname,
    "../android/app/src/main/assets/model.zip"
  );
  if (fs.existsSync(modelZipPath)) {
    console.log("model archive already exists. skipping download.");
    console.log(
      "If you want to download the latest model, delete the model.zip and run this script again."
    );
    return;
  }
  if (fs.existsSync(path.resolve(__dirname, "vendored/voicevox_core"))) {
    await runCommand(
      "git",
      "-C",
      __dirname + "/vendored/voicevox_core",
      "pull",
      "origin",
      "main"
    );
  } else {
    await runCommand(
      "git",
      "clone",
      "https://github.com/VOICEVOX/voicevox_core.git",
      __dirname + "/vendored/voicevox_core",
      "--depth",
      "1"
    );
  }
  await runCommand(
    sevenZip,
    "a",
    "-tzip",
    modelZipPath,
    __dirname + "/vendored/voicevox_core/model/*",
    __dirname + "/vendored/voicevox_core/LICENSE"
  );
  await createFileHash(modelZipPath);

  // TODO: iOSにコピーする処理を追加する
};

const downloadAndCompressOpenJTalkDict = async () => {
  const dictZipPath = path.resolve(
    __dirname,
    "../android/app/src/main/assets/openjtalk_dict.zip"
  );
  if (fs.existsSync(dictZipPath)) {
    console.log("dict archive already exists. skipping download.");
    console.log(
      "If you want to create the dict archive again, delete the openjtalk_dict.zip and run this script again."
    );
    return;
  }

  // node-fetchはESModuleなので、import()で読み込む
  const { default: fetch } = await import("node-fetch");

  const dictUrl =
    "https://github.com/r9y9/open_jtalk/releases/download/v1.11.1/open_jtalk_dic_utf_8-1.11.tar.gz";
  const dictPath = path.resolve(
    __dirname,
    "vendored",
    "open_jtalk_dic_utf_8-1.11.tar.gz"
  );

  const response = await fetch(dictUrl);
  if (!response.ok) {
    throw new Error("Failed to download OpenJTalk dict");
  }
  const buffer = await response.arrayBuffer();
  await fs.promises.writeFile(dictPath, Buffer.from(buffer));

  await runCommand(
    sevenZip,
    "x",
    dictPath,
    "-o" + __dirname + "/vendored",
    "-y"
  );
  await runCommand(
    sevenZip,
    "x",
    __dirname + "/vendored/open_jtalk_dic_utf_8-1.11.tar",
    "-o" + __dirname + "/vendored",
    "-y"
  );

  await runCommand(
    sevenZip,
    "a",
    "-tzip",
    dictZipPath,
    __dirname + "/vendored/open_jtalk_dic_utf_8-1.11/*",
    "-y"
  );
  await createFileHash(dictZipPath);

  // FIXME: iOSにコピーする処理を追加する
};

const createFileHash = async (filePath: string) => {
  const hash = crypto.createHash("sha256");
  await new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .on("data", (data) => hash.update(data))
      .on("end", resolve)
      .on("error", reject);
  });
  await fs.promises.writeFile(
    filePath + ".sha256",
    hash.digest("hex"),
    "utf-8"
  );
};

downloadAndCompressModel();
downloadAndCompressOpenJTalkDict();
