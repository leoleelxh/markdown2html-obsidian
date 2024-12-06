/*
THIS IS A GENERATED/BUNDLED FILE BY ESBUILD
if you want to view the source, please visit the github repository of this plugin
*/

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// main.ts
var main_exports = {};
__export(main_exports, {
  default: () => Markdown2HTMLPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");
var DEFAULT_SETTINGS = {
  serverUrl: "http://localhost:3000"
};
var Markdown2HTMLPlugin = class extends import_obsidian.Plugin {
  async onload() {
    await this.loadSettings();
    this.addRibbonIcon("documents", "Markdown2HTML", async () => {
      const activeView = this.app.workspace.getActiveViewOfType(import_obsidian.MarkdownView);
      if (activeView) {
        const editor = activeView.editor;
        const content = editor.getValue();
        try {
          await navigator.clipboard.writeText(content);
          new import_obsidian.Notice("\u5DF2\u590D\u5236 Markdown \u5185\u5BB9\u5230\u526A\u8D34\u677F");
          window.open(this.settings.serverUrl, "_blank");
        } catch (error) {
          console.error("Error:", error);
          new import_obsidian.Notice("\u590D\u5236\u5185\u5BB9\u5931\u8D25");
        }
      } else {
        new import_obsidian.Notice("\u8BF7\u5148\u6253\u5F00\u4E00\u4E2A Markdown \u6587\u4EF6");
      }
    });
    this.addCommand({
      id: "open-markdown2html",
      name: "\u5728\u6D4F\u89C8\u5668\u4E2D\u6253\u5F00\u5F53\u524D\u6587\u6863",
      editorCallback: async (editor) => {
        const content = editor.getValue();
        try {
          await navigator.clipboard.writeText(content);
          new import_obsidian.Notice("\u5DF2\u590D\u5236 Markdown \u5185\u5BB9\u5230\u526A\u8D34\u677F");
          window.open(this.settings.serverUrl, "_blank");
        } catch (error) {
          console.error("Error:", error);
          new import_obsidian.Notice("\u590D\u5236\u5185\u5BB9\u5931\u8D25");
        }
      }
    });
    this.addSettingTab(new Markdown2HTMLSettingTab(this.app, this));
  }
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
};
var Markdown2HTMLSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Markdown2HTML \u8BBE\u7F6E" });
    new import_obsidian.Setting(containerEl).setName("\u670D\u52A1\u5668\u5730\u5740").setDesc("\u8BBE\u7F6E\u8FD0\u884C Markdown2HTML \u670D\u52A1\u7684\u5730\u5740").addText((text) => text.setPlaceholder("\u8F93\u5165\u670D\u52A1\u5668\u5730\u5740").setValue(this.plugin.settings.serverUrl).onChange(async (value) => {
      this.plugin.settings.serverUrl = value;
      await this.plugin.saveSettings();
    }));
  }
};
