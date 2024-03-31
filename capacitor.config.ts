/// <reference types="@capacitor/splash-screen" />
import { networkInterfaces } from "os";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { CapacitorConfig } from "@capacitor/cli";

let keystorePath = "";
let keystorePassword = "";
let keystoreAlias = "";
let keystoreAliasPassword = "";
if (fs.existsSync("./android/build-options.json")) {
  const buildOptions = JSON.parse(
    fs.readFileSync("./android/build-options.json", "utf-8")
  );
  keystorePath = path.resolve(buildOptions.keystorePath);
  keystorePassword = buildOptions.keystorePassword;
  keystoreAlias = buildOptions.keystoreAlias;
  keystoreAliasPassword = buildOptions.keystoreAliasPassword;
}

const config: CapacitorConfig = {
  appId: "jp.hiroshiba.voicevox",
  appName: "VOICEVOX",
  webDir: "dist",
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
    },
  },
  android: {
    buildOptions: {
      keystorePath,
      keystorePassword,
      keystoreAlias,
      keystoreAliasPassword,
    },
  },
};

if (process.env.CAPACITOR_MODE === "serve") {
  dotenv.config();
  let address = process.env.CAPACITOR_ADDRESS;
  if (!address) {
    const nets = networkInterfaces();
    const net = Object.entries(nets)
      .flatMap(([name, nets]) =>
        name.includes("WSL") ||
        name.includes("VirtualBox") ||
        name.includes("Loopback")
          ? []
          : nets
      )
      .find(
        (net) =>
          net &&
          net.family === "IPv4" &&
          !net.internal &&
          (net.address.startsWith("192.168.") ||
            net.address.startsWith("172.16.") ||
            net.address.startsWith("10."))
      );
    if (!net)
      throw new Error(
        "ネットワークを選択できませんでした。.envにCAPACITOR_ADDRESSを設定してください。"
      );
    address = net.address;
  }
  config.server = {
    url: `http://${address}:5173`,
    cleartext: true,
  };
}

export default config;
