import { ImageBedConfig, ImageBedType } from './types';

export class ImageBedConfigManager {
  private static instance: ImageBedConfigManager;
  private currentConfig: ImageBedConfig | null = null;

  private constructor() {}

  static getInstance(): ImageBedConfigManager {
    if (!ImageBedConfigManager.instance) {
      ImageBedConfigManager.instance = new ImageBedConfigManager();
    }
    return ImageBedConfigManager.instance;
  }

  loadConfig(): ImageBedConfig {
    if (this.currentConfig) {
      return this.currentConfig;
    }

    const type = process.env.IMAGE_BED_TYPE as ImageBedType;
    
    switch (type) {
      case 'alioss':
        this.currentConfig = {
          type: 'alioss',
          config: {
            accessKeyId: process.env.ALIOSS_ACCESS_KEY_ID || '',
            accessKeySecret: process.env.ALIOSS_ACCESS_KEY_SECRET || '',
            bucket: process.env.ALIOSS_BUCKET || '',
            region: process.env.ALIOSS_REGION || '',
            endpoint: process.env.ALIOSS_ENDPOINT || ''
          }
        };
        break;

      case 'qiniu':
        this.currentConfig = {
          type: 'qiniu',
          config: {
            accessKey: process.env.QINIU_ACCESS_KEY || '',
            secretKey: process.env.QINIU_SECRET_KEY || '',
            bucket: process.env.QINIU_BUCKET || '',
            domain: process.env.QINIU_DOMAIN || ''
          }
        };
        break;

      default:
        throw new Error(`Unsupported image bed type: ${type}`);
    }

    this.validateConfig(this.currentConfig);
    return this.currentConfig;
  }

  private validateConfig(config: ImageBedConfig): void {
    const requiredFields: Record<ImageBedType, string[]> = {
      alioss: ['accessKeyId', 'accessKeySecret', 'bucket', 'region'],
      qiniu: ['accessKey', 'secretKey', 'bucket', 'domain'],
      github: ['token', 'owner', 'repo']
    };

    const fields = requiredFields[config.type];
    const missingFields = fields.filter(field => !config.config[field]);

    if (missingFields.length > 0) {
      throw new Error(
        `Missing required configuration fields for ${config.type}: ${missingFields.join(', ')}`
      );
    }
  }

  updateConfig(config: ImageBedConfig): void {
    this.validateConfig(config);
    this.currentConfig = config;
  }
}
