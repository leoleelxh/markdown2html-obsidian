import {observable, action} from "mobx";
import {
  IMAGE_HOSTING_TYPE,
  ALIOSS_IMAGE_HOSTING,
  QINIUOSS_IMAGE_HOSTING,
  GITEE_IMAGE_HOSTING,
  GITHUB_IMAGE_HOSTING,
  TENCENT_IMAGE_HOSTING,
  IMAGE_HOSTING_NAMES,
} from "../utils/constant";

class ImageHosting {
  @observable type = IMAGE_HOSTING_NAMES.github; // 默认使用 GitHub 图床
  @observable config = {}; // 存储所有图床的配置
  @observable hostingUrl = "";
  @observable hostingName = "";

  constructor() {
    // 初始化配置
    this.initConfig();
  }

  @action
  initConfig = () => {
    // 从 localStorage 加载所有图床配置
    const configs = {
      github: JSON.parse(window.localStorage.getItem(GITHUB_IMAGE_HOSTING) || "{}"),
      gitee: JSON.parse(window.localStorage.getItem(GITEE_IMAGE_HOSTING) || "{}"),
      aliyun: JSON.parse(window.localStorage.getItem(ALIOSS_IMAGE_HOSTING) || "{}"),
      qiniuyun: JSON.parse(window.localStorage.getItem(QINIUOSS_IMAGE_HOSTING) || "{}"),
      tencent: JSON.parse(window.localStorage.getItem(TENCENT_IMAGE_HOSTING) || "{}")
    };
    this.config = configs;
  };

  @action
  setType = (type) => {
    if (Object.values(IMAGE_HOSTING_NAMES).includes(type)) {
      this.type = type;
      window.localStorage.setItem(IMAGE_HOSTING_TYPE, type);
    }
  };

  @action
  updateConfig = (type, config) => {
    // 更新指定图床的配置
    this.config = {
      ...this.config,
      [type]: config
    };
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
      case IMAGE_HOSTING_NAMES.tencent:
        window.localStorage.setItem(TENCENT_IMAGE_HOSTING, JSON.stringify(config));
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

// 从 localStorage 读取已保存的图床类型
const savedType = window.localStorage.getItem(IMAGE_HOSTING_TYPE);
if (savedType && Object.values(IMAGE_HOSTING_NAMES).includes(savedType)) {
  store.type = savedType;
}

export default store;
