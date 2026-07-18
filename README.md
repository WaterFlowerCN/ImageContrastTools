# 图片查重工具


[![Electron](https://img.shields.io/badge/Electron-30.5.1-blue)](https://www.electronjs.org)
[![Vue3](https://img.shields.io/badge/Vue-3.41-green)](https://vuejs.org)

基于Electron的跨平台图片查重工具，支持文件夹扫描、重复文件识别与可视化处理。

## ✨ 功能特性
- 文件夹递归扫描（支持常见图片格式：JPG/PNG/WebP/AVIF）
- 基于内容哈希（MD5 + Sharp 缩放）的精确重复图片识别
- 并发哈希计算加速，大幅提升查重速度
- 可视化结果展示（相似图片分组对比）
- 智能删除选择（按文件大小、文件名长度自动筛选）
- 一键删除/移动重复文件（回收站/永久删除/移至文件夹）
- 损坏图片自动跳过，避免误判为重复

## 📦 预编译版本

为Windows（x64）用户提供开箱即用的可执行版本，无需手动编译即可快速使用

## 🚀 快速开始

### 环境要求
- Node.js v18+（推荐v22.12）
- npm v9+（推荐v10.9）

### 安装指南
```bash
# 克隆仓库
git clone https://github.com/WaterFlowerCN/ImageContrastTools.git
cd ImageContrastTools

# 安装依赖
npm install

# 开发模式运行
npm run dev

# 生产环境打包（支持Windows/macOS/Linux）
npm run build