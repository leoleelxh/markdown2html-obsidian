import {uploadAdaptor} from "../imageHosting";
import {message} from "antd";

// 检查是否是图片文件
export const isImageFile = (file) => {
  return file.type.startsWith('image/');
};

// 从 Markdown 文本中提取图片信息
export const extractImagesFromMarkdown = (markdown) => {
  const images = [];
  // 匹配三种格式：标准Markdown、微信@格式、HTML img标签
  const imageRegex = /(?:!\[(.*?)\]\((.*?)(?:\s+"(.*?)")?\)|@(https?:\/\/[^\s<]+?(?:\.jpg|\.jpeg|\.png|\.gif))|<img[^>]+src=["']([^"']+)["'])/gi;
  let match;
  
  while ((match = imageRegex.exec(markdown)) !== null) {
    images.push({
      alt: match[1] || '',
      // match[2]是Markdown格式, match[4]是@格式, match[5]是img标签格式
      path: match[2] || match[4] || match[5],
      title: match[3] || ''
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
  const escapedOldPath = oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // 匹配所有可能的图片格式
  const regex = new RegExp(
    `(!\\[.*?\\])\\(${escapedOldPath}(?:\\s+".*?")?\\)|` +
    `@${escapedOldPath}|` +
    `<img[^>]*src=["']${escapedOldPath}["']`,
    'g'
  );

  return markdown.replace(regex, (match) => {
    if (match.startsWith('@')) {
      // 微信格式转换为标准Markdown
      return `![](${newPath})`;
    } else if (match.startsWith('<img')) {
      // HTML格式替换src
      return match.replace(oldPath, newPath);
    } else {
      // 标准Markdown格式替换路径
      return match.replace(oldPath, newPath);
    }
  });
};

// 处理外部图片
export const processExternalImages = async (
  markdown,
  content,
  onProgress
) => {
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
        const blob = await response.blob();
        
        // 根据 URL 和 Content-Type 生成文件名
        const urlParts = img.path.split('/');
        const fileName = urlParts[urlParts.length - 1].split('?')[0] || 'image.png';
        const file = new File([blob], fileName, { type: blob.type || 'image/png' });

        // 上传到配置的图床
        const result = await new Promise((resolve, reject) => {
          uploadAdaptor({
            file,
            content,
            onSuccess: (response) => resolve(response),
            onError: (error) => reject(error)
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
        message.error(`处理图片失败: ${img.path}`);
      }
    }

    return processedMarkdown;
  } catch (error) {
    console.error('处理外部图片失败:', error);
    message.error('处理外部图片失败');
    return markdown;
  }
};