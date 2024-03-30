import { SplashScreen } from "@capacitor/splash-screen";
import { getConfigManager } from "./capacitorConfig";
import { defaultEngine } from "@/backend/browser/contract";

import { IpcSOData } from "@/type/ipc";
import {
  defaultHotkeySettings,
  defaultToolbarButtonSetting,
  configSchema,
  EngineId,
  EngineSettingType,
  EngineSettings,
  HotkeySettingType,
  Sandbox,
  ThemeConf,
} from "@/type/preload";
import {
  ContactTextFileName,
  HowToUseTextFileName,
  OssCommunityInfosFileName,
  OssLicensesJsonFileName,
  PolicyTextFileName,
  PrivacyPolicyTextFileName,
  QAndATextFileName,
  UpdateInfosJsonFileName,
} from "@/type/staticResources";

// TODO: base pathを設定できるようにするか、ビルド時埋め込みにする
const toStaticPath = (fileName: string) => `/${fileName}`;

/**
 * スマホ版のSandBox実装
 * src/type/preload.tsのSandboxを変更した場合は、interfaceに追従した変更が必要
 * スマホ版では利用しない場合は、メソッドを追加して throw new Error() する
 */
export const api: Sandbox = {
  getAppInfos() {
    const appInfo = {
      name: import.meta.env.VITE_APP_NAME,
      version: import.meta.env.VITE_APP_VERSION,
    };
    return Promise.resolve(appInfo);
  },
  getHowToUseText() {
    return fetch(toStaticPath(HowToUseTextFileName)).then((v) => v.text());
  },
  getPolicyText() {
    return fetch(toStaticPath(PolicyTextFileName)).then((v) => v.text());
  },
  getOssLicenses() {
    return fetch(toStaticPath(OssLicensesJsonFileName)).then((v) => v.json());
  },
  getUpdateInfos() {
    return fetch(toStaticPath(UpdateInfosJsonFileName)).then((v) => v.json());
  },
  getOssCommunityInfos() {
    return fetch(toStaticPath(OssCommunityInfosFileName)).then((v) => v.text());
  },
  getQAndAText() {
    return fetch(toStaticPath(QAndATextFileName)).then((v) => v.text());
  },
  getContactText() {
    return fetch(toStaticPath(ContactTextFileName)).then((v) => v.text());
  },
  getPrivacyPolicyText() {
    return fetch(toStaticPath(PrivacyPolicyTextFileName)).then((v) => v.text());
  },
  getAltPortInfos() {
    // NOTE: ブラウザ版ではサポートされていません
    return Promise.resolve({});
  },
  showAudioSaveDialog(obj: { title: string; defaultPath?: string }) {
    return new Promise((resolve, reject) => {
      if (obj.defaultPath == undefined) {
        reject(
          // storeやvue componentからdefaultPathを設定していなかったらrejectされる
          new Error(
            "ブラウザ版ではファイルの保存機能が一部サポートされていません。"
          )
        );
      } else {
        resolve(obj.defaultPath);
      }
    });
  },
  showTextSaveDialog(obj: { title: string; defaultPath?: string }) {
    return new Promise((resolve, reject) => {
      if (obj.defaultPath == undefined) {
        reject(
          // storeやvue componentからdefaultPathを設定していなかったらrejectされる
          new Error(
            "ブラウザ版ではファイルの保存機能が一部サポートされていません。"
          )
        );
      } else {
        resolve(obj.defaultPath);
      }
    });
  },
  showSaveDirectoryDialog() {
    throw new Error("Not supported: showSaveDirectoryDialog");
  },
  showVvppOpenDialog(obj: { title: string; defaultPath?: string }) {
    throw new Error(
      `not implemented: showVvppOpenDialog, request: ${JSON.stringify(obj)}`
    );
  },
  showOpenDirectoryDialog() {
    throw new Error("Not supported: showOpenDirectoryDialog");
  },
  showProjectSaveDialog(obj: { title: string; defaultPath?: string }) {
    return new Promise((resolve, reject) => {
      if (obj.defaultPath == undefined) {
        reject(
          // storeやvue componentからdefaultPathを設定していなかったらrejectされる
          new Error(
            "スマホ版ではファイルの保存機能が一部サポートされていません。"
          )
        );
      } else {
        resolve(obj.defaultPath);
      }
    });
  },
  showProjectLoadDialog(/* obj: { title: string } */) {
    throw new Error("スマホ版では現在ファイルの読み込みをサポートしていません");
  },
  showMessageDialog(obj: {
    type: "none" | "info" | "error" | "question" | "warning";
    title: string;
    message: string;
  }) {
    window.alert(`${obj.title}\n${obj.message}`);
    // NOTE: どの呼び出し元も、return valueを使用していないので雑に対応している
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return Promise.resolve({} as any);
  },
  showQuestionDialog(obj: {
    type: "none" | "info" | "error" | "question" | "warning";
    title: string;
    message: string;
    buttons: string[];
    cancelId?: number;
    defaultId?: number;
  }) {
    // FIXME
    // TODO: 例えば動的にdialog要素をDOMに生成して、それを表示させるみたいのはあるかもしれない
    throw new Error(
      `Not implemented: showQuestionDialog, request: ${JSON.stringify(obj)}`
    );
  },
  showImportFileDialog(/* obj: { title: string } */) {
    throw new Error("スマホ版では現在ファイルの読み込みをサポートしていません");
  },
  writeFile(obj: { filePath: string; buffer: ArrayBuffer }) {
    throw new Error(
      "Not implemented: writeFile, request: " + JSON.stringify(obj)
    );
  },
  readFile(/* obj: { filePath: string } */) {
    throw new Error("Not implemented: readFile");
  },
  isAvailableGPUMode() {
    // TODO: WebAssembly版をサポートする時に実装する
    // FIXME: canvasでWebGLから調べたり、WebGPUがサポートされているかを調べたりで判断は出来そう
    return Promise.resolve(false);
  },
  isMaximizedWindow() {
    // NOTE: UIの表示状態の制御のためだけなので固定値を返している
    return Promise.resolve(true);
  },
  onReceivedIPCMsg<T extends keyof IpcSOData>(
    channel: T,
    listener: (_: unknown, ...args: IpcSOData[T]["args"]) => void
  ) {
    window.addEventListener("message", (event) => {
      if (event.data.channel == channel) {
        listener(event.data.args);
      }
    });
  },
  closeWindow() {
    throw new Error(`Not supported: closeWindow`);
  },
  minimizeWindow() {
    throw new Error(`Not supported: minimizeWindow`);
  },
  maximizeWindow() {
    throw new Error(`Not supported: maximizeWindow`);
  },
  /* eslint-disable no-console */ // ログの吐き出し先は console ぐらいしかないので、ここでは特例で許可している
  logError(...params: unknown[]) {
    console.error(...params);
    return;
  },
  logWarn(...params: unknown[]) {
    console.warn(...params);
    return;
  },
  logInfo(...params: unknown[]) {
    console.info(...params);
    return;
  },
  openLogDirectory() {
    throw new Error(`Not supported: openLogDirectory`);
  },
  /* eslint-enable no-console */
  engineInfos() {
    return Promise.resolve([defaultEngine]);
  },
  restartEngine(/* engineId: EngineId */) {
    throw new Error(`Not supported: restartEngine`);
  },
  openEngineDirectory(/* engineId: EngineId */) {
    throw new Error(`Not supported: openEngineDirectory`);
  },
  async hotkeySettings(newData?: HotkeySettingType) {
    type HotkeySettingType = ReturnType<
      typeof configSchema["parse"]
    >["hotkeySettings"];
    if (newData != undefined) {
      const hotkeySettings = (await this.getSetting(
        "hotkeySettings"
      )) as HotkeySettingType;
      const hotkeySetting = hotkeySettings.find(
        (hotkey) => hotkey.action == newData.action
      );
      if (hotkeySetting != undefined) {
        hotkeySetting.combination = newData.combination;
      }
      await this.setSetting("hotkeySettings", hotkeySettings);
    }
    return this.getSetting("hotkeySettings") as Promise<HotkeySettingType>;
  },
  checkFileExists() {
    throw new Error(`Not supported: checkFileExists`);
  },
  changePinWindow() {
    throw new Error(`Not supported: changePinWindow`);
  },
  getDefaultHotkeySettings() {
    return Promise.resolve(defaultHotkeySettings);
  },
  getDefaultToolbarSetting() {
    return Promise.resolve(defaultToolbarButtonSetting);
  },
  setNativeTheme(/* source: NativeThemeType */) {
    // TODO: Impl
    return;
  },
  async theme(newData?: string) {
    if (newData != undefined) {
      await this.setSetting("currentTheme", newData);
      return;
    }
    // NOTE: Electron版では起動時にテーマ情報が必要なので、
    //       この実装とは違って起動時に読み込んだキャッシュを返すだけになっている。
    return Promise.all(
      // FIXME: themeファイルのいい感じのパスの設定
      ["/themes/default.json", "/themes/dark.json"].map((url) =>
        fetch(url).then((res) => res.json())
      )
    )
      .then((v) => ({
        currentTheme: "Default",
        availableThemes: v,
      }))
      .then((v) =>
        this.getSetting("currentTheme").then(
          (currentTheme) =>
            ({
              ...v,
              currentTheme,
            } as { currentTheme: string; availableThemes: ThemeConf[] })
        )
      );
  },
  vuexReady() {
    // 1フレーム遅らせることで、真っ白の画面が表示されるのを防ぐ。
    requestAnimationFrame(() => {
      SplashScreen.hide();
    });
  },
  async getSetting(key) {
    const configManager = await getConfigManager();
    return configManager.get(key);
  },
  async setSetting(key, newValue) {
    const configManager = await getConfigManager();
    configManager.set(key, newValue);
    return newValue;
  },
  async setEngineSetting(engineId: EngineId, engineSetting: EngineSettingType) {
    const engineSettings = (await this.getSetting(
      "engineSettings"
    )) as EngineSettings;
    engineSettings[engineId] = engineSetting;
    await this.setSetting("engineSettings", engineSettings);
    return;
  },
  installVvppEngine(/* path: string */) {
    throw new Error(`Not supported: installVvppEngine`);
  },
  uninstallVvppEngine(/* engineId: EngineId */) {
    throw new Error(`Not supported: uninstallVvppEngine`);
  },
  validateEngineDir(/* engineDir: string */) {
    throw new Error(`Not supported: validateEngineDir`);
  },
  async reloadApp(obj: { isMultiEngineOffMode: boolean }) {
    location.search = `?isMultiEngineOffMode=${obj.isMultiEngineOffMode}`;
    location.reload();
  },
};
