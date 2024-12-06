/**
 * 图片上传
 */
import * as qiniu from "qiniu-js";
import {message} from "antd";
import axios from "axios";
import OSS from "ali-oss";
import COS from "cos-js-sdk-v5";
import imageHosting from "../store/imageHosting";

import {
  SM_MS_PROXY,
  ALIOSS_IMAGE_HOSTING,
  QINIUOSS_IMAGE_HOSTING,
  GITEE_IMAGE_HOSTING,
  GITHUB_IMAGE_HOSTING,
  TENCENT_IMAGE_HOSTING,
  IMAGE_HOSTING_TYPE,
  IS_CONTAIN_IMG_NAME,
  IMAGE_HOSTING_NAMES,
} from "./constant";
import {toBlob, getOSSName, axiosMdnice} from "./helper";

function showUploadNoti() {
  message.loading("图片上传中", 0);
}

function uploadError(description = "图片上传失败") {
  message.error(description, 3);
}

function hideUploadNoti() {
  message.destroy();
  message.success("图片上传成功");
}

function writeToEditor({content, image}) {
  const isContainImgName = window.localStorage.getItem(IS_CONTAIN_IMG_NAME) === "true";
  let text = "";
  if (isContainImgName) {
    text = `\n![${image.filename}](${image.url})\n`;
  } else {
    text = `\n![](${image.url})\n`;
  }
  const {markdownEditor} = content;
  const cursor = markdownEditor.getCursor();
  markdownEditor.replaceSelection(text, cursor);
  content.setContent(markdownEditor.getValue());
}

// 七牛云对象存储上传
export const qiniuOSSUpload = async ({
  file = {},
  onSuccess = () => {},
  onError = () => {},
  onProgress = () => {},
  images = [],
  content = null, // store content
}) => {
  showUploadNoti();
  const config = JSON.parse(window.localStorage.getItem(QINIUOSS_IMAGE_HOSTING));
  try {
    let {domain} = config;
    const {namespace} = config;
    // domain可能配置时末尾没有加'/'
    if (domain[domain.length - 1] !== "/") {
      domain += "/";
    }
    const result = await axiosMdnice.get(`/qiniu/${config.bucket}/${config.accessKey}/${config.secretKey}`);
    const token = result.data;

    const base64Reader = new FileReader();

    base64Reader.readAsDataURL(file);

    base64Reader.onload = (e) => {
      const urlData = e.target.result;
      const base64 = urlData.split(",").pop();
      const fileType = urlData
        .split(";")
        .shift()
        .split(":")
        .pop();

      // base64转blob
      const blob = toBlob(base64, fileType);

      const conf = {
        useCdnDomain: true,
        region: qiniu.region[config.region], // 区域
      };

      const putExtra = {
        fname: "",
        params: {},
        mimeType: [] || null,
      };

      const OSSName = getOSSName(file.name, namespace);

      // 这里第一个参数的形式是blob
      const imageObservable = qiniu.upload(blob, OSSName, token, putExtra, conf);

      // 上传成功后回调
      const complete = (response) => {
        const names = file.name.split(".");
        names.pop();
        const filename = names.join(".");
        const image = {
          filename, // 名字不变并且去掉后缀
          url: encodeURI(`${domain}${response.key}`),
        };
        images.push(image);

        if (content) {
          writeToEditor({content, image});
        }
        onSuccess(response);
        setTimeout(() => {
          hideUploadNoti();
        }, 500);
      };

      // 上传过程回调
      const next = (response) => {
        const percent = Number.parseInt(Math.round(response.total.percent.toFixed(2)), 10);
        onProgress(
          {
            percent,
          },
          file,
        );
      };

      // 上传错误回调
      const error = (err) => {
        hideUploadNoti();
        uploadError();
        onError(err, err.toString());
      };

      const imageObserver = {
        next,
        error,
        complete,
      };
      // 注册 imageObserver 对象
      imageObservable.subscribe(imageObserver);
    };
  } catch (err) {
    onError(err, err.toString());
  }
};

// 用户自定义的图床上传
export const customImageUpload = async ({
  formData = new FormData(),
  file = {},
  onSuccess = () => {},
  onError = () => {},
  images = [],
  content = null,
}) => {
  showUploadNoti();
  try {
    formData.append("file", file);
    const config = {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    };
    const postURL = imageHosting.hostingUrl;
    const result = await axios.post(postURL, formData, config);
    const names = file.name.split(".");
    names.pop();
    const filename = names.join(".");
    const image = {
      filename,
      url: encodeURI(result.data.data), // 这里要和外接图床规定好数据逻辑，否则会接入失败
    };

    if (content) {
      writeToEditor({content, image});
    }
    images.push(image);
    onSuccess(result);
    setTimeout(() => {
      hideUploadNoti();
    }, 500);
  } catch (error) {
    message.destroy();
    uploadError(error.toString());
    onError(error, error.toString());
  }
};

