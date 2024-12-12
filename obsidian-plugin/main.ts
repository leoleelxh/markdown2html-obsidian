import { Notice, Plugin } from 'obsidian';
import type { App, Editor, MarkdownView, TFile } from 'obsidian';

export default class Markdown2HTMLPlugin extends Plugin {
    async onload() {
        // 添加新的复制功能按钮,使用 file-text 图标以区分其他插件
        this.addRibbonIcon('file-text', '复制到 Markdown2HTML', async () => {
            const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
            if (activeView) {
                const editor = activeView.editor;
                const content = editor.getValue();
                
                try {
                    // 处理文档中的图片路径
                    const processedContent = await this.processLocalImages(content, activeView.file);
                    
                    // 添加标记，表明这是来自 Obsidian 的内容
                    const markedContent = this.addObsidianMark(processedContent);
                    
                    // 复制到剪贴板
                    await navigator.clipboard.writeText(markedContent);
                    new Notice('内容已复制到剪贴板');
                } catch (error: any) {
                    console.error('Error:', error);
                    new Notice(`复制失败：${error.message}`);
                }
            } else {
                new Notice('请先打开一个 Markdown 文件');
            }
        });

        // 添加复制命令
        this.addCommand({
            id: 'copy-to-markdown2html',
            name: '复制当前文档到剪贴板',
            editorCallback: async (editor: Editor, view: MarkdownView) => {
                const content = editor.getValue();
                try {
                    const processedContent = await this.processLocalImages(content, view.file);
                    const markedContent = this.addObsidianMark(processedContent);
                    await navigator.clipboard.writeText(markedContent);
                    new Notice('内容已复制到剪贴板');
                } catch (error: any) {
                    console.error('Error:', error);
                    new Notice(`复制失败：${error.message}`);
                }
            }
        });
    }

    // 处理本地图片路径
    async processLocalImages(content: string, currentFile: TFile | null): Promise<string> {
        if (!currentFile) {
            return content;
        }

        const imageRegex = /!\[(.*?)\]\((.*?)\)/g;
        const vault = this.app.vault;
        let processedContent = content;
        let match: RegExpExecArray | null;
        
        while (match = imageRegex.exec(content)) {
            const [fullMatch, altText, imagePath] = match;
            
            // 检查是否是本地图片（不是 http/https 链接）
            if (!imagePath.startsWith('http://') && !imagePath.startsWith('https://')) {
                try {
                    // 解析图片路径
                    const resolvedPath = this.resolveImagePath(imagePath, currentFile);
                    const imageFile = vault.getAbstractFileByPath(resolvedPath);
                    
                    if (imageFile instanceof TFile) {
                        // 读取图片文件的二进制数据
                        const arrayBuffer = await vault.readBinary(imageFile);
                        const base64String = this.arrayBufferToBase64(arrayBuffer);
                        const mimeType = this.getMimeType(imageFile.extension);
                        
                        // 创建 base64 数据 URL
                        const dataUrl = `data:${mimeType};base64,${base64String}`;
                        
                        // 使用特殊标记包装图片数据
                        const newImageMark = `![${altText}](obsidian-base64://${dataUrl})`;
                        processedContent = processedContent.replace(fullMatch, newImageMark);
                    }
                } catch (error) {
                    console.error('Error processing image path:', error);
                }
            }
        }

        return processedContent;
    }

    // 解析图片路径（相对于当前文件）
    resolveImagePath(imagePath: string, currentFile: TFile): string {
        if (imagePath.startsWith('/')) {
            // 如果是以 / 开头的绝对路径，直接返回（去掉开头的 /）
            return imagePath.slice(1);
        }
        
        // 获取当前文件所在的目录
        const currentDir = currentFile.parent?.path || '';
        
        // 如果图片路径以 ./ 开头，去掉它
        if (imagePath.startsWith('./')) {
            imagePath = imagePath.slice(2);
        }
        
        // 如果当前目录不为空，拼接路径
        return currentDir ? `${currentDir}/${imagePath}` : imagePath;
    }

    // 将 ArrayBuffer 转换为 base64 字符串
    arrayBufferToBase64(buffer: ArrayBuffer): string {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    }

    // 根据文件扩展名获取 MIME 类型
    getMimeType(extension: string): string {
        const mimeTypes: { [key: string]: string } = {
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'gif': 'image/gif',
            'webp': 'image/webp',
            'svg': 'image/svg+xml'
        };
        return mimeTypes[extension.toLowerCase()] || 'image/png';
    }

    // 添加 Obsidian 标记
    addObsidianMark(content: string): string {
        return `<!--obsidian-markdown2html-start-->\n${content}\n<!--obsidian-markdown2html-end-->`;
    }
} 