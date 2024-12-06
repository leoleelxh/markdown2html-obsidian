import { useState, useCallback } from 'react';
import { ImageBedFactory } from '../../../services/imageBed/providers/factory';
import { ImageBedConfigManager } from '../../../services/imageBed/config';
import { ImageProcessor } from '../../../utils/markdown/imageProcessor';
import { UploadResult } from '../../../services/imageBed/types';

interface UseImageUploadOptions {
  compress?: boolean;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  onSuccess?: (result: UploadResult) => void;
  onError?: (error: Error) => void;
  onProgress?: (percent: number) => void;
}

interface UseImageUploadResult {
  upload: (file: File) => Promise<UploadResult>;
  uploading: boolean;
  progress: number;
  error: Error | null;
}

export function useImageUpload(options: UseImageUploadOptions = {}): UseImageUploadResult {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const upload = useCallback(
    async (file: File): Promise<UploadResult> => {
      try {
        setUploading(true);
        setProgress(0);
        setError(null);

        // 验证文件类型
        if (!ImageProcessor.isImageFile(file)) {
          throw new Error('Invalid file type. Only images are allowed.');
        }

        // 压缩图片（如果需要）
        let processedFile = file;
        if (options.compress) {
          processedFile = await ImageProcessor.compressImage(
            file,
            options.maxWidth,
            options.maxHeight,
            options.quality
          );
        }

        // 获取图床配置并创建服务实例
        const config = ImageBedConfigManager.getInstance().loadConfig();
        const imageBedService = ImageBedFactory.createProvider(config);

        // 上传图片
        const result = await imageBedService.upload(processedFile);

        // 调用成功回调
        options.onSuccess?.(result);
        setProgress(100);

        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Upload failed');
        setError(error);
        options.onError?.(error);
        throw error;
      } finally {
        setUploading(false);
      }
    },
    [options]
  );

  return {
    upload,
    uploading,
    progress,
    error,
  };
}
