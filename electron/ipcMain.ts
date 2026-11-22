import { ipcMain, dialog, shell } from "electron";
import fs from "fs";
import crypto from 'crypto'
import sharp from 'sharp'

// Windows 下超过 260 字符的路径，sharp/libvips 这类 C 库无法直接打开，
// 需要加 \\?\ 前缀。Node 的 fs 自带长路径支持，这里统一给 sharp 用。
function toExtendedPath(filePath: string): string {
  if (process.platform !== "win32") return filePath;
  if (filePath.startsWith("\\\\?\\")) return filePath;
  if (filePath.length < 240) return filePath;
  if (/^[a-zA-Z]:\\/.test(filePath)) return "\\\\?\\" + filePath;
  return filePath;
}

// 监听来自渲染进程的请求
ipcMain.handle("showFolderDialog", async () => {
  return new Promise((resolve, reject) => {
    dialog
      .showOpenDialog({
        properties: ["openDirectory"],
      })
      .then((result) => {
        resolve(result.filePaths);
      })
      .catch((err) => {
        console.log(err);
        reject(err);
      });
  });
});

ipcMain.handle("getImageDimensions", async ({}, filePath: string) => {
  try {
    const metadata = await sharp(toExtendedPath(filePath)).metadata();
    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
    };
  } catch (err: any) {
    console.log(err.message);
    return { width: 0, height: 0, error: true };
  }
});

// 批量读取尺寸：几万张图逐个 invoke 会产生几万次 IPC 往返，
// 这里一次处理一批，主进程内部并发解码，显著减少开销。
ipcMain.handle("getImageDimensionsBatch", async ({}, filePaths: string[]) => {
  const CONCURRENCY = 8;
  const results: { width: number; height: number; error?: boolean }[] = new Array(filePaths.length);
  let cursor = 0;
  async function worker() {
    while (cursor < filePaths.length) {
      const index = cursor++;
      try {
        const metadata = await sharp(toExtendedPath(filePaths[index])).metadata();
        results[index] = { width: metadata.width || 0, height: metadata.height || 0 };
      } catch {
        results[index] = { width: 0, height: 0, error: true };
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, filePaths.length) }, worker));
  return results;
});

ipcMain.handle("moveDustbin", ({}, fileList: string[]) => {
  return Promise.all(fileList.map((path) => shell.trashItem(path)));
});

ipcMain.handle("scaleHash", ({},filePath: string) => {
  return new Promise((resolve) => {
    fs.promises.readFile(toExtendedPath(filePath)).then((buffer) => {
      sharp(buffer)
        .resize(32, 32)
        .grayscale()
        .raw()
        .toBuffer()
        .then((imageBuffer:any) => {
          const hash = crypto.createHash("md5");
          hash.update(imageBuffer);
          const hex = hash.digest("hex");
          resolve(hex);
        })
        .catch((err:any) => {
          console.log(err.message);
          resolve("badImg_" + filePath);
        });
    }).catch((err:any) => {
      console.log(err.message);
      resolve("badImg_" + filePath);
    });
  });
});
