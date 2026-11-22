import fs from "node:fs";
import path from "node:path";
import { ImageItem } from "../types/interface";
export function getImageFiles(directory: string): string[] {
  const imageFiles: string[] = [];
  const IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".webp", ".avif"];
  const stack: string[] = [directory];

  const pushIfImage = (filePath: string, fileName: string) => {
    if (IMAGE_EXTS.includes(path.extname(fileName).toLowerCase())) {
      imageFiles.push(filePath);
    }
  };

  while (stack.length) {
    const dir = stack.pop()!;
    let entries: fs.Dirent[];
    try {
      // withFileTypes 直接返回文件类型，避免对每个文件再 statSync 一次
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (err) {
      console.error(`Error reading directory ${dir}:`, err);
      continue;
    }
    for (const entry of entries) {
      const filePath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        stack.push(filePath);
      } else if (entry.isFile()) {
        pushIfImage(filePath, entry.name);
      } else if (entry.isSymbolicLink()) {
        // 只跟随文件链接，目录链接跳过，防止循环
        try {
          if (fs.statSync(filePath).isFile()) {
            pushIfImage(filePath, entry.name);
          }
        } catch {}
      }
    }
  }
  return imageFiles;
}

export function formatFileSize(bytes: number) {
  if (bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  const size = Math.floor(Math.log(bytes) / Math.log(1024)); // 获取文件大小的单位
  const value = (bytes / Math.pow(1024, size)).toFixed(2); // 格式化文件大小，保留两位小数

  return `${value} ${units[size]}`;
}
export function deleteFileList(fileList: string[]) {
  fileList.forEach((filePath) => {
    try {
      // 检查文件是否存在
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      } else {
      }
    } catch (error) {}
  });
}

export function getSelectedFilePath(fileList: ImageItem[][]) {
  const pathList: string[] = [];
  fileList.forEach((imgList: ImageItem[]) => {
    imgList.forEach((img) => {
      if (img.checked) {
        pathList.push(img.src);
      }
    });
  });
  return pathList;
}
export function closeDeep(data:object){
  return JSON.parse(JSON.stringify(data))
}
export function moveOtherFolder(fileList: string[], folderPath: string) {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
  
  fileList.forEach((srcFilePath:string) => {
    try {
      const fileName = path.basename(srcFilePath);
      const fileStat = fs.statSync(srcFilePath);
      if (fileStat.isFile()) {
        const dstFilePath = `${folderPath}/${fileName}`;
        if (!fs.existsSync(dstFilePath)) {
          fs.renameSync(srcFilePath, dstFilePath);
        } else {
          const extName = path.extname(srcFilePath);
          const newFileName = path.basename(srcFilePath, extName);
          const randNum = Math.floor(Math.random() * 9000) + 1000;
          const newDstFilePath = `${folderPath}/${newFileName}_${randNum}.${extName}`;
          fs.renameSync(srcFilePath, newDstFilePath);
        }
      }

    } catch (error) {
      throw error
    }
  });
  
}

export function delAllFiles(fileList:string[]){
  fileList.forEach((filePath:string) => {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        } else {
         
        }
    } catch (err) {
        throw err
    }
});
}
