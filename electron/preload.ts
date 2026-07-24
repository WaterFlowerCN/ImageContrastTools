import { ipcRenderer, contextBridge } from "electron";
import fs from "fs";
import sharp from "sharp";
import crypto from "crypto";
// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld("ipcRenderer", {
  // 订阅
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args;
    return ipcRenderer.on(channel, (event, ...args) =>
      listener(event, ...args)
    );
  },
  // 移除订阅
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args;
    return ipcRenderer.off(channel, ...omit);
  },
  // 接收订阅
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args;
    return ipcRenderer.send(channel, ...omit);
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args;
    return ipcRenderer.invoke(channel, ...omit);
  },
  showFolderDialog() {
    return ipcRenderer.invoke("showFolderDialog");
  },
  scaleHash(filePath: string) {
    return new Promise((resolve, reject) => {
      const buffer = fs.readFileSync(filePath);
      sharp(buffer) // 使用Buffer而不是文件路径
        .resize(32, 32)
        .grayscale()
        .raw()
        .toBuffer()
        .then((imageBuffer) => {
          const hash = crypto.createHash("md5");
          hash.update(imageBuffer);
          const hex = hash.digest("hex");
          resolve(hex);
        })
        .catch((err) => {
          console.log(err.message);
          reject("badImg");
        });
    });
  },
  getImageDimensions(filePath: string) {
    return new Promise((resolve) => {
      const buffer = fs.readFileSync(filePath);
      sharp(buffer)
        .metadata()
        .then((metadata) => {
          resolve({
            width: metadata.width || 0,
            height: metadata.height || 0,
          });
        })
        .catch((err) => {
          console.log(err.message);
          resolve({ width: 0, height: 0, error: true });
        });
    });
  },
  // You can expose other APTs you need here.
  // ...
});
