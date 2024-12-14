import { Notice, Plugin, MarkdownView, TFile } from 'obsidian';
import type { App, Editor } from 'obsidian';

interface ClipboardError extends Error {
    message: string;
}

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
                    const processedContent = await this.processImages(content, activeView.file);
                    
                    // 复制到剪贴板
                    await navigator.clipboard.writeText(processedContent);
                    new Notice('内容已复制到剪贴板');
                } catch (error) {
                    const clipboardError = error as ClipboardError;
                    console.error('Error:', clipboardError);
                    new Notice(`复制失败：${clipboardError.message}`);
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
                    const processedContent = await this.processImages(content, view.file);
                    await navigator.clipboard.writeText(processedContent);
                    new Notice('内容已复制到剪贴板');
                } catch (error) {
                    const clipboardError = error as ClipboardError;
                    console.error('Error:', clipboardError);
                    new Notice(`复制失败：${clipboardError.message}`);
                }
            }
        });
    }

    // 处理所有图片
    async processImages(content: string, currentFile: TFile | null): Promise<string> {
        if (!currentFile) {
            return content;
        }

        const imageRegex = /!\[(.*?)\]\((.*?)\)/g;
        const vault = this.app.vault;
        let processedContent = '';
        let lastIndex = 0;
        let match = imageRegex.exec(content);
        let hasLocalImages = false;
        
        // 先处理所有图片，生成完整内容
        while (match !== null) {
            const [fullMatch, altText, imagePath] = match;
            
            // 添加匹配之前的文本
            processedContent += content.slice(lastIndex, match.index);
            
            // 检查是否是本地图片（不是 http/https 链接）
            if (!imagePath.startsWith('http://') && !imagePath.startsWith('https://')) {
                try {
                    // 解析图片路径
                    const resolvedPath = this.resolveImagePath(imagePath, currentFile);
                    const imageFile = vault.getAbstractFileByPath(resolvedPath);
                    
                    if (imageFile instanceof TFile) {
                        hasLocalImages = true;
                        // 读取图片文件的二进制数据
                        const arrayBuffer = await vault.readBinary(imageFile);
                        const base64String = this.arrayBufferToBase64(arrayBuffer);
                        const mimeType = this.getMimeType(imageFile.extension);
                        
                        // 创建 base64 数据 URL
                        const dataUrl = `data:${mimeType};base64,${base64String}`;
                        
                        // 添加 base64 图片
                        processedContent += `![${altText}](obsidian-base64://${dataUrl})`;
                    } else {
                        // 如果找不到图片文件，保持原样
                        processedContent += fullMatch;
                    }
                } catch (error) {
                    console.error('Error processing image path:', error);
                    // 如果处理失败，保持原样
                    processedContent += fullMatch;
                }
            } else {
                // 外链图片保持原样
                processedContent += fullMatch;
            }
            
            lastIndex = match.index + fullMatch.length;
            match = imageRegex.exec(content);
        }
        
        // 添加剩余的文本
        processedContent += content.slice(lastIndex);

        // 如果有本地图片，添加标记
        if (hasLocalImages) {
            return `<!--obsidian-markdown2html-start-->\n${processedContent}\n<!--obsidian-markdown2html-end-->`;
        }
        
        // 如果没有本地图片，直接返回处理后的内容
        return processedContent;
    }

    // 解析图片路径（相对于当前文件）
    resolveImagePath(originalPath: string, currentFile: TFile): string {
        if (originalPath.startsWith('/')) {
            // 如果是以 / 开头的绝对路径，直接返回（去掉开头的 /）
            return originalPath.slice(1);
        }
        
        // 获取当前文件所在的目录
        const currentDir = currentFile.parent?.path || '';
        
        // 处理路径
        let processedPath = originalPath;
        // 如果图片路径以 ./ 开头，去掉它
        if (processedPath.startsWith('./')) {
            processedPath = processedPath.slice(2);
        }
        
        // 如果当前目录不为空，拼接路径
        return currentDir ? `${currentDir}/${processedPath}` : processedPath;
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
} 