import React, {Component} from "react";
import {observer, inject} from "mobx-react";
import {Modal, Upload, Tabs, Select} from "antd";

import SvgIcon from "../../icon";

import AliOSS from "../ImageHosting/AliOSS";
import QiniuOSS from "../ImageHosting/QiniuOSS";
import Gitee from "../ImageHosting/Gitee";
import GitHub from "../ImageHosting/GitHub";
import TencentCOS from "../ImageHosting/TencentCOS";

import {uploadAdaptor} from "../../utils/imageHosting";
import {SM_MS_PROXY, IMAGE_HOSTING_TYPE, IMAGE_HOSTING_NAMES} from "../../utils/constant";
import appContext from "../../utils/appContext";

const {Dragger} = Upload;
const {TabPane} = Tabs;
const {Option} = Select;

@inject("dialog")
@inject("content")
@inject("imageHosting")
@inject("navbar")
@observer
class ImageDialog extends Component {
  constructor(props) {
    super(props);
    this.state = {
      activeTab: "1"
    };
    this.images = [];
  }

  handleOk = () => {
    let text = "";
    if (this.props.navbar.isContainImgName) {
      for (const value of this.images) {
        text += `![${value.filename}](${value.url})\n`;
      }
    } else {
      for (const value of this.images) {
        text += `![](${value.url})\n`;
      }
    }
    this.images = [];
    const {markdownEditor} = this.props.content;
    const cursor = markdownEditor.getCursor();
    markdownEditor.replaceSelection(text, cursor);
    const content = markdownEditor.getValue();
    this.props.content.setContent(content);

    this.props.dialog.setImageOpen(false);
    cursor.ch += 2;
    markdownEditor.setCursor(cursor);
    markdownEditor.focus();
  };

  handleCancel = () => {
    this.props.dialog.setImageOpen(false);
  };

  customRequest = ({action, data, file, headers, onError, onProgress, onSuccess, withCredentials}) => {
    const formData = new FormData();
    const {images} = this;
    if (data) {
      Object.keys(data).forEach((key) => {
        formData.append(key, data[key]);
      });
    }

    switch (this.props.imageHosting.type) {
      case IMAGE_HOSTING_NAMES.aliyun:
        uploadAdaptor({file, onSuccess: (image) => {
          this.images.push(image);
          onSuccess(image);
        }, onError, images});
        break;
      case IMAGE_HOSTING_NAMES.qiniuyun:
        uploadAdaptor({file, onSuccess: (image) => {
          this.images.push(image);
          onSuccess(image);
        }, onError, onProgress, images});
        break;
      case IMAGE_HOSTING_NAMES.gitee:
      case IMAGE_HOSTING_NAMES.github:
        uploadAdaptor({formData, file, action, onProgress, onSuccess: (image) => {
          this.images.push(image);
          onSuccess(image);
        }, onError, headers, withCredentials, images});
        break;
      case IMAGE_HOSTING_NAMES.tencent:
        uploadAdaptor({file, onSuccess: (image) => {
          this.images.push(image);
          onSuccess(image);
        }, onError, onProgress, images});
        break;
      default: // SM.MS 或其他图床
        uploadAdaptor({formData, file, action, onProgress, onSuccess: (image) => {
          this.images.push(image);
          onSuccess(image);
        }, onError, headers, withCredentials});
    }

    return {
      abort() {
        console.log("upload progress is aborted.");
      },
    };
  };

  typeChange = (type) => {
    if (Object.values(IMAGE_HOSTING_NAMES).includes(type)) {
      this.props.imageHosting.setType(type);
      window.localStorage.setItem(IMAGE_HOSTING_TYPE, type);
    }
  };

  renderImageHostingConfig = () => {
    const {type} = this.props.imageHosting;
    
    return (
      <div>
        <div style={{ marginBottom: 16 }}>
          <span style={{ marginRight: 8 }}>选择图床：</span>
          <Select 
            style={{width: "200px"}} 
            value={type} 
            onChange={this.typeChange}
          >
            {Object.entries(IMAGE_HOSTING_NAMES).map(([key, value]) => (
              <Option key={key} value={value}>
                {value}
              </Option>
            ))}
          </Select>
        </div>
        
        <div>
          {type === IMAGE_HOSTING_NAMES.aliyun && <AliOSS />}
          {type === IMAGE_HOSTING_NAMES.qiniuyun && <QiniuOSS />}
          {type === IMAGE_HOSTING_NAMES.gitee && <Gitee />}
          {type === IMAGE_HOSTING_NAMES.github && <GitHub />}
          {type === IMAGE_HOSTING_NAMES.tencent && <TencentCOS />}
        </div>
      </div>
    );
  };

  render() {
    const {type} = this.props.imageHosting;
    const {activeTab} = this.state;

    return (
      <Modal
        title="图片上传"
        okText="确认"
        cancelText="取消"
        visible={this.props.dialog.isImageOpen}
        onOk={this.handleOk}
        onCancel={this.handleCancel}
        bodyStyle={{paddingTop: "10px"}}
        width={600}
      >
        <Tabs 
          activeKey={activeTab}
          onChange={(key) => this.setState({ activeTab: key })}
          type="card"
        >
          <TabPane tab="图片上传" key="1">
            <Dragger name="file" multiple action={SM_MS_PROXY} customRequest={this.customRequest}>
              <p className="ant-upload-drag-icon">
                <SvgIcon name="inbox" style={style.svgIcon} fill="#40a9ff" />
              </p>
              <p className="ant-upload-text">点击或拖拽一张或多张照片上传</p>
              <p className="ant-upload-hint">{`正在使用${type}图床`}</p>
            </Dragger>
          </TabPane>
          <TabPane tab="图床配置" key="2">
            {this.renderImageHostingConfig()}
          </TabPane>
        </Tabs>
      </Modal>
    );
  }
}

const style = {
  svgIcon: {
    width: "48px",
    height: "48px",
  },
};

export default ImageDialog;
