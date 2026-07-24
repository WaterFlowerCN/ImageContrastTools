<template>
  <div class="container">
    <header class="drag">
      <div class="header-top">
        <div class="logo no-drag" @click="openDebug">
          <img src="../assets/images/img.png" width="24">
          图片查重分类工具
        </div>
        <div class="actions no-drag">
          <span class="about-btn" @click="showAbout = true">关于</span>
          <span class="close" @click="ipcRenderer.send('exitProcess')">x</span>
        </div>
      </div>
      <div class="tab-bar no-drag">
        <span class="tab-item" :class="{ active: activeTab === 'dedup' }" @click="switchTab('dedup')">查重</span>
        <span class="tab-item" :class="{ active: activeTab === 'classify' }" @click="switchTab('classify')">分类</span>
      </div>
    </header>
    <div class="main-app">
      <template v-if="activeTab === 'dedup'">
        <div class="step1" v-if="step === 1">
        <a-spin wrapperClassName="spin" :spinning="loading">
          <a-upload-dragger class="upload" v-model:fileList="fileList" name="file" :showUploadList="false"
            :openFileDialogOnClick="false" @click="selectFloder" xiuxia directory>
            <p class="ant-upload-drag-icon">
              <inbox-outlined></inbox-outlined>
            </p>
            <p class="ant-upload-text">点击或拖拽上传文件</p>
            <p class="ant-upload-hint">支持 jpg / png / webp / avif 格式的查重</p>
          </a-upload-dragger>
          <a-space>
            已选择：{{ fileList.length }}个文件
            <!-- <a-button type="link" @click="seeFileList">查看文件列表</a-button> -->
          </a-space>
          <a-button type="primary" @click="startContrast">开始查重</a-button>
        </a-spin>
      </div>
      <div class="step2" v-if="step === 2">
        <PictureOutlined class="icon" />
        <div class="title">正在匹配重复图片...</div>
        <div class="scan-info">
          <div>文件总数：{{ totalCompNum }}</div>
          <div>已扫描数：{{ currentCompNum }}</div>
          <!-- <div>耗时：</div> -->
          <!-- <div>剩余时间：</div> -->
        </div>
        <div class="progress">
          <div class="bar" :style="{ width: `${currentCompNum / totalCompNum * 100}%` }"></div>
        </div>

        <a-button class="stop-btn" type="primary" size="large" @click="abortController.abort()">停止</a-button>
      </div>
      <div class="step3" v-if="step === 3">
        <template v-if="contrastImglist.length">
          <div class="action">
            <div>
              <a-space>
                <a-button type="primary" @click="autoSelect">智能选择</a-button>
              </a-space>
              <a-space>
                <a-dropdown>
                  <template #overlay>
                    <a-menu>
                      <a-menu-item key="1" @click="deleteFile('forever')">
                        永久删除
                      </a-menu-item>
                      <a-menu-item key="2" @click="deleteFile('otherFolder')">
                        其他文件夹
                      </a-menu-item>
                      <a-menu-item key="3" @click="deleteFile('dustbin')">
                        <UserOutlined />
                        回收站
                      </a-menu-item>
                    </a-menu>
                  </template>
                  <a-button type="primary">
                    删除
                    <DownOutlined />
                  </a-button>
                </a-dropdown>
              </a-space>
            </div>
          </div>
          <div class="layout">
            <div class="left">
              <div class="img-list">
                <div v-for="(item, index) in contrastImglist" class="item" @click="currentSelectImgIndex = index">
                  <!-- <img src="../assets/images/img.png"> -->
                  <img :src="item[0].src" class="image">
                  <div class="text">
                    <div class="name">
                      <span class="t1">{{ item[0].name }}</span>
                      <!-- <span class="t2">
                        <a-checkbox />
                      </span> -->
                    </div>
                    <div class="info">
                      <span>{{ item.length }}个文件</span>
                      <span>{{ item[0].size }}</span>
                      <span>已选：{{item.filter(img => img.checked).length}}个文件</span>
                    </div>
                  </div>
                </div>
              </div>
              <div class="left-footer">已选：{{ selectedCount }} 个文件</div>
            </div>
            <div class="right">
              <div class='img-list' v-for="item in currentImg">
                <a-image :width="100" class="image" :src="item.src" preview />
                <div class="text">
                  <div class="name" @click="item.checked = !item.checked">
                      <span class="t1">
                        {{ item.name }}
                      </span>
                      <span class="t2">
                        <a-checkbox :checked="item.checked" />
                      </span>
                    </div>
                    <div>大小：{{ item.size }}</div>
                    <div>创建时间：{{ item.createTime }}</div>
                    <div>路径：{{ item.src }}</div>
                  </div>
                </div>
              </div>
            </div>
        </template>
        <div v-else class="no-data">
          <img src="../assets/images/nodata.svg" alt="">
          <h3>未找到重复的图片</h3>
          <a-space>
            <a-button type="primary" @click="step = 1">返回首页</a-button>
          </a-space>
        </div>
      </div>
      <div class="step4" v-if="step === 4">
        <div class="box">
          <img src="../assets/images/tong.svg" alt="">
          <h3>本次清理已完成</h3>
          <a-space>
            <a-button type="primary" @click="step = 1">返回首页</a-button>
          </a-space>
        </div>
      </div>
      </template>

      <!-- 分类功能 -->
      <template v-if="activeTab === 'classify'">
        <div class="step1" v-if="classifyStep === 1">
          <a-spin wrapperClassName="spin" :spinning="classifyLoading">
            <a-upload-dragger class="upload" v-model:fileList="classifyFileList" name="file" :showUploadList="false"
              :openFileDialogOnClick="false" @click="selectClassifyFolder" xiuxia directory>
              <p class="ant-upload-drag-icon">
                <inbox-outlined></inbox-outlined>
              </p>
              <p class="ant-upload-text">点击或拖拽上传文件</p>
              <p class="ant-upload-hint">支持 jpg / png / webp / avif 格式的图片分类</p>
            </a-upload-dragger>
            <a-space>
              已选择：{{ classifyFileList.length }}个文件
            </a-space>
            <a-button type="primary" @click="startClassify">开始分类</a-button>
          </a-spin>
        </div>
        <div class="step2" v-if="classifyStep === 2">
          <PictureOutlined class="icon" />
          <div class="title">正在分类图片...</div>
          <div class="scan-info">
            <div>文件总数：{{ classifyTotal }}</div>
            <div>已扫描数：{{ classifyCompleted }}</div>
          </div>
          <div class="progress">
            <div class="bar" :style="{ width: `${classifyTotal ? (classifyCompleted / classifyTotal * 100) : 0}%` }"></div>
          </div>
          <a-button class="stop-btn" type="primary" size="large" @click="classifyAbortController?.abort()">停止</a-button>
        </div>
        <div class="step3" v-if="classifyStep === 3">
          <template v-if="classifyGroups.length">
            <div class="classify-result">
              <!-- 横图列 -->
              <div class="classify-section" style="flex:4" v-if="horizontalGroup">
                <div class="section-header">横图<span class="count">（{{ horizontalGroup.files.length }}张）</span></div>
                <div class="img-list">
                    <div class="img-item" v-for="img in horizontalGroup.files" :key="img.src">
                      <a-image :width="150" class="thumb" :src="img.src" preview />
                      <div class="info">
                        <div class="name" :title="img.name">{{ img.name }}</div>
                        <div class="info-row"><label>大小</label><span>{{ img.size }}</span></div>
                        <div class="info-row"><label>尺寸</label><span>{{ img.width }} × {{ img.height }}</span></div>
                        <div class="info-row path" :title="img.src"><label>路径</label><span>{{ getShortPath(img.src) }}</span></div>
                      </div>
                    </div>
                </div>
              </div>
              <!-- 竖图列（含方图） -->
              <div class="classify-section" style="flex:4" v-if="verticalGroup">
                <div class="section-header">竖图<span class="count">（{{ verticalGroup.files.length }}张）</span></div>
                <div class="img-list">
                    <div class="img-item" v-for="img in verticalGroup.files" :key="img.src">
                      <a-image :width="100" class="thumb" :src="img.src" preview />
                      <div class="info">
                        <div class="name" :title="img.name">{{ img.name }}</div>
                        <div class="info-row"><label>大小</label><span>{{ img.size }}</span></div>
                        <div class="info-row"><label>尺寸</label><span>{{ img.width }} × {{ img.height }}</span></div>
                        <div class="info-row path" :title="img.src"><label>路径</label><span>{{ getShortPath(img.src) }}</span></div>
                      </div>
                    </div>
                </div>
              </div>
              <!-- 输出设置列 -->
              <div class="classify-section settings-section" style="flex:2">
                <div class="section-header">输出设置</div>
                <div class="settings-body">
                  <div class="folder-tips">
                    <div class="tip-row">
                      <span class="tip-label">输出文件夹</span>
                    </div>
                    <div class="tip-row">
                      <span class="tip-label">横图</span>
                      <span class="tip-path">horizontal</span>
                    </div>
                    <div class="tip-row">
                      <span class="tip-label">竖图</span>
                      <span class="tip-path">vertical</span>
                    </div>
                    <div class="tip-row">
                      <span class="tip-label">方图</span>
                      <span class="tip-path">square</span>
                    </div>
                  </div>
                  <a-input v-model:value="outputPath" placeholder="选择输出文件夹" />
                  <a-checkbox v-model:checked="deleteOrigin" style="align-self: flex-start;">删除原文件</a-checkbox>
                  <a-button @click="selectOutputFolder" block>选择路径</a-button>
                  <a-button type="primary" block :disabled="!outputPath" @click="doClassify">开始分类</a-button>
                </div>
              </div>
            </div>
          </template>
          <div v-else class="no-data">
            <img src="../assets/images/nodata.svg" alt="">
            <h3>未找到图片</h3>
            <a-space>
              <a-button type="primary" @click="classifyStep = 1">返回首页</a-button>
            </a-space>
          </div>
        </div>
        <div class="step4" v-if="classifyStep === 4">
          <div class="box">
            <img src="../assets/images/tong.svg" alt="">
            <h3>分类已完成</h3>
            <p style="color:#999;margin-top:8px">文件已按方向分类保存到对应文件夹</p>
            <a-space style="margin-top:12px">
              <a-button type="primary" @click="classifyStep = 1">返回首页</a-button>
              <a-button v-if="outputPath" @click="shell.openPath(outputPath)">打开输出文件夹</a-button>
            </a-space>
          </div>
        </div>
      </template>
    </div>

    <a-modal v-model:open="showAbout" title="关于" :footer="null" width="420px">
      <div class="about-content">
        <div class="about-header">
          <img src="../assets/images/img.png" width="48">
          <h2>图片查重分类工具</h2>
        </div>
        <p class="about-version">版本 {{ appVersion }}</p>
        <p class="about-desc" style="line-height:1.8">基于 Electron 的跨平台图片处理工具<br><br>支持图片查重（基于内容哈希的重复文件识别与清理）<br>支持图片方向分类（横图/竖图/方图自动归类）</p>
        <div class="about-info">
          <div><label>支持格式</label><span>JPG / PNG / WebP / AVIF</span></div>
          <div><label>运行环境</label><span>Electron + Vue3</span></div>
          <div><label>仓库地址</label><span><a href="https://github.com/WaterFlowerCN/ImageContrastTools" target="_blank">GitHub</a></span></div>
        </div>
        <div class="about-footer">
          作者：<a href="https://github.com/WaterFlowerCN" target="_blank">WaterFlowerCN</a>
        </div>
      </div>
    </a-modal>
  </div>
