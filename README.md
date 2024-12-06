<div align="center">
<a href="http://md.aizhuanqian.online">
<img width="500" src="./screenshot.png"/>
</a>
</div>
<h1 align="center">Markdown2Html</h1>

## 简介

- 支持自定义样式的 Markdown 编辑器
- 支持微信公众号、知乎和稀土掘金
- 支持公式
- 支持html转markdwon
- 支持导出pdf和markdown
- 欢迎[在线使用](http://md.aizhuanqian.online/)

## 主题

> 欢迎提交主题，提供更多文章示例~~

## 部署说明

### 通过 Docker 部署

1. 确保已安装 Docker。
2. 在项目根目录下运行以下命令构建 Docker 镜像：
   ```bash
   docker build -t markdown2html-obsidian .
   ```
3. 使用以下命令运行 Docker 容器：
   ```bash
   docker run -p 3000:3000 markdown2html-obsidian
   ```

### 使用 Node.js 部署

1. 确保已安装 Node.js v16。
2. 在项目根目录下运行以下命令安装依赖：
   ```bash
   yarn install
   ```
3. 使用以下命令启动项目：
   ```bash
   npm run start
   ```

确保在项目启动前，已正确配置环境变量和依赖。

## 友情链接

- [markdown nice](https://mdnice.com/)：markdown nice
