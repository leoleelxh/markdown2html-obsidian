import React, { useState, useEffect } from 'react';
import { ImageProcessor } from '../../utils/markdown/imageProcessor';
import './ImageCompressPreview.css';

interface ImageCompressPreviewProps {
  file: File;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  onConfirm: (file: File) => void;
  onCancel: () => void;
}

export const ImageCompressPreview: React.FC<ImageCompressPreviewProps> = ({
  file,
  maxWidth = 1920,
  maxHeight = 1080,
  quality = 0.8,
  onConfirm,
  onCancel,
}) => {
  const [originalPreview, setOriginalPreview] = useState<string>('');
  const [compressedPreview, setCompressedPreview] = useState<string>('');
  const [compressedFile, setCompressedFile] = useState<File | null>(null);
  const [originalSize, setOriginalSize] = useState<string>('');
  const [compressedSize, setCompressedSize] = useState<string>('');

  useEffect(() => {
    const loadPreviews = async () => {
      // 显示原始图片预览
      const originalUrl = URL.createObjectURL(file);
      setOriginalPreview(originalUrl);
      setOriginalSize(formatFileSize(file.size));

      try {
        // 压缩图片
        const compressed = await ImageProcessor.compressImage(
          file,
          maxWidth,
          maxHeight,
          quality
        );

        // 显示压缩后的预览
        const compressedUrl = URL.createObjectURL(compressed);
        setCompressedPreview(compressedUrl);
        setCompressedFile(compressed);
        setCompressedSize(formatFileSize(compressed.size));
      } catch (error) {
        console.error('Image compression failed:', error);
      }
    };

    loadPreviews();

    return () => {
      // 清理预览URL
      if (originalPreview) URL.revokeObjectURL(originalPreview);
      if (compressedPreview) URL.revokeObjectURL(compressedPreview);
    };
  }, [file, maxWidth, maxHeight, quality]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const handleConfirm = () => {
    if (compressedFile) {
      onConfirm(compressedFile);
    }
  };

  return (
    <div className="image-compress-preview">
      <div className="preview-header">
        <h3>图片压缩预览</h3>
        <button className="close-button" onClick={onCancel}>×</button>
      </div>
      
      <div className="preview-container">
        <div className="preview-item">
          <h4>原始图片</h4>
          <img src={originalPreview} alt="Original" />
          <div className="image-info">
            <span>大小: {originalSize}</span>
          </div>
        </div>
        
        <div className="preview-item">
          <h4>压缩后</h4>
          <img src={compressedPreview} alt="Compressed" />
          <div className="image-info">
            <span>大小: {compressedSize}</span>
            <span>压缩率: {compressedFile ? 
              Math.round((1 - compressedFile.size / file.size) * 100) + '%' 
              : '0%'}
            </span>
          </div>
        </div>
      </div>

      <div className="preview-actions">
        <button 
          className="confirm-button"
          onClick={handleConfirm}
          disabled={!compressedFile}
        >
          确认使用压缩后的图片
        </button>
        <button 
          className="cancel-button"
          onClick={() => onConfirm(file)}
        >
          使用原始图片
        </button>
      </div>
    </div>
  );
};
