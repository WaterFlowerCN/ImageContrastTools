// afterPack.cjs - 构建后清理脚本，用于减小安装包体积
// 删除不需要的语言包，只保留中文和英文
// 删除跨平台无用的文件

const fs = require("fs");
const path = require("path");

exports.default = async function (context) {
  const { appOutDir, electronPlatformName } = context;

  // 1. 清理 Locales：只保留中文和英文
  const localesDir = path.join(appOutDir, "locales");
  if (fs.existsSync(localesDir)) {
    const keepLocales = [
      "en-US.pak",
      "zh-CN.pak",
      "zh-TW.pak",
    ];
    const files = fs.readdirSync(localesDir);
    let deletedCount = 0;
    for (const file of files) {
      if (!keepLocales.includes(file)) {
        fs.unlinkSync(path.join(localesDir, file));
        deletedCount++;
      }
    }
    console.log(`[afterPack] 清理了 ${deletedCount} 个语言包文件`);
  }

  // 2. 删除不需要的 Chromium 许可证文件（15MB）
  const licenseFile = path.join(appOutDir, "LICENSES.chromium.html");
  if (fs.existsSync(licenseFile)) {
    const size = fs.statSync(licenseFile).size;
    fs.unlinkSync(licenseFile);
    console.log(`[afterPack] 已删除 LICENSES.chromium.html (${(size / 1024 / 1024).toFixed(1)}MB)`);
  }

  // 保存资源大小日志
  console.log(`[afterPack] 构建完成: ${appOutDir}`);
};
