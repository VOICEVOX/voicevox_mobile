// FIXME: 本番ビルドではbase.jsonを置き換える
import engineManifestBase from "./manifestAssets/base.json";
import termsOfService from "./manifestAssets/termsOfService.md?raw";
import { ApiProvider } from ".";
import { EngineManifest, EngineManifestFromJSON } from "@/openapi";

const infoProvider: ApiProvider = ({ corePlugin }) => {
  let engineManifest: EngineManifest | undefined;

  return {
    async versionVersionGet() {
      return await corePlugin.getVersion().then((res) => res.value);
    },
    async engineManifestEngineManifestGet() {
      if (!engineManifest) {
        engineManifest = EngineManifestFromJSON({
          ...engineManifestBase,
          icon: await fetch("/icon.png")
            .then((res) => res.blob())
            .then((blob) => {
              const reader = new FileReader();
              reader.readAsDataURL(blob);
              return new Promise<string>((resolve) => {
                reader.onloadend = () => {
                  if (typeof reader.result === "string") {
                    resolve(reader.result);
                  }
                };
              });
            }),
          updateInfos: await fetch("/updateInfos.json").then((res) =>
            res.json()
          ),
          terms_of_service: termsOfService,
          dependency_licenses: await fetch("/licenses.json").then((res) =>
            res.json()
          ),
        });
      }

      return engineManifest;
    },
    async supportedDevicesSupportedDevicesGet() {
      return JSON.parse((await corePlugin.getSupportedDevicesJson()).value);
    },
  };
};

export default infoProvider;
