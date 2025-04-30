// // import { Worker, isMainThread, parentPort } from 'worker_threads';
// import { formatImg, diff } from './imageContrast'
// // 子线程逻辑
// self.onmessage = async function (event) {
//     const { img1Path, img2Path } = event.data
//     const img1Data = await formatImg(img1Path);
//     const img2Data = await formatImg(img2Path);
//     if (img1Data && img2Data) {
//         const similary = await diff(img1Data, img2Data);
//         self.postMessage(similary);
//     }
//     // parentPort.postMessage(result); // 将对比结果返回主线程
// }
