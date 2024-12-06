import { ImageBedConfig, IImageBedService } from '../types';
import { AliOssImageBed } from './alioss';
import { QiniuImageBed } from './qiniu';

export class ImageBedFactory {
  static createProvider(config: ImageBedConfig): IImageBedService {
    switch (config.type) {
      case 'alioss':
        return new AliOssImageBed(config);
      case 'qiniu':
        return new QiniuImageBed(config);
      default:
        throw new Error(`Unsupported image bed type: ${config.type}`);
    }
  }
}
