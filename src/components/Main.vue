<template>
  <div class="container">
    <header class="drag">
      <div class="logo no-drag" @click="openDebug">
        <img src="../assets/images/img.png" width="24">
        图片查重工具
      </div>
      <div class="actions no-drag">
        <span class="about-btn" @click="showAbout = true">关于</span>
        <span class="close" @click="ipcRenderer.send('exitProcess')">x</span>
      </div>
    </header>
    <div class="main-app">
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
              <a-image-preview-group>
                <div class='img-list' v-for="item in currentImg">
                  <a-image :width="100" class="image" :src="item.src" />
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
              </a-image-preview-group>
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
    </div>

    <a-modal v-model:open="showAbout" title="关于" :footer="null" width="420px">
      <div class="about-content">
        <div class="about-header">
          <img src="../assets/images/img.png" width="48">
          <h2>图片查重工具</h2>
        </div>
        <p class="about-version">版本 {{ appVersion }}</p>
        <p class="about-desc">基于 Electron 的跨平台图片查重工具，支持文件夹扫描、基于内容哈希的重复文件识别与可视化处理。</p>
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
import { imageContrastV2 } from "../utils/imageContrast";
import { shell, ipcRenderer } from "electron";
import { message, Modal } from "ant-design-vue";
import { ImageItem } from "../types/interface";
const loading = ref(false);
const fileList = ref<string[]>([]);
const step = ref<number>(1);
const currentCompNum = ref(0);
const debugNum = ref(0)
const showAbout = ref(false)
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
</style>
