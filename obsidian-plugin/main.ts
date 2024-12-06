import { App, Editor, MarkdownView, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

interface Markdown2HTMLSettings {
    serverUrl: string;
}

const DEFAULT_SETTINGS: Markdown2HTMLSettings = {
    serverUrl: 'http://localhost:3000'
}

export default class Markdown2HTMLPlugin extends Plugin {
    settings: Markdown2HTMLSettings;

    async onload() {
        await this.loadSettings();

        // 添加功能按钮到编辑器工具栏
        this.addRibbonIcon('documents', 'Markdown2HTML', async () => {
            const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
            if (activeView) {
                const editor = activeView.editor;
                const content = editor.getValue();
                
                try {
                    // 构建带有内容的 URL
                    const encodedContent = encodeURIComponent(content);
                    const url = `${this.settings.serverUrl}?content=${encodedContent}`;
                    
                    // 打开浏览器
                    window.open(url, '_blank');
                    new Notice('已在浏览器中打开编辑器');
                } catch (error) {
                    console.error('Error:', error);
                    new Notice('打开编辑器失败');
                }
            } else {
                new Notice('请先打开一个 Markdown 文件');
            }
        });

        // 添加命令
        this.addCommand({
            id: 'open-markdown2html',
            name: '在浏览器中打开当前文档',
            editorCallback: async (editor: Editor) => {
                const content = editor.getValue();
                try {
                    // 构建带有内容的 URL
                    const encodedContent = encodeURIComponent(content);
                    const url = `${this.settings.serverUrl}?content=${encodedContent}`;
                    
                    // 打开浏览器
                    window.open(url, '_blank');
                    new Notice('已在浏览器中打开编辑器');
                } catch (error) {
                    console.error('Error:', error);
                    new Notice('打开编辑器失败');
                }
            }
        });

        // 添加设置选项卡
        this.addSettingTab(new Markdown2HTMLSettingTab(this.app, this));
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}

class Markdown2HTMLSettingTab extends PluginSettingTab {
    plugin: Markdown2HTMLPlugin;

    constructor(app: App, plugin: Markdown2HTMLPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const {containerEl} = this;
        containerEl.empty();
        containerEl.createEl('h2', {text: 'Markdown2HTML 设置'});

        new Setting(containerEl)
            .setName('服务器地址')
            .setDesc('设置运行 Markdown2HTML 服务的地址')
            .addText(text => text
                .setPlaceholder('输入服务器地址')
                .setValue(this.plugin.settings.serverUrl)
                .onChange(async (value) => {
                    this.plugin.settings.serverUrl = value;
                    await this.plugin.saveSettings();
                }));
    }
} 