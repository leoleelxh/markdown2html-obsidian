import * as qiniu from 'qiniu-js';
import { IImageBedService, ImageBedConfig, UploadResult } from '../types';

export class QiniuImageBed implements IImageBedService {
  private config: ImageBedConfig;

  constructor(config: ImageBedConfig) {
    if (config.type !== 'qiniu') {
      throw new Error('Invalid config type for Qiniu');
    }
    this.config = config;
  }

  async upload(file: File): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const { accessKey, secretKey, bucket, domain } = this.config.config;
      
      // 生成上传凭证（实际项目中应该从后端获取）
      const token = this.getUploadToken();
      const filename = `${Date.now()}-${file.name}`;
      
      const observable = qiniu.upload(file, filename, token, {}, {
        useCdnDomain: true,
      });

      observable.subscribe({
        next: (result) => {
          // 处理上传进度
          console.log('Upload progress:', result.total.percent);
        },
        error: (err) => {
          console.error('Qiniu upload error:', err);
          reject(new Error(`Upload failed: ${err.message}`));
        },
        complete: (res) => {
          const url = `${domain}/${res.key}`;
          resolve({
            url,
            filename: res.key,
            size: file.size,
          });
        },
      });
    });
  }

  private getUploadToken(): string {
    // 注意：实际项目中，上传凭证应该从后端获取，而不是在前端生成
    // 这里仅作示例
    throw new Error('Upload token should be obtained from backend');
  }

  getConfig(): ImageBedConfig {
    return this.config;
  }
}
