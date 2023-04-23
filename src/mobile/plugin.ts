import { registerPlugin } from "@capacitor/core";

export type VoicevoxCorePlugin = {
  getVersion: () => Promise<{ value: string }>;
  getMetasJson: () => Promise<{ value: string }>;
  getSupportedDevicesJson: () => Promise<{ value: string }>;
};

const loadPlugin = () => {
  const corePlugin = registerPlugin<VoicevoxCorePlugin>("VoicevoxCore");

  // @ts-expect-error 定義時だけは無視する
  window.plugins = {
    voicevoxCore: corePlugin,
  };
};

export default loadPlugin;
