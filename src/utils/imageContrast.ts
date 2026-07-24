import fs from "fs";
// import { PNG } from "pngjs/browser";
import { ipcRenderer } from "electron";
import path from "path";
import dayjs from "dayjs";
import { formatFileSize } from "./utils.ts";
import { Ref } from "vue";
// import { Worker, isMainThread, parentPort } from 'worker_threads';

// import imageHash from 'image-hash'

export interface OrientedFile {
  name: string;
  src: string;
  size: string;
  originSize: number;
  createTime: string;
  width: number;
  height: number;
  orientation: "horizontal" | "vertical" | "square";
}

export async function classifyByOrientation(
  imgList: string[],
  cb: (num: number) => void,
  abortController: Ref<AbortController>
): Promise<{
  groups: { label: string; key: string; files: OrientedFile[] }[];
}> {
  const CONCURRENCY = 6;
  let completedCount = 0;
  const results: {
    orientation: "horizontal" | "vertical" | "square";
    filePath: string;
    width: number;
    height: number;
  }[] = [];

  async function processFile(filePath: string): Promise<void> {
    if (abortController.value.signal.aborted) return;
    const info = await ipcRenderer.invoke("getImageDimensions", filePath);
    if (abortController.value.signal.aborted) return;
    let orientation: "horizontal" | "vertical" | "square" = "square";
    if (info.width > info.height) {
      orientation = "horizontal";
    } else if (info.height > info.width) {
      orientation = "vertical";
    }
    results.push({ orientation, filePath, width: info.width, height: info.height });
    completedCount++;
    cb(completedCount);
  }

  // 并发池
  const executing = new Set<Promise<void>>();
  for (let i = 0; i < imgList.length; i++) {
    if (abortController.value.signal.aborted) break;
    const p = processFile(imgList[i]);
    executing.add(p);
    p.finally(() => executing.delete(p));
    if (executing.size >= CONCURRENCY) {
      await Promise.race(executing);
    }
  }
  await Promise.all(executing);

  const horizontal: OrientedFile[] = [];
  const vertical: OrientedFile[] = [];
  const square: OrientedFile[] = [];

  for (const item of results) {
    const stats = fs.statSync(item.filePath);
    const fileInfo: OrientedFile = {
      name: path.basename(item.filePath),
      src: item.filePath,
      size: formatFileSize(stats.size),
      originSize: stats.size,
      createTime: dayjs(stats.mtime).format("YYYY-MM-DD hh:mm:ss"),
      width: item.width,
      height: item.height,
      orientation: item.orientation,
    };
    if (item.orientation === "horizontal") horizontal.push(fileInfo);
    else if (item.orientation === "vertical") vertical.push(fileInfo);
    else square.push(fileInfo);
  }

  const groups = [
    { label: "横图", key: "horizontal", files: horizontal },
    { label: "竖图", key: "vertical", files: vertical },
    { label: "方图", key: "square", files: square },
  ].filter((g) => g.files.length > 0);

  return { groups };
}

export async function imageContrastV2(
  imgList: string[],
  cb: Function,
  abortController: Ref<AbortController>
) {
  const hash2file: any = {};
  const CONCURRENCY = 6; // 并发数
  let completedCount = 0;

  // 并发池：每次执行最多 CONCURRENCY 个任务
  async function processImage(filePath: string): Promise<void> {
    if (abortController.value.signal.aborted) return;
    const hash = await ipcRenderer.invoke("scaleHash", filePath);
    if (abortController.value.signal.aborted) return;
    if (hash2file[hash]) {
      hash2file[hash].push(filePath);
    } else {
      hash2file[hash] = [filePath];
    }
    completedCount++;
    cb(completedCount);
  }

  // 用并发池处理所有图片
  const executing = new Set<Promise<void>>();
  for (let i = 0; i < imgList.length; i++) {
    if (abortController.value.signal.aborted) break;
    const p = processImage(imgList[i]);
    executing.add(p);
    p.finally(() => executing.delete(p));
    if (executing.size >= CONCURRENCY) {
      await Promise.race(executing);
    }
  }
  // 等待剩余任务完成
  await Promise.all(executing);
  console.log(hash2file);
  const contrastImgList = [];
  for (let hash in hash2file) {
    const fileList = hash2file[hash];
    if (fileList.length > 1) {
      const newFileList = fileList.map((filePath: string) => {
        const stats = fs.statSync(filePath);
        return {
          name: path.basename(filePath),
          size: formatFileSize(stats.size),
          originSize: stats.size,
          src: filePath,
          createTime: dayjs(stats.mtime).format("YYYY-MM-DD hh:mm:ss"),
        };
      });
      contrastImgList.push(newFileList);
    }
  }
  return contrastImgList;
}
// export default async function imageContrast(imgList, cb) {
//   const result = [];
//   let num = 1;
//   const MAX_CONCURRENCY = 15;

