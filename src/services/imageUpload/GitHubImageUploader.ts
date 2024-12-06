import { nanoid } from 'nanoid';

interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
  branch: string;
  path: string;
}

export class GitHubImageUploader {
  private config: GitHubConfig;

  constructor(config: GitHubConfig) {
    this.config = config;
  }

  async uploadImage(file: File): Promise<string> {
    try {
      const content = await this.getBase64(file);
      const fileName = `${nanoid()}_${file.name}`;
      const path = `${this.config.path}${fileName}`;

      const response = await fetch(`https://api.github.com/repos/${this.config.owner}/${this.config.repo}/contents/${path}`, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${this.config.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Upload image: ${fileName}`,
          content: content.split(',')[1],
          branch: this.config.branch,
        }),
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.content.download_url;
    } catch (error) {
      console.error('Failed to upload image to GitHub:', error);
      throw error;
    }
  }

  private getBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }
}

export const createGitHubImageUploader = (): GitHubImageUploader => {
  const config = {
    token: process.env.GITHUB_TOKEN || '',
    owner: process.env.GITHUB_OWNER || '',
    repo: process.env.GITHUB_REPO || '',
    branch: process.env.GITHUB_BRANCH || 'main',
    path: process.env.GITHUB_PATH || 'images/',
  };

  return new GitHubImageUploader(config);
};
