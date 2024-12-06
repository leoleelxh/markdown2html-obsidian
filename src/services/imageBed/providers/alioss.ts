import OSS from 'ali-oss';
import { IImageBedService, ImageBedConfig, UploadResult } from '../types';

export class AliOssImageBed implements IImageBedService {
  private client: OSS;
  private config: ImageBedConfig;

  constructor(config: ImageBedConfig) {
    if (config.type !== 'alioss') {
      throw new Error('Invalid config type for AliOSS');
    }

    const { accessKeyId, accessKeySecret, bucket, region, endpoint } = config.config;
    
    this.client = new OSS({
      accessKeyId,
      accessKeySecret,
      bucket,
      region,
      endpoint,
    });

    this.config = config;
  }

  async upload(file: File): Promise<UploadResult> {
    try {
      // 生成唯一的文件名
      const filename = `${Date.now()}-${file.name}`;
      
      // 上传文件
      const result = await this.client.put(filename, file);
      
      if (!result.url) {
        throw new Error('Upload failed: No URL returned');
      }

      return {
        url: result.url,
        filename: filename,
        size: file.size,
      };
    } catch (error) {
      console.error('AliOSS upload error:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  async delete(url: string): Promise<boolean> {
    try {
      // 从 URL 中提取文件名
      const filename = url.split('/').pop();
      if (!filename) {
        throw new Error('Invalid URL');
      }

      await this.client.delete(filename);
      return true;
    } catch (error) {
      console.error('AliOSS delete error:', error);
      return false;
    }
  }

  getConfig(): ImageBedConfig {
    return this.config;
  }
}
