import { createApp } from "vue";
import App from "./App.vue";
import "./assets/global.less";
import {
  Upload,
  Button,
  Spin,
  Space,
  Image,
  Checkbox,
  Dropdown,
  Menu,
} from "ant-design-vue";
import "ant-design-vue/dist/reset.css";
const app = createApp(App);
app
  .use(Upload)
  .use(Button)
  .use(Spin)
  .use(Space)
  .use(Image)
  .use(Checkbox)
  .use(Dropdown)
  .use(Menu);
app.mount("#app").$nextTick(() => {
  // Use contextBridge
  console.log(window.ipcRenderer)
  // window.ipcRenderer.on('main-process-message', (_event, message) => {
  //   console.log(message)
  // })
});
