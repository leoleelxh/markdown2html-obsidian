import React, { useState, useEffect } from 'react';
import { ImageBedFactory } from '../../services/imageBed/providers/factory';
import { ImageBedConfigManager } from '../../services/imageBed/config';
import './ImageManager.css';

interface ImageInfo {
  url: string;
  filename: string;
  uploadTime: string;
  size?: string;
}

export const ImageManager: React.FC = () => {
  const [images, setImages] = useState<ImageInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<ImageInfo | null>(null);

  // 加载图片列表
  const loadImages = async () => {
    setLoading(true);
    setError(null);

    try {
      // 这里应该从本地存储或后端API获取图片列表
      // 目前只是示例数据
      const mockImages: ImageInfo[] = [
        {
          url: 'https://example.com/image1.jpg',
          filename: 'image1.jpg',
          uploadTime: new Date().toISOString(),
          size: '1.2MB'
        }
      ];
      setImages(mockImages);
    } catch (err) {
      setError('Failed to load images');
      console.error('Load images failed:', err);
    } finally {
      setLoading(false);
    }
  };

  // 删除图片
  const handleDelete = async (image: ImageInfo) => {
    if (!window.confirm('确定要删除这张图片吗？')) {
      return;
    }

    try {
      const config = ImageBedConfigManager.getInstance().loadConfig();
      const imageBedService = ImageBedFactory.createProvider(config);

      if (imageBedService.delete) {
        await imageBedService.delete(image.url);
        setImages(images.filter(img => img.url !== image.url));
      }
    } catch (err) {
      console.error('Delete image failed:', err);
      setError('删除图片失败');
    }
  };

  // 复制图片URL
  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url)
      .then(() => {
        // 可以添加一个临时的成功提示
        console.log('URL copied to clipboard');
      })
      .catch(err => {
        console.error('Copy failed:', err);
        setError('复制失败');
      });
  };

  useEffect(() => {
    loadImages();
  }, []);

  return (
    <div className="image-manager">
      <div className="manager-header">
        <h2>图片管理</h2>
        <button onClick={loadImages} disabled={loading}>
          刷新
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {loading ? (
        <div className="loading">加载中...</div>
      ) : (
        <div className="image-grid">
          {images.map((image) => (
            <div
              key={image.url}
              className="image-item"
              onClick={() => setSelectedImage(image)}
            >
              <img src={image.url} alt={image.filename} />
              <div className="image-info">
                <span className="filename">{image.filename}</span>
                <span className="upload-time">
                  {new Date(image.uploadTime).toLocaleString()}
                </span>
                {image.size && <span className="size">{image.size}</span>}
              </div>
              <div className="image-actions">
                <button onClick={(e) => {
                  e.stopPropagation();
                  handleCopy(image.url);
                }}>
                  复制链接
                </button>
                <button
                  className="delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(image);
                  }}
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedImage && (
        <div className="image-preview-modal">
          <div className="modal-content">
            <button
              className="close-button"
              onClick={() => setSelectedImage(null)}
            >
              ×
            </button>
            <img src={selectedImage.url} alt={selectedImage.filename} />
            <div className="image-details">
              <p>文件名：{selectedImage.filename}</p>
              <p>上传时间：{new Date(selectedImage.uploadTime).toLocaleString()}</p>
              {selectedImage.size && <p>大小：{selectedImage.size}</p>}
              <p>URL：{selectedImage.url}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
