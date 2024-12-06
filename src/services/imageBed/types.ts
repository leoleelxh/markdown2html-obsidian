export type ImageBedType = 'alioss' | 'qiniu' | 'github';

export interface ImageBedConfig {
  type: ImageBedType;
  config: Record<string, string>;
}

export interface UploadResult {
  url: string;
  width?: number;
  height?: number;
  size?: number;
  filename?: string;
}

export interface IImageBedService {
  // 上传图片
  upload(file: File): Promise<UploadResult>;
  // 删除图片（可选实现）
  delete?(url: string): Promise<boolean>;
  // 获取当前配置
  getConfig(): ImageBedConfig;
}
