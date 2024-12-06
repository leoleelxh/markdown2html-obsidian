import {uploadAdaptor} from "../imageHosting";
import {message} from "antd";

// 检查是否是图片文件
export const isImageFile = (file) => {
  return file.type.startsWith('image/');
};

// 从 Markdown 文本中提取图片信息
export const extractImagesFromMarkdown = (markdown) => {
  const images = [];
  // 匹配 markdown 图片语法: ![alt](url "title")
  const imageRegex = /!\[(.*?)\]\((.*?)(?:\s+"(.*?)")?\)/g;
  let match;
  
  while ((match = imageRegex.exec(markdown)) !== null) {
    images.push({
      alt: match[1],
      path: match[2],
      title: match[3]
    });
  }

  return images;
};

// 压缩图片
export const compressImage = async (
  file,
  maxWidth = 1920,
  maxHeight = 1080,
  quality = 0.8
) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // 计算缩放比例
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image'));
            return;
          }
          resolve(new File([blob], file.name, { type: file.type }));
        },
        file.type,
        quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

// 替换 Markdown 中的图片路径
export const replaceImagePath = (markdown, oldPath, newPath) => {
  // 转义正则表达式中的特殊字符
  const escapedOldPath = oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(!\\[.*?\\])\\(${escapedOldPath}(?:\\s+".*?")?\\)`, 'g');
  return markdown.replace(regex, `$1(${newPath})`);
};

// 处理外部图片
export const processExternalImages = async (markdown, content, onProgress) => {
  try {
    const images = extractImagesFromMarkdown(markdown);
    const externalImages = images.filter(img => img.path.startsWith('http'));
    
    if (externalImages.length === 0) {
      return markdown;
    }

    message.info(`检测到 ${externalImages.length} 张外部图片，开始处理...`);
    let processedMarkdown = markdown;
    
    for (let i = 0; i < externalImages.length; i++) {
      const img = externalImages[i];
      try {
        // 下载图片
        const response = await fetch(img.path);
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.statusText}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.startsWith('image/')) {
          throw new Error('Invalid image content type');
        }

        const blob = await response.blob();
        if (blob.size === 0) {
          throw new Error('Empty image file');
        }

        // 根据 URL 和 Content-Type 生成文件名
        const urlParts = img.path.split('/');
        let fileName = urlParts[urlParts.length - 1].split('?')[0];
        if (!fileName || fileName.indexOf('.') === -1) {
          const ext = contentType.split('/')[1] || 'png';
          fileName = `image-${Date.now()}.${ext}`;
        }

        const file = new File([blob], fileName, { type: contentType });

        // 上传到配置的图床
        const result = await new Promise((resolve, reject) => {
          uploadAdaptor({
            file,
            content,
            onSuccess: (response) => resolve(response),
            onError: (error) => reject(error),
            images: []
          });
        });

        // 替换图片链接
        if (result && result.url) {
          processedMarkdown = replaceImagePath(processedMarkdown, img.path, result.url);
          message.success(`成功处理图片: ${fileName}`);
        }

        // 更新进度
        if (onProgress) {
          onProgress(i + 1, externalImages.length);
        }
      } catch (error) {
        console.error(`处理图片失败: ${img.path}`, error);
        message.error(`处理图片失败: ${img.path} - ${error.message}`);
      }
    }

    return processedMarkdown;
  } catch (error) {
    console.error('处理外部图片失败:', error);
    message.error('处理外部图片失败');
    return markdown;
  }
};