//   for (let i = 0; i < imgList.length; i++) {
//     const children = [];
//     const img1Path = imgList[i];
//     const currentImgComparisons = [];

//     for (let j = i + 1; j < imgList.length; j++) {
//       const img2Path = imgList[j];
//       const workerTask = new Promise((resolve) => {
//         const worker = new Worker(
//           new URL("imagesDiffTask.js", import.meta.url),
//           { type: "module" }
//         );
//         worker.postMessage({ img1Path, img2Path });
//         worker.onmessage = function (event) {
//           num++;
//           console.log(num);
//           const similary = event.data;
//           if (similary > 90) {
//             children.push(img2Path);
//           }
//           worker.terminate(); // 终止 worker 以释放资源
//           resolve();
//         };
//       });
//       currentImgComparisons.push(workerTask);

//       // 当达到最大并发数时，等待这一批任务完成
//       if (
//         currentImgComparisons.length % MAX_CONCURRENCY === 0 ||
//         j === imgList.length - 1
//       ) {
//         await Promise.all(currentImgComparisons);
//         currentImgComparisons.length = 0; // 清空数组以准备下一批任务
//       }
//     }

//     result.push({
//       main: img1Path,
//       children,
//     });
//   }
//   return result;
// }
// export async function hashContrast(image1Path, image2Path) {
//   imageHash.hash(image1Path, 8, true, (err, hash1) => {
//     if (err) console.error(err);
//     console.log("Image 1 Hash:", hash1);

//     imageHash.hash(image2Path, 8, true, (err, hash2) => {
//       if (err) console.error(err);
//       console.log("Image 2 Hash:", hash2);

//       if (hash1 === hash2) {
//         console.log("这两张图片的哈希值相同，可能内容相似");
//       } else {
//         console.log("这两张图片的哈希值不同");
//       }
//     });
//   });
// }
// export async function thread(img1Path, img2Path) {
//   const img1Data = await formatImg(img1Path);
//   const img2Data = await formatImg(img2Path);
//   diff(img1Data, img2Data);
// }
// export async function diff(img1Data, img2Data) {
//   const { width: width, height: height } = img1Data;
//   const { width: width2, height: height2 } = img2Data;
//   // console.log(width, height)
//   const diff = new PNG({ width, height });
//   try {
//     const numDiffPixels = pixelmatch(
//       img1Data.data,
//       img2Data.data,
//       diff.data,
//       width,
//       height,
//       { threshold: 0.1 }
//     );
//     const totalPix = width * height;
//     const samePix = totalPix - numDiffPixels;
//     const similary = parseFloat(((samePix / totalPix) * 100).toFixed(2));
//     return similary;
//     // fs.writeFileSync('diff.png', PNG.sync.write(diff));
//   } catch (error) {
//     // console.log(error.message);
//     return false;
//   }
// }
// 格式化图片
// export async function formatImg(imgPath: string) {
//   try {
//     const pixel = 32;
//     const suffix = imgPath.split(".").pop()?.toLowerCase() || "";
//     if (["jpg", "jpeg"].includes(suffix)) {
//       return PNG.sync.read(
//         await sharp(imgPath).resize(pixel).toFormat("png").toBuffer()
//       );
//     } else if (suffix === "png") {
//       return PNG.sync.read(await sharp(imgPath).resize(pixel).toBuffer());
//     } else {
//       return false;
//     }
//   } catch (error) {
//     // console.log(error.message, imgPath)
//   }
// }
