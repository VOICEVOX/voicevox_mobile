import { coreBasedApi } from "@/mobile";
import { Configuration, DefaultApi, DefaultApiInterface } from "@/openapi";

export interface IEngineConnectorFactory {
  // FIXME: hostという名前の時点で外部APIに接続するという知識が出てきてしまっているので
  // Factory自体に型パラメータを付けて、接続方法だったり設定、IDみたいな名前で表現する
  instance: (host: string) => DefaultApiInterface;
}

const OpenAPIEngineConnectorFactoryImpl = (): IEngineConnectorFactory => {
  const instanceMapper: Record<string, DefaultApiInterface> = {};
  return {
    instance: (host: string) => {
      const cached = instanceMapper[host];
      if (cached !== undefined) {
        return cached;
      }
      let api;
      if (
        import.meta.env.VITE_TARGET === "mobile" &&
        // httpで始まる場合は外部APIとして扱う
        !host.startsWith("http")
      ) {
        if (!coreBasedApi) throw new Error("assert: coreBasedApi != null");
        api = coreBasedApi;
      } else {
        api = new DefaultApi(new Configuration({ basePath: host }));
      }

      instanceMapper[host] = api;
      return api;
    },
  };
};

export const OpenAPIEngineConnectorFactory =
  OpenAPIEngineConnectorFactoryImpl();