// SM.MS存储上传
export const smmsUpload = ({
  formData = new FormData(),
  file = {},
  action = SM_MS_PROXY,
  onProgress = () => {},
  onSuccess = () => {},
  onError = () => {},
  headers = {},
  withCredentials = false,
  images = [],
  content = null, // store content
}) => {
  showUploadNoti();
  // SM.MS图床必须这里命名为smfile
  formData.append("smfile", file);
  axios
    .post(action, formData, {
      withCredentials,
      headers,
      onUploadProgress: ({total, loaded}) => {
        onProgress(
          {
            percent: Number.parseInt(Math.round((loaded / total) * 100).toFixed(2), 10),
          },
          file,
        );
      },
    })
    .then(({data: response}) => {
      if (response.code === "exception") {
        throw response.message;
      }
      const image = {
        filename: response.data.filename,
        url: response.data.url,
      };
      if (content) {
        writeToEditor({content, image});
      }
      images.push(image);
      onSuccess(response, file);
      setTimeout(() => {
        hideUploadNoti();
      }, 500);
    })
    .catch((error) => {
      hideUploadNoti();
      uploadError(error.toString());
      onError(error, error.toString());
    });
};

// 阿里对象存储，上传部分
const aliOSSPutObject = ({config, file, buffer, onSuccess, onError, images, content}) => {
  let client;
  try {
    client = new OSS(config);
  } catch (error) {
    message.error("OSS配置错误，请根据文档检查置项");
    return;
  }

  const OSSName = getOSSName(file.name);

  client
    .put(OSSName, buffer)
    .then((response) => {
      const names = file.name.split(".");
      names.pop();
      const filename = names.join(".");
      const image = {
        filename, // 名字不变并且去掉后缀
        url: response.url,
      };
      if (content) {
        writeToEditor({content, image});
      } else {
        images.push(image);
      }
      onSuccess(response, file);
      setTimeout(() => {
        hideUploadNoti();
      }, 500);
    })
    .catch((error) => {
      console.log(error);

      hideUploadNoti();
      uploadError("请根据文档检查配置项");
      onError(error, error.toString());
    });
};

// 阿里云对象存储上传，处理部分
export const aliOSSUpload = ({
  file = {},
  onSuccess = () => {},
  onError = () => {},
  images = [],
  content = null, // store content
}) => {
  showUploadNoti();
  const config = JSON.parse(window.localStorage.getItem(ALIOSS_IMAGE_HOSTING));
  const base64Reader = new FileReader();
  base64Reader.readAsDataURL(file);
  base64Reader.onload = (e) => {
    const urlData = e.target.result;
    const base64 = urlData.split(",").pop();
    const fileType = urlData
      .split(";")
      .shift()
      .split(":")
      .pop();

    // base64转blob
    const blob = toBlob(base64, fileType);

    // blob转arrayBuffer
    const bufferReader = new FileReader();
    bufferReader.readAsArrayBuffer(blob);
    bufferReader.onload = (event) => {
      const buffer = new OSS.Buffer(event.target.result);
      aliOSSPutObject({config, file, buffer, onSuccess, onError, images, content});
    };
  };
};

// Gitee存储上传
export const giteeUpload = ({
  formData = new FormData(),
  file = {},
  onProgress = () => {},
  onSuccess = () => {},
  onError = () => {},
  headers = {},
  withCredentials = false,
  images = [],
  content = null, // store content
}) => {
  showUploadNoti();

  if (file.size / 1024 / 1024 > 1) {
    message.warn("有图片超过 1 MB，无法使用");
  }

  const config = JSON.parse(window.localStorage.getItem(GITEE_IMAGE_HOSTING));

  const base64Reader = new FileReader();
  base64Reader.readAsDataURL(file);
  base64Reader.onload = (e) => {
    const urlData = e.target.result;
    const base64 = urlData.split(",").pop();

    const date = new Date();
    const seperator = "-";
    const dir = date.getFullYear() + seperator + (date.getMonth() + 1) + seperator + date.getDate();

    const dateFilename = `${new Date().getTime()}-${file.name}`;
    const url = `https://gitee.com/api/v5/repos/${config.username}/${config.repo}/contents/${dir}/${dateFilename}`;

    formData.append("content", base64);
    formData.append("access_token", config.token);
    formData.append("message", "mdnice upload picture");

    axios
      .post(url, formData, {
        withCredentials,
        headers,
        onUploadProgress: ({total, loaded}) => {
          onProgress(
            {
              percent: Number.parseInt(Math.round((loaded / total) * 100).toFixed(2), 10),
            },
            file,
          );
        },
      })
      .then(({data: response}) => {
        if (response.code === "exception") {
          throw response.message;
        }
        const names = file.name.split(".");
        names.pop();
        const filename = names.join(".");
        const image = {
          filename,
          url: response.content.download_url,
        };
        if (content) {
          writeToEditor({content, image});
        } else {
          images.push(image);
        }
        onSuccess(response);
        setTimeout(() => {
          hideUploadNoti();
        }, 500);
      })
      .catch((error, info) => {
        hideUploadNoti();
        uploadError(`${error.toString()} 可能存在图片名重复等问题`);
        onError(error, `${error.toString()} 可能存在图片名重复等问题`);
      });
  };
};