</template>
<script lang="ts" setup>
import { computed, ref, watch } from "vue";
import { version as appVersion } from "../../package.json";
import { DownOutlined, InboxOutlined, PictureOutlined } from "@ant-design/icons-vue";
import { delAllFiles, getImageFiles, getSelectedFilePath, moveOtherFolder } from "../utils/utils";
import { imageContrastV2, classifyByOrientation } from "../utils/imageContrast";
import type { OrientedFile } from "../utils/imageContrast";
import { shell, ipcRenderer } from "electron";
import fs from "fs";
import path from "path";
import { message, Modal } from "ant-design-vue";
import { ImageItem } from "../types/interface";
const loading = ref(false);
const fileList = ref<string[]>([]);
const step = ref<number>(1);
const currentCompNum = ref(0);
const debugNum = ref(0)
const showAbout = ref(false)
const activeTab = ref<'dedup' | 'classify'>('dedup')
const switchTab = (tab: 'dedup' | 'classify') => {
  activeTab.value = tab
  step.value = 1
  classifyStep.value = 1
}
const openDebug = ()=>{
  debugNum.value++
  if(debugNum.value>=5){
    ipcRenderer.send("openDebug")
    debugNum.value=0
  }
}
// 重复的文件
const currentSelectImgIndex = ref(0)
// const testData = JSON.parse(fs.readFileSync("./src/components/test.json").toString())
const contrastImglist = ref<ImageItem[][]>([])
const currentImg = computed(() => {
  if (contrastImglist.value.length) {
    return contrastImglist.value[currentSelectImgIndex.value]
  } else {
    return []
  }
})

