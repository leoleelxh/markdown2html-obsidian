import {observable, action} from "mobx";
import {
  IMAGE_HOSTING_TYPE,
  ALIOSS_IMAGE_HOSTING,
  QINIUOSS_IMAGE_HOSTING,
  GITEE_IMAGE_HOSTING,
  GITHUB_IMAGE_HOSTING,
  IMAGE_HOSTING_NAMES,
} from "../utils/constant";

class ImageHosting {
  @observable type = IMAGE_HOSTING_NAMES.github; // 默认使用 GitHub 图床

  @observable hostingUrl = "";

  @observable hostingName = "";

  @action
  setType = (type) => {
    if (Object.values(IMAGE_HOSTING_NAMES).includes(type)) {
      this.type = type;
      window.localStorage.setItem(IMAGE_HOSTING_TYPE, type);
    }
  };

  @action
  setHostingUrl = (url) => {
    this.hostingUrl = url;
  };

  @action
  setHostingName = (name) => {
    this.hostingName = name;
  };

  @action
  addImageHosting = (config) => {
    // 根据配置类型保存到对应的 localStorage
    switch (config.type) {
      case IMAGE_HOSTING_NAMES.aliyun:
        window.localStorage.setItem(ALIOSS_IMAGE_HOSTING, JSON.stringify(config));
        break;
      case IMAGE_HOSTING_NAMES.qiniuyun:
        window.localStorage.setItem(QINIUOSS_IMAGE_HOSTING, JSON.stringify(config));
        break;
      case IMAGE_HOSTING_NAMES.gitee:
        window.localStorage.setItem(GITEE_IMAGE_HOSTING, JSON.stringify(config));
        break;
      case IMAGE_HOSTING_NAMES.github:
        window.localStorage.setItem(GITHUB_IMAGE_HOSTING, JSON.stringify(config));
        break;
      default:
        // 自定义图床
        this.setHostingUrl(config.url);
        this.setHostingName(config.name);
        break;
    }
    // 设置当前图床类型
    this.setType(config.type);
  };
}

const store = new ImageHosting();

// 初始化各个图床的配置
if (!window.localStorage.getItem(ALIOSS_IMAGE_HOSTING)) {
  const alioss = JSON.stringify({
    region: "",
    accessKeyId: "",
    accessKeySecret: "",
    bucket: "",
  });
  window.localStorage.setItem(ALIOSS_IMAGE_HOSTING, alioss);
}

if (!window.localStorage.getItem(QINIUOSS_IMAGE_HOSTING)) {
  const qiniuoss = JSON.stringify({
    region: "",
    accessKey: "",
    secretKey: "",
    bucket: "",
    domain: "https://",
    namespace: "",
  });
  window.localStorage.setItem(QINIUOSS_IMAGE_HOSTING, qiniuoss);
}

if (!window.localStorage.getItem(GITEE_IMAGE_HOSTING)) {
  const gitee = JSON.stringify({
    username: "",
    repo: "",
    token: "",
  });
  window.localStorage.setItem(GITEE_IMAGE_HOSTING, gitee);
}

if (!window.localStorage.getItem(GITHUB_IMAGE_HOSTING)) {
  const github = JSON.stringify({
    username: "",
    repo: "",
    token: "",
    jsdelivr: "true",
  });
  window.localStorage.setItem(GITHUB_IMAGE_HOSTING, github);
}

// 从 localStorage 读取已保存的图床类型
const savedType = window.localStorage.getItem(IMAGE_HOSTING_TYPE);
if (savedType && Object.values(IMAGE_HOSTING_NAMES).includes(savedType)) {
  store.type = savedType;
}

export default store;