// GitHub存储上传
export const githubUpload = ({
  formData = new FormData(),
  file = {},
  onProgress = () => {},
  onSuccess = () => {},
  onError = () => {},
  headers = {},
  withCredentials = false,
  images = [],
  content = null, // store content
}) => {
  showUploadNoti();

  const config = JSON.parse(window.localStorage.getItem(GITHUB_IMAGE_HOSTING));

  // 验证配置
  if (!config || !config.username || !config.repo || !config.token) {
    const error = new Error("GitHub 图床配置不完整，请检查配置");
    uploadError(error.message);
    onError(error);
    return;
  }

  const base64Reader = new FileReader();
  base64Reader.readAsDataURL(file);
  base64Reader.onerror = () => {
    const error = new Error("文件读取失败");
    uploadError(error.message);
    onError(error);
  };

  base64Reader.onload = async (e) => {
    try {
      const urlData = e.target.result;
      const base64 = urlData.split(",").pop();

      // 构建文件路径
      const date = new Date();
      const seperator = "-";
      const dir = date.getFullYear() + seperator + (date.getMonth() + 1) + seperator + date.getDate();
      const dateFilename = `${new Date().getTime()}-${file.name}`;
      const path = `${dir}/${dateFilename}`;

      // 构建API URL（不包含token）
      const url = `https://api.github.com/repos/${config.username}/${config.repo}/contents/${path}`;

      // 准备请求数据
      const data = {
        message: "Upload by markdown2html",
        content: base64,
        branch: "main" // 指定分支
      };

      // 设置请求头
      const requestHeaders = {
        'Authorization': `token ${config.token}`,
        'Content-Type': 'application/json',
        ...headers
      };

      try {
        const response = await axios.put(url, data, {
          headers: requestHeaders,
          withCredentials,
          onUploadProgress: ({total, loaded}) => {
            onProgress(
              {
                percent: Number.parseInt(Math.round((loaded / total) * 100).toFixed(2), 10),
              },
              file,
            );
          },
        });

        if (response.status !== 201) {
          throw new Error(`GitHub API 响应异常: ${response.status}`);
        }

        const names = file.name.split(".");
        names.pop();
        const filename = names.join(".");

        const imageUrl = config.jsdelivr === "true"
          ? `https://cdn.jsdelivr.net/gh/${config.username}/${config.repo}/${path}`
          : response.data.content.download_url;

        const image = {
          filename,
          url: imageUrl,
        };

        if (content) {
          writeToEditor({content, image});
        } else {
          images.push(image);
        }

        onSuccess(response.data);
        setTimeout(() => {
          hideUploadNoti();
        }, 500);
      } catch (error) {
        console.error("GitHub upload error:", error);
        hideUploadNoti();
        let errorMessage = "图片上传失败";
        if (error.response) {
          switch (error.response.status) {
            case 401:
              errorMessage = "GitHub Token 无效或已期";
              break;
            case 403:
              errorMessage = "没有仓库写入权限，请检查 Token 权限设置";
              break;
            case 404:
              errorMessage = "仓库不存在或无访问权限";
              break;
            default:
              errorMessage = `上传失败: ${error.response.status} ${error.response.statusText}`;
          }
        }
        uploadError(errorMessage);
        onError(error, errorMessage);
      }
    } catch (error) {
      console.error("File processing error:", error);
      hideUploadNoti();
      uploadError("文件处理失败");
      onError(error, "文件处理失败");
    }
  };
};

