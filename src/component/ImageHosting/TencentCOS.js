import React, {Component} from "react";
import {observer, inject} from "mobx-react";
import {Input, Form} from "antd";
import {TENCENT_IMAGE_HOSTING} from "../../utils/constant";

const formItemLayout = {
  labelCol: {
    xs: {span: 24},
    sm: {span: 4},
  },
  wrapperCol: {
    xs: {span: 24},
    sm: {span: 20},
  },
};

@inject("imageHosting")
@observer
class TencentCOS extends Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.initConfig();
  }

  componentDidMount() {
    // 组件挂载时初始化配置
    this.initConfig();
  }

  initConfig = () => {
    // 从 localStorage 初始化配置
    const savedConfig = window.localStorage.getItem(TENCENT_IMAGE_HOSTING);
    if (savedConfig) {
      const config = JSON.parse(savedConfig);
      this.props.imageHosting.updateConfig("tencent", config);
    } else {
      // 初始化默认配置
      this.props.imageHosting.updateConfig("tencent", {
        secretId: "",
        secretKey: "",
        bucket: "",
        region: ""
      });
    }
  };

  handleChange = (e) => {
    const {name, value} = e.target;
    const {imageHosting} = this.props;
    const config = {
      ...imageHosting.config.tencent || {},
      [name]: value,
    };
    imageHosting.updateConfig("tencent", config);
    // 保存到 localStorage
    window.localStorage.setItem(TENCENT_IMAGE_HOSTING, JSON.stringify(config));
  };

  render() {
    const {imageHosting} = this.props;
    const config = imageHosting.config.tencent || {};

    return (
      <Form {...formItemLayout}>
        <Form.Item label="SecretId">
          <Input
            name="secretId"
            value={config.secretId}
            onChange={this.handleChange}
            placeholder="请输入 SecretId"
          />
        </Form.Item>
        <Form.Item label="SecretKey">
          <Input.Password
            name="secretKey"
            value={config.secretKey}
            onChange={this.handleChange}
            placeholder="请输入 SecretKey"
          />
        </Form.Item>
        <Form.Item label="Bucket" extra="格式：BucketName-APPID">
          <Input
            name="bucket"
            value={config.bucket}
            onChange={this.handleChange}
            placeholder="例如：my-bucket-1250000000"
          />
        </Form.Item>
        <Form.Item label="Region" extra="存储桶所在地域">
          <Input
            name="region"
            value={config.region}
            onChange={this.handleChange}
            placeholder="例如：ap-beijing"
          />
        </Form.Item>
      </Form>
    );
  }
}

// 启用热更新
if (module.hot) {
  module.hot.accept();
}

export default TencentCOS; 