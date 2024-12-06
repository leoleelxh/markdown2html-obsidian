import React, {Component} from "react";
import {observer, inject} from "mobx-react";
import {Input, Form, Checkbox} from "antd";
import {GITHUB_IMAGE_HOSTING} from "../../utils/constant";

const formItemLayout = {
  labelCol: {
    xs: {span: 6},
  },
  wrapperCol: {
    xs: {span: 16},
  },
};

@inject("imageHosting")
@observer
class GitHub extends Component {
  constructor(props) {
    super(props);
    // 从环境变量读取默认配置
    const envConfig = {
      username: process.env.REACT_APP_GITHUB_OWNER || "",
      repo: process.env.REACT_APP_GITHUB_REPO || "",
      token: process.env.REACT_APP_GITHUB_TOKEN || "",
      jsdelivr: "true"
    };
    
    // 从 localStorage 读取已保存的配置，如果没有则使用环境变量配置
    let imageHosting;
    try {
      imageHosting = JSON.parse(localStorage.getItem(GITHUB_IMAGE_HOSTING)) || envConfig;
    } catch (error) {
      console.error("解析GitHub配置失败:", error);
      imageHosting = envConfig;
    }
    
    this.state = {
      imageHosting,
      error: null
    };
  }

  validateConfig = (config) => {
    if (!config.username) return "请输入GitHub用户名";
    if (!config.repo) return "请输入仓库名";
    if (!config.token) return "请输入GitHub Token";
    return null;
  }

  updateConfig = (newConfig) => {
    const error = this.validateConfig(newConfig);
    this.setState({ imageHosting: newConfig, error });
    localStorage.setItem(GITHUB_IMAGE_HOSTING, JSON.stringify(newConfig));
  }

  usernameChange = (e) => {
    const {imageHosting} = this.state;
    imageHosting.username = e.target.value.trim();
    this.updateConfig(imageHosting);
  };

  repoChange = (e) => {
    const {imageHosting} = this.state;
    imageHosting.repo = e.target.value.trim();
    this.updateConfig(imageHosting);
  };

  tokenChange = (e) => {
    const {imageHosting} = this.state;
    imageHosting.token = e.target.value.trim();
    this.updateConfig(imageHosting);
  };

  jsdelivrChange = (e) => {
    const {imageHosting} = this.state;
    imageHosting.jsdelivr = e.target.checked ? "true" : "false";
    this.updateConfig(imageHosting);
  };

  render() {
    const {username, repo, token, jsdelivr} = this.state.imageHosting;
    const { error } = this.state;

    return (
      <Form {...formItemLayout}>
        <Form.Item 
          label="用户名" 
          style={style.formItem}
          validateStatus={!username && error ? "error" : ""}
          help={!username && error ? "请输入GitHub用户名" : ""}
        >
          <Input 
            value={username} 
            onChange={this.usernameChange} 
            placeholder="例如：mdnice" 
          />
        </Form.Item>
        <Form.Item 
          label="仓库名" 
          style={style.formItem}
          validateStatus={!repo && error ? "error" : ""}
          help={!repo && error ? "请输入仓库名" : ""}
        >
          <Input 
            value={repo} 
            onChange={this.repoChange} 
            placeholder="例如：picture" 
          />
        </Form.Item>
        <Form.Item 
          label="Token" 
          style={style.formItem}
          validateStatus={!token && error ? "error" : ""}
          help={!token && error ? "请输入GitHub Token" : ""}
        >
          <Input.Password
            value={token}
            onChange={this.tokenChange}
            placeholder="例如：ghp_xxxxxxxxxxxxxxxx"
          />
        </Form.Item>
        <Form.Item label="jsDelivr CDN" style={style.formItem}>
          <Checkbox checked={jsdelivr === "true"} onChange={this.jsdelivrChange}>
            使用 jsDelivr CDN 加速（推荐）
          </Checkbox>
        </Form.Item>
        <Form.Item label="提示" style={style.formItem}>
          <div>
            <p>配置说明：</p>
            <ol style={style.tips}>
              <li>GitHub Token 获取方式：GitHub Settings -> Developer settings -> Personal access tokens -> Generate new token</li>
              <li>Token 权限要求：需要勾选 repo 权限</li>
              <li>仓库要求：必须是公开仓库</li>
              <li>配置完成后，请在右上角切换到 GitHub 图床</li>
            </ol>
            <a
              rel="noopener noreferrer"
              target="_blank"
              href="https://preview.mdnice.com/article/developer/github-image-hosting/"
            >
              查看详细配置文档
            </a>
          </div>
        </Form.Item>
      </Form>
    );
  }
}

const style = {
  formItem: {
    marginBottom: "10px",
  },
  tips: {
    paddingLeft: "20px",
    fontSize: "12px",
    color: "#666",
    marginBottom: "10px",
  },
};

export default GitHub;