const abortController = ref();

// 分类功能状态
const classifyStep = ref(1)
const classifyLoading = ref(false)
const classifyFileList = ref<string[]>([])
const classifyCompleted = ref(0)
const classifyTotal = ref(0)
const classifyAbortController = ref<AbortController>(new AbortController())
const classifyGroups = ref<{ label: string; key: string; files: OrientedFile[] }[]>([])
const horizontalGroup = computed(() => classifyGroups.value.find(g => g.key === 'horizontal') || null)
const verticalGroup = computed(() => classifyGroups.value.find(g => g.key === 'vertical') || null)
const outputPath = ref('')
const deleteOrigin = ref(false)
const sourcePath = ref('')
// 选择文件夹
const selectFloder = () => {
  ipcRenderer
    .invoke("showFolderDialog")
    .then((res) => {
      const [folderPath] = res;
      if (!folderPath) {
        return false;
      }
      loading.value = true;
      console.log(folderPath);
      setTimeout(() => {
        const imgeList = getImageFiles(folderPath);
        fileList.value = imgeList;
        loading.value = false;
      });
    })
    .catch((err) => {
      message.error(err.message);
      loading.value = false;
    });
};
// const seeFileList = () => {
//   if (!fileList.value.length) {
//     message.info("暂无文件");
//   } else {

