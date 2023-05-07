import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore import.metaでエラーが出るが、ts-node用の設定が入るので動く。（ts-expect-errorだとtsserverがNot usedのfalse positiveを出す）
export const __filename = fileURLToPath(import.meta.url).replace(/\\/g, "/");
export const __dirname = path.dirname(__filename);

export function runCommand(filePath: string, ...args: string[]) {
  const process = spawn(filePath, args, {
    stdio: ["ignore", "inherit", "inherit"]
  });
  return new Promise<void>((resolve, reject) => {
    process.on("exit", (code) => {
      if (code !== 0) {
        reject(
          new Error(`Failed to run ${filePath} ${args.join(" ")} : ${code}`)
        );
      } else {
        resolve();
      }
    });
  });
}
