import fs from "node:fs";
import path from "node:path";
import trash from "trash";
import { ImageItem } from "../types/interface";
export function getImageFiles(directory: string): string[] {
  let imageFiles: string[] = [];
  try {
    const files = fs.readdirSync(directory);
    for (let file of files) {
      const filePath = path.join(directory, file);
      const stats = fs.statSync(filePath);
      if (stats.isFile()) {
        const extname = path.extname(file).toLowerCase();
        if ([".jpg", ".jpeg", ".png"].includes(extname)) {
          imageFiles.push(filePath);
        }
      } else if (stats.isDirectory()) {
        // 递归调用自身，处理子目录
        imageFiles = imageFiles.concat(getImageFiles(filePath));
      }
    }
  } catch (err) {
    console.error(`Error reading directory ${directory}:`, err);
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
export function moveDustbin(fileList: string[]) {
  return trash(fileList);
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
