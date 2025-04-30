import { ipcMain, dialog, shell } from "electron";
import fs from "fs";
import crypto from 'crypto'
import sharp from 'sharp'
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

ipcMain.handle("moveDustbin", ({}, fileList: string[]) => {
  return Promise.all(fileList.map((path) => shell.trashItem(path)));
});

ipcMain.handle("scaleHash", ({},filePath: string) => {
  return new Promise((resolve) => {
    const buffer = fs.readFileSync(filePath);
    sharp(buffer) // 使用Buffer而不是文件路径
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
        resolve("badImg");
      });
  });
});


