import { registerPlugin } from "@capacitor/core";

export type VoicevoxCorePlugin = {
  getVersion: () => Promise<{ value: string }>;
  getSupportedDevicesJson: () => Promise<{ value: string }>;
  getMetasJson: () => Promise<{ value: string }>;

  initialize: () => Promise<void>;

  loadModel: (obj: { speakerId: number }) => Promise<void>;
  isModelLoaded: (obj: { speakerId: number }) => Promise<{ value: boolean }>;

  audioQuery: (obj: {
    text: string;
    speakerId: number;
  }) => Promise<{ value: string }>;
  accentPhrases: (obj: {
    text: string;
    speakerId: number;
  }) => Promise<{ value: string }>;
};

const loadPlugin = () => {
  const corePlugin = registerPlugin<VoicevoxCorePlugin>("VoicevoxCore");

  // @ts-expect-error 定義時だけは無視する
  window.plugins = {
    voicevoxCore: corePlugin,
  };
};

export default loadPlugin;