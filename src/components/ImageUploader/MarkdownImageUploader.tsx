import React, { useCallback } from 'react';
import { useImageUpload } from './hooks/useImageUpload';
import { ImageProcessor } from '../../utils/markdown/imageProcessor';

interface MarkdownImageUploaderProps {
  value: string;
  onChange: (value: string) => void;
  onUploadStart?: () => void;
  onUploadComplete?: () => void;
  onUploadError?: (error: Error) => void;
}

export const MarkdownImageUploader: React.FC<MarkdownImageUploaderProps> = ({
  value,
  onChange,
  onUploadStart,
  onUploadComplete,
  onUploadError,
}) => {
  const { upload, uploading } = useImageUpload({
    compress: process.env.IMAGE_COMPRESS_ENABLED === 'true',
    maxWidth: Number(process.env.IMAGE_MAX_WIDTH) || 1920,
    maxHeight: Number(process.env.IMAGE_MAX_HEIGHT) || 1080,
    quality: Number(process.env.IMAGE_QUALITY) || 0.8,
    onError: onUploadError,
  });

  // 处理粘贴事件
  const handlePaste = useCallback(
    async (event: React.ClipboardEvent) => {
      const items = Array.from(event.clipboardData.items);
      const imageItems = items.filter(item => item.type.startsWith('image/'));

      if (imageItems.length === 0) {
        return;
      }

      event.preventDefault();
      onUploadStart?.();

      try {
        for (const item of imageItems) {
          const file = item.getAsFile();
          if (!file) continue;

          const result = await upload(file);
          
          // 在光标位置插入图片
          const selection = window.getSelection();
          const range = selection?.getRangeAt(0);
          
          if (range) {
            const imageMarkdown = `![${file.name}](${result.url})\\n`;
            const start = value.substring(0, range.startOffset);
            const end = value.substring(range.endOffset);
            onChange(start + imageMarkdown + end);
          } else {
            // 如果没有选择范围，追加到末尾
            onChange(value + `\\n![${file.name}](${result.url})\\n`);
          }
        }
        onUploadComplete?.();
      } catch (error) {
        console.error('Upload failed:', error);
        onUploadError?.(error instanceof Error ? error : new Error('Upload failed'));
      }
    },
    [upload, value, onChange, onUploadStart, onUploadComplete, onUploadError]
  );

  // 处理拖放事件
  const handleDrop = useCallback(
    async (event: React.DragEvent) => {
      const items = Array.from(event.dataTransfer.files);
      const imageFiles = items.filter(file => ImageProcessor.isImageFile(file));

      if (imageFiles.length === 0) {
        return;
      }

      event.preventDefault();
      onUploadStart?.();

      try {
        for (const file of imageFiles) {
          const result = await upload(file);
          onChange(value + `\\n![${file.name}](${result.url})\\n`);
        }
        onUploadComplete?.();
      } catch (error) {
        console.error('Upload failed:', error);
        onUploadError?.(error instanceof Error ? error : new Error('Upload failed'));
      }
    },
    [upload, value, onChange, onUploadStart, onUploadComplete, onUploadError]
  );

  // 处理本地图片上传
  const handleLocalImages = useCallback(async () => {
    const images = ImageProcessor.extractImagesFromMarkdown(value);
    const localImages = images.filter(img => !img.path.startsWith('http'));

    if (localImages.length === 0) {
      return;
    }

    onUploadStart?.();

    try {
      let newContent = value;
      for (const img of localImages) {
        try {
          const response = await fetch(img.path);
          const blob = await response.blob();
          const file = new File([blob], img.path.split('/').pop() || 'image.png', {
            type: blob.type,
          });

          const result = await upload(file);
          newContent = ImageProcessor.replaceImagePath(
            newContent,
            img.path,
            result.url
          );
        } catch (error) {
          console.error(`Failed to process image ${img.path}:`, error);
        }
      }
      onChange(newContent);
      onUploadComplete?.();
    } catch (error) {
      console.error('Upload failed:', error);
      onUploadError?.(error instanceof Error ? error : new Error('Upload failed'));
    }
  }, [value, upload, onChange, onUploadStart, onUploadComplete, onUploadError]);

  return (
    <div
      onPaste={handlePaste}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      style={{ width: '100%', height: '100%' }}
    >
      {/* 这里可以放置编辑器组件 */}
      {uploading && <div className="upload-indicator">Uploading...</div>}
    </div>
  );
};
