import { VoicevoxCorePlugin } from "../plugin";
import infoProvider from "./info";
import speakerProvider from "./speaker";
import dictProvider from "./dict";
import { DefaultApi, DefaultApiInterface } from "@/openapi";

let api: DefaultApi | undefined;
export let coreBasedApi: DefaultApiInterface | undefined;
export type ApiProvider = (deps: {
  corePlugin: VoicevoxCorePlugin;
}) => Partial<DefaultApiInterface>;

const loadApi = () => {
  api = new DefaultApi();
  const corePlugin = window.plugins?.voicevoxCore;
  if (!corePlugin) throw new Error("assert: corePlugin != null");
  let isCoreInitialized = false;
  corePlugin.initialize().then(() => {
    isCoreInitialized = true;
  });

  // コアベースのOpenAPI Connectorライクなオブジェクト。
  // - コアベースの実装がある場合は呼び出し、
  // - 本家OpenAPI Connectorに存在している、かつコアベースの実装がない場合はNot implementedエラーを投げ、
  // - 本家OpenAPI Connectorに存在していない場合はUnknown APIエラーを投げる
  coreBasedApi = new Proxy(
    [infoProvider, speakerProvider, dictProvider].reduce(
      (acc, provider) => ({ ...acc, ...provider({ corePlugin }) }),
      {}
    ) as Partial<DefaultApiInterface>,
    {
      get: (base, key: keyof DefaultApiInterface) => {
        if (!api) throw new Error("assert: api != null");
        if (!isCoreInitialized) throw new Error("Core is not initialized");
        if (key in base) {
          window.electron.logInfo(`Call coreBasedApi.${String(key)}`);
          return base[key];
        } else if (key in api) {
          throw new Error(`Not implemented: ${String(key)}`);
        } else {
          throw new Error(`Unknown API: ${String(key)}`);
        }
      },
    }
  ) as DefaultApiInterface;
};

export default loadApi;
