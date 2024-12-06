import { GitHubImageUploader, createGitHubImageUploader } from './GitHubImageUploader';

export type ImageHostingType = 'GitHub' | 'Other';

export interface ImageUploader {
  uploadImage(file: File): Promise<string>;
}

export class ImageUploaderFactory {
  private static instance: ImageUploaderFactory;
  private uploaders: Map<ImageHostingType, ImageUploader>;

  private constructor() {
    this.uploaders = new Map();
    this.initializeUploaders();
  }

  public static getInstance(): ImageUploaderFactory {
    if (!ImageUploaderFactory.instance) {
      ImageUploaderFactory.instance = new ImageUploaderFactory();
    }
    return ImageUploaderFactory.instance;
  }

  private initializeUploaders() {
    // Initialize GitHub uploader
    const githubUploader = createGitHubImageUploader();
    this.uploaders.set('GitHub', githubUploader);
  }

  public getUploader(type: ImageHostingType): ImageUploader {
    const uploader = this.uploaders.get(type);
    if (!uploader) {
      throw new Error(`No uploader found for type: ${type}`);
    }
    return uploader;
  }
}