// 修改腾讯云上传函数
const tencentCOSUpload = ({file, onSuccess = () => {}, onError = () => {}, onProgress = () => {}, images = [], content = null}) => {
  showUploadNoti();
  const config = JSON.parse(window.localStorage.getItem(TENCENT_IMAGE_HOSTING));
  if (!config || !config.secretId || !config.secretKey || !config.bucket || !config.region) {
    message.error("请先配置腾讯云 COS 参数");
    onError(new Error("配置信息不完整"));
    return;
  }

  const cos = new COS({
    SecretId: config.secretId,
    SecretKey: config.secretKey
  });

  const date = new Date();
  const path = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
  const fileName = `${path}/${Date.now()}-${file.name}`;

  cos.putObject({
    Bucket: config.bucket,
    Region: config.region,
    Key: fileName,
    Body: file,
    onProgress: (progressData) => {
      const percent = Number.parseInt(Math.round((progressData.loaded / progressData.total) * 100).toFixed(2), 10);
      onProgress({percent}, file);
    }
  }, (err, data) => {
    hideUploadNoti();
    if (err) {
      uploadError(`上传失败：${err.message}`);
      onError(err);
      return;
    }
    
    const url = `https://${config.bucket}.cos.${config.region}.myqcloud.com/${fileName}`;
    const names = file.name.split(".");
    names.pop();
    const filename = names.join(".");
    const image = {
      filename,
      url
    };

    // 只在 content 存在时写入编辑器��避免重复写入
    if (content) {
      writeToEditor({content, image});
    } else {
      // 如果没有 content，则只添加到 images 数组
      images.push(image);
    }
    
    onSuccess(image);
    setTimeout(() => {
      hideUploadNoti();
    }, 500);
  });
};

// 自动检测上传配置，进行上传
export const uploadAdaptor = ({formData = new FormData(), file, action, onProgress = () => {}, onSuccess = () => {}, onError = () => {}, headers = {}, withCredentials = false, images = [], content = null}) => {
  const type = localStorage.getItem(IMAGE_HOSTING_TYPE);
  const userType = imageHosting.hostingName;
  
  if (type === userType) {
    return customImageUpload({formData, file, onSuccess, onError, images, content});
  }
  
  if (type === IMAGE_HOSTING_NAMES.smms) {
    return smmsUpload({formData, file, action, onProgress, onSuccess, onError, headers, withCredentials, images, content});
  }
  
  if (type === IMAGE_HOSTING_NAMES.qiniuyun) {
    const config = JSON.parse(window.localStorage.getItem(QINIUOSS_IMAGE_HOSTING));
    if (
      !config.region.length ||
      !config.accessKey.length ||
      !config.secretKey.length ||
      !config.bucket.length ||
      !config.domain.length
    ) {
      message.error("请先配置七牛云图床");
      return false;
    }
    return qiniuOSSUpload({file, onSuccess, onError, onProgress, images, content});
  }
  
  if (type === IMAGE_HOSTING_NAMES.aliyun) {
    const config = JSON.parse(window.localStorage.getItem(ALIOSS_IMAGE_HOSTING));
    if (
      !config.region.length ||
      !config.accessKeyId.length ||
      !config.accessKeySecret.length ||
      !config.bucket.length
    ) {
      message.error("请先配置阿里云图床");
      return false;
    }
    return aliOSSUpload({file, onSuccess, onError, images, content});
  }
  
  if (type === IMAGE_HOSTING_NAMES.gitee) {
    const config = JSON.parse(window.localStorage.getItem(GITEE_IMAGE_HOSTING));
    if (!config.username.length || !config.repo.length || !config.token.length) {
      message.error("请先配置 Gitee 图床");
      return false;
    }
    return giteeUpload({formData, file, onProgress, onSuccess, onError, headers, withCredentials, images, content});
  }
  
  if (type === IMAGE_HOSTING_NAMES.github) {
    const config = JSON.parse(window.localStorage.getItem(GITHUB_IMAGE_HOSTING));
    if (!config.username.length || !config.repo.length || !config.token.length) {
      message.error("请先配置 GitHub 图床");
      return false;
    }
    return githubUpload({formData, file, onProgress, onSuccess, onError, headers, withCredentials, images, content});
  }
  
  if (type === IMAGE_HOSTING_NAMES.tencent) {
    const config = JSON.parse(window.localStorage.getItem(TENCENT_IMAGE_HOSTING));
    if (!config || !config.secretId || !config.secretKey || !config.bucket || !config.region) {
      message.error("请先配置腾讯云 COS 参数");
      return false;
    }
    return tencentCOSUpload({file, onSuccess, onError, onProgress, images, content});
  }
  
  return true;
}; 