//   }
// };
// 开始查重
const startContrast = () => {
  if (fileList.value.length === 0) {
    message.info('请选择文件')
    return false
  }
  step.value = 2;
  abortController.value = new AbortController()
  imageContrastV2(fileList.value, (num: number) => {
    console.log(num)
    currentCompNum.value = num;
  }, abortController).then((res: ImageItem[][]) => {
    console.log(res)
    contrastImglist.value = res
    currentSelectImgIndex.value = 0
    step.value = 3
  });
};

// 分类 - 选择文件夹
const selectClassifyFolder = () => {
  ipcRenderer
    .invoke("showFolderDialog")
    .then((res) => {
      const [folderPath] = res;
      if (!folderPath) return false;
      sourcePath.value = folderPath;
      classifyLoading.value = true;
      setTimeout(() => {
        const imgeList = getImageFiles(folderPath);
        classifyFileList.value = imgeList;
        classifyLoading.value = false;
      });
    })
    .catch((err) => {
      message.error(err.message);
      classifyLoading.value = false;
    });
};

// 开始分类
const startClassify = () => {
  if (classifyFileList.value.length === 0) {
    message.info('请选择文件')
    return false
  }
  classifyStep.value = 2;
  classifyTotal.value = classifyFileList.value.length;
  classifyCompleted.value = 0;
  classifyAbortController.value = new AbortController()
  classifyByOrientation(classifyFileList.value, (num: number) => {
    classifyCompleted.value = num;
  }, classifyAbortController).then((res) => {
    classifyGroups.value = res.groups
    classifyStep.value = 3
  });
};

