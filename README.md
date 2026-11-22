# 图片查重工具

[![Electron](https://img.shields.io/badge/Electron-39.8.10-blue)](https://www.electronjs.org)
[![Vue3](https://img.shields.io/badge/Vue-3.4-green)](https://vuejs.org)

基于 Electron 的跨平台图片查重与分类工具，支持文件夹扫描、重复文件识别、按方向分类与可视化处理。

当前版本：**1.0.4**

## ✨ 功能特性
- 文件夹递归扫描（支持 JPG/JPEG/PNG/WebP/AVIF）
- 基于内容哈希（MD5 + Sharp 缩放）的精确重复图片识别
- 并发哈希计算加速，大幅提升查重速度
- 按方向分类：自动区分横图、竖图、方图
- 结果分页浏览（每页 100 张），大目录不再卡顿
- 异步复制 + 实时进度条，支持复制后删除原文件
- 兼容超长路径（Windows 260 字符限制）
- 可视化结果展示（相似图片分组对比）
- 智能删除选择（按文件大小、文件名长度自动筛选）
- 一键删除/移动重复文件（回收站/永久删除/移至文件夹）
- 损坏图片自动跳过，避免误判为重复

## 📦 预编译版本

为 Windows（x64）用户提供开箱即用的便携版，无需手动编译即可快速使用。

## 🚀 快速开始

### 环境要求
- Node.js v18+（推荐 v22.12）
- npm v9+（推荐 v10.9）

### 安装指南
```bash
# 克隆仓库
git clone https://github.com/WaterFlowerCN/ImageContrastTools.git
cd ImageContrastTools

# 安装依赖
npm install

# 开发模式运行
npm run dev

# 生产环境打包（支持 Windows/macOS/Linux）
npm run build
```