const selectOutputFolder = () => {
  ipcRenderer
    .invoke("showFolderDialog")
    .then((res) => {
      const [folderPath] = res
      if (folderPath) outputPath.value = folderPath
    })
    .catch((err) => {
      message.error(err.message)
    })
}

const getShortPath = (fileSrc: string) => {
  if (sourcePath.value) {
    const src = sourcePath.value.replace(/\\/g, '/').replace(/\/+$/, '')
    const file = fileSrc.replace(/\\/g, '/')
    if (file.startsWith(src)) {
      const rel = file.substring(src.length).replace(/^\/+/, '')
      return rel || path.basename(fileSrc)
    }
    return path.relative(sourcePath.value, fileSrc)
  }
  return fileSrc
}

const folderNameMap: Record<string, string> = {
  horizontal: 'horizontal',
  vertical: 'vertical',
  square: 'square',
}

const doClassify = async () => {
  if (!outputPath.value) {
    message.info('请选择输出文件夹')
    return
  }
  try {
    for (const group of classifyGroups.value) {
      const folderName = folderNameMap[group.key] || group.key
      const dir = path.join(outputPath.value, folderName)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
      for (const file of group.files) {
        // 检查源文件是否存在
        if (!fs.existsSync(file.src)) {
          console.warn('文件不存在，跳过：' + file.src)
          continue
        }
        const dest = path.join(dir, file.name)
        // 直接复制，保留原文件名
        fs.copyFileSync(file.src, dest)
        // 勾选了删除原文件则删除源文件
        if (deleteOrigin.value) {
          // Windows 上文件可能被系统锁定，重试 3 次
          for (let retry = 0; retry < 3; retry++) {
            try {
              fs.unlinkSync(file.src)
              break
            } catch (e: any) {
              if (retry === 2 || e.code !== 'EBUSY') throw e
              await new Promise(r => setTimeout(r, 200))
            }
          }
        }
      }
    }
    classifyStep.value = 4
  } catch (err: any) {
    message.error('分类失败：' + err.message)
  }
}

const totalCompNum = computed(() => {
  const length = fileList.value.length;
  return length
});
const selectedCount = computed(() =>
  contrastImglist.value.reduce(
    (sum, group) => sum + group.filter((img) => img.checked).length,
    0
  )
);
const autoSelect = () => {
  const newImglist = contrastImglist.value.map((item: ImageItem[]) => {
    // 先按文件大小降序排，大小相同则按文件名长度升序排
    const sorted = [...item].sort((a, b) => {
      if (b.originSize !== a.originSize) {
        return b.originSize - a.originSize; // 大的优先
      }
      return a.name.length - b.name.length;   // 大小相同时，文件名短的优先
    });
    // 排序后第一条就是保留项，其余全部勾选
    const keep = sorted[0];
    item.forEach((obj: ImageItem) => {
      obj.checked = obj !== keep;
    });
    return item;
  });
  contrastImglist.value = newImglist;
};
const deleteFile = (type: string) => {
  const waitDelFileList = getSelectedFilePath(contrastImglist.value)
  if (!waitDelFileList.length) {
    message.info('未选择任何文件~')
    return false
  }
  if (type === 'forever') {
    Modal.confirm({
      title: '提示',
      content: '确认永久删除？',
      okText: '确定',
      cancelText: '取消',
      onOk() {
        try {
          delAllFiles(waitDelFileList)
          message.success('删除成功')
          step.value = 4
        } catch (error: any) {
          message.error(error.message)
        }
      }
    })
  } else if (type === 'otherFolder') {
    ipcRenderer
      .invoke("showFolderDialog")
      .then((res) => {
        const [folderPath] = res
        try {
          moveOtherFolder(waitDelFileList, folderPath)
          message.success('移动成功')
          step.value = 4

          shell.openExternal(folderPath)
        } catch (error: any) {
          message.error(error.message)
        }
      })
      .catch((err) => {
        message.error(err.message);
        loading.value = false;
      });
  } else if (type === 'dustbin') {

    Modal.confirm({
      title: '提示',
      content: '确认永久删除？',
      okText: '确定',
      cancelText: '取消',
      onOk() {
        ipcRenderer.invoke('moveDustbin', waitDelFileList).then(() => {
          message.success('移动到回收站成功')
          step.value = 4

        }).catch(err => {
          message.error(err.message)
        })
      }
    })

  }
}

watch(step, (val) => {
  if (val === 1) {
    fileList.value = []
  }
})
</script>
<style scoped lang="less">
.main-app {
  padding: 24px;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.spin {
  flex: 1;
  display: flex;
  flex-direction: column;

  :deep(.ant-spin-container) {
    display: flex;
    flex-direction: column;
    flex: 1;
    gap: 12px;
  }
}

.upload {
  flex: 1;

  :deep(.ant-upload) {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
}

.step1 {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.step2 {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  .title {
    margin-top: 24px;
    font-size: 1.2em;
  }

  .icon {
    font-size: 4em;
    color: #1677ff;
  }

  .scan-info {
    margin-top: 36px;
    display: flex;
    width: 80%;
    gap: 15px;
  }

  .progress {
    margin-top: 24px;
    height: 6px;
    background: #000;
    width: 80%;
    border-radius: 4px;

    .bar {
      background: #1677ff;
      width: 30%;
      height: 100%;
      border-radius: 4px;
    }
  }

  .stop-btn {
    margin-top: 24px;
  }
}

.step3 {
  overflow: hidden;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;

  .no-data {
    gap: 20px;
    height: 500px;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;

    img {
      width: 200px;
    }
  }

  .action {
    div {
      display: flex;
      justify-content: space-between;

    }
  }

  .layout {
    margin-top: 12px;
    flex: 1;
    display: flex;
    overflow: hidden;
    min-height: 0;

    .left {
      width: 400px;
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      min-height: 0;

      .img-list {
        flex: 1;
        overflow-y: auto;
        min-height: 0;
        cursor: pointer;

        .item {
          width: 100%;
          padding: 15px 0;
          display: flex;
          font-size: 14px;
          border-bottom: 1px #dfdfdf solid;

          .image {
            height: 80px;
            width: 100px;
            object-fit: cover;
            border-radius: 4px;
            box-shadow: 0 0 4px #333;

          }

          .text {
            flex: 1;
            width: 100%;
            margin-left: 12px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            overflow: hidden;

            .name {
              display: flex;
              align-items: center;
              cursor: pointer;

              .t1 {
                flex: 1;
                text-overflow: ellipsis;
                overflow: hidden;
                white-space: nowrap;
              }

              .t2 {
                margin: 0 12px;
              }

            }

            .info {
              font-size: 12px;
              color: #666;
              display: flex;
              gap: 10px;

              span {
                &:last-child {
                  margin-left: auto;
                }
              }
            }
          }
        }
      }

      .left-footer {
        flex-shrink: 0;
        padding: 15px 0 0;
        font-size: 13px;
        color: #666;
      }

    }

    .right {
      // border-left: 1px #dbdbdb solid;
      padding-left: 24px;
      overflow: auto;
      flex: 1;

      :deep(.image) {
        width: 100px;
        max-height: 150px;
        object-fit: cover;
        border-radius: 4px;
        box-shadow: 0 0 10px #dbdbdb;
      }

      .img-list {
        display: flex;
        padding: 12px 0;
        border-bottom: 1px #dfdfdf solid;

        &:first-child {
          // padding-top: 0;
        }

        .text {
          margin-left: 12px;
          display: flex;
          flex-direction: column;
          justify-content: space-around;
          flex: 1;
          overflow: hidden;

          .name {
            cursor: pointer;
            display: flex;
            align-items: center;
            font-size: 16px;

            .t1 {
              flex: 1;
              text-overflow: ellipsis;
              overflow: hidden;
              white-space: nowrap;
            }

            .t2 {
              margin: 0 12px;
            }

          }

          div {
            font-size: 14px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
        }
      }
    }
  }
}

.step4 {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;

  .box {
    gap: 20px;
    height: 300px;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;

    img {
      width: 200px;
    }
  }
}

/* 分类结果 - 竖着三等份 */
.classify-result {
  flex: 1;
  display: flex;
  flex-direction: row;
  gap: 8px;
  overflow: hidden;
  min-height: 0;
}

.classify-section {
  flex: 1;
  width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
  background: #fff;
  border-radius: 6px;
  border: 1px solid #f0f0f0;

  .section-header {
    flex-shrink: 0;
    padding: 8px 12px;
    font-size: 14px;
    font-weight: 500;
    border-bottom: 1px solid #f0f0f0;
    background: #fafafa;

    .count {
      font-weight: 400;
      color: #999;
      font-size: 13px;
      margin-left: 4px;
    }
  }

  .img-list {
    flex: 1;
    overflow-y: auto;
    min-height: 0;
    padding: 4px 0;

    &::-webkit-scrollbar {
      width: 5px;
    }

    &::-webkit-scrollbar-thumb {
      background-color: #ccc;
      border-radius: 3px;
    }

    .img-item {
      display: flex;
      padding: 8px 12px;
      border-bottom: 1px solid #f5f5f5;
      gap: 10px;

      &:last-child {
        border-bottom: none;
      }

      .thumb {
        flex-shrink: 0;
        border-radius: 4px;
        box-shadow: 0 0 4px rgba(0,0,0,0.15);
      }

      .info {
        flex: 1;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        gap: 2px;

        .name {
          font-size: 13px;
          font-weight: 500;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .info-row {
          font-size: 12px;
          color: #666;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;

          label {
            color: #999;
            margin-right: 4px;
          }

          &.path span {
            font-size: 11px;
            color: #999;
          }
        }
      }
    }
  }
}

.settings-section {
  flex: 1;
  width: 0;

  .settings-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    padding: 24px;

    .ant-input {
      width: 100%;
    }

    .ant-btn {
      width: 100%;
    }

    .folder-tips {
      width: 100%;
      padding: 10px 12px;
      background: #f6f8fa;
      border-radius: 6px;
      border: 1px dashed #d9d9d9;

      .tip-row {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 2px 0;
        font-size: 12px;

        .tip-label {
          flex-shrink: 0;
          color: #999;
        }

        .tip-path {
          flex: 1;
          color: #1677ff;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-family: monospace;
          font-size: 11px;
        }
      }
    }
  }
}

.about-content {
  text-align: center;
  padding: 8px 0;

  .about-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-bottom: 8px;

    h2 {
      margin: 0;
      font-size: 20px;
    }
  }

  .about-version {
    color: #999;
    font-size: 13px;
    margin-bottom: 16px;
  }

  .about-desc {
    color: #666;
    font-size: 14px;
    line-height: 1.6;
    text-align: left;
    margin-bottom: 16px;
  }

  .about-info {
    text-align: left;
    border-top: 1px solid #f0f0f0;
    border-bottom: 1px solid #f0f0f0;
    padding: 12px 0;
    margin-bottom: 12px;

    div {
      display: flex;
      padding: 4px 0;
      font-size: 13px;

      label {
        color: #999;
        width: 80px;
        flex-shrink: 0;
      }

      span {
        color: #333;
      }
    }
  }

  .about-footer {
    font-size: 13px;
    color: #999;
  }
}

/* 标签栏 */
.tab-bar {
  display: flex;
  gap: 4px;
  padding: 0 0 0 4px;

  .tab-item {
    padding: 4px 16px;
    font-size: 13px;
    cursor: pointer;
    border-radius: 6px 6px 0 0;
    color: #666;
    transition: all 0.2s;
    user-select: none;
    background: transparent;

    &:hover {
      background: rgba(22, 119, 255, 0.06);
      color: #1677ff;
    }

    &.active {
      background: #f7fbff;
      color: #1677ff;
      font-weight: 500;
    }
  }
}
</style>
