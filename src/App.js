import React, {Component} from "react";
import CodeMirror from "@uiw/react-codemirror";
import "codemirror/addon/search/searchcursor";
import "codemirror/keymap/sublime";
import "antd/dist/antd.css";
import {observer, inject} from "mobx-react";
import classnames from "classnames";
import throttle from "lodash.throttle";
import {message} from "antd";

import Dialog from "./layout/Dialog";
import Navbar from "./layout/Navbar";
import Toobar from "./layout/Toolbar";
import Footer from "./layout/Footer";
import Sidebar from "./layout/Sidebar";
import StyleEditor from "./layout/StyleEditor";
import EditorMenu from "./layout/EditorMenu";
import SearchBox from "./component/SearchBox";

import "./App.css";
import "./utils/mdMirror.css";

import {
  LAYOUT_ID,
  BOX_ID,
  IMAGE_HOSTING_NAMES,
  IMAGE_HOSTING_TYPE,
  MJX_DATA_FORMULA,
  MJX_DATA_FORMULA_TYPE,
} from "./utils/constant";
import {markdownParser, markdownParserWechat, updateMathjax} from "./utils/helper";
import pluginCenter from "./utils/pluginCenter";
import appContext from "./utils/appContext";
import {uploadAdaptor} from "./utils/imageHosting";
import bindHotkeys, {betterTab, rightClick} from "./utils/hotkey";
import * as ImageProcessor from "./utils/markdown/imageProcessor";

@inject("content")
@inject("navbar")
@inject("footer")
@inject("view")
@inject("dialog")
@inject("imageHosting")
@observer
class App extends Component {
  constructor(props) {
    super(props);
    this.scale = 1;
    this.handleUpdateMathjax = throttle(updateMathjax, 1500);
    this.state = {
      focus: false,
    };
  }

  componentDidMount = async () => {
    document.addEventListener("fullscreenchange", this.solveScreenChange);
    document.addEventListener("webkitfullscreenchange", this.solveScreenChange);
    document.addEventListener("mozfullscreenchange", this.solveScreenChange);
    document.addEventListener("MSFullscreenChange", this.solveScreenChange);
    try {
      window.MathJax = {
        tex: {
          inlineMath: [["$", "$"]],
          displayMath: [["$$", "$$"]],
          tags: "ams",
        },
        svg: {
          fontCache: "none",
        },
        options: {
          renderActions: {
            addMenu: [0, "", ""],
            addContainer: [
              190,
              (doc) => {
                for (const math of doc.math) {
                  this.addContainer(math, doc);
                }
              },
              this.addContainer,
            ],
          },
        },
      };
      // eslint-disable-next-line
      require("mathjax/es5/tex-svg-full");
      pluginCenter.mathjax = true;
    } catch (e) {
      console.log(e);
    }
    this.setEditorContent();
    this.setCustomImageHosting();
    // 设置默认图床类型
    const defaultImageBedType = process.env.REACT_APP_IMAGE_BED_TYPE || "github";
    if (!localStorage.getItem(IMAGE_HOSTING_TYPE)) {
      localStorage.setItem(IMAGE_HOSTING_TYPE, defaultImageBedType);
    }
    // 从 URL 参数中获取内容
    const urlParams = new URLSearchParams(window.location.search);
    const content = urlParams.get('content');
    
    if (content) {
      const decodedContent = decodeURIComponent(content);
      
      try {
        // 处理外部图片
        const processedContent = await ImageProcessor.processExternalImages(
          decodedContent,
          this.props.content,
          (current, total) => {
            // 添加进度提示
            console.log(`处理图片进度: ${current}/${total}`);
          }
        );
        
        // 设置处理后的内容到编辑器
        this.props.content.setContent(processedContent);
      } catch (error) {
        console.error('处理图片失败:', error);
        // 如果处理失败，至少显示原始内容
        this.props.content.setContent(decodedContent);
      }
    }

    // 添加 MathJax 脚本
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
    script.async = true;
    script.id = 'MathJax-script';
    
    // 配置 MathJax
    window.MathJax = {
      tex: {
        inlineMath: [['$', '$'], ['\\(', '\\)']],
        displayMath: [['$$', '$$'], ['\\[', '\\]']],
        processEscapes: true
      },
      svg: {
        fontCache: 'global'
      },
      options: {
        skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre']
      }
    };

    document.head.appendChild(script);
  };

  componentDidUpdate() {
    if (pluginCenter.mathjax) {
      this.handleUpdateMathjax();
    }
  }

  componentWillUnmount() {
    document.removeEventListener("fullscreenchange", this.solveScreenChange);
    document.removeEventListener("webkitfullscreenchange", this.solveScreenChange);
    document.removeEventListener("mozfullscreenchange", this.solveScreenChange);
    document.removeEventListener("MSFullscreenChange", this.solveScreenChange);
  }

  setCustomImageHosting = () => {
    if (this.props.useImageHosting === undefined) {
      return;
    }
    const {url, name, isSmmsOpen, isQiniuyunOpen, isAliyunOpen, isGiteeOpen, isGitHubOpen} = this.props.useImageHosting;
    if (name) {
      this.props.imageHosting.setHostingUrl(url);
      this.props.imageHosting.setHostingName(name);
      this.props.imageHosting.addImageHosting(name);
    }
    if (isSmmsOpen) {
      this.props.imageHosting.addImageHosting(IMAGE_HOSTING_NAMES.smms);
    }
    if (isAliyunOpen) {
      this.props.imageHosting.addImageHosting(IMAGE_HOSTING_NAMES.aliyun);
    }
    if (isQiniuyunOpen) {
      this.props.imageHosting.addImageHosting(IMAGE_HOSTING_NAMES.qiniuyun);
    }
    if (isGiteeOpen) {
      this.props.imageHosting.addImageHosting(IMAGE_HOSTING_NAMES.gitee);
    }
    if (isGitHubOpen) {
      this.props.imageHosting.addImageHosting(IMAGE_HOSTING_NAMES.github);
    }

    // 第一次进入没有默认图床时
    if (window.localStorage.getItem(IMAGE_HOSTING_TYPE) === null) {
      let type;
      if (name) {
        type = name;
      } else if (isSmmsOpen) {
        type = IMAGE_HOSTING_NAMES.smms;
      } else if (isAliyunOpen) {
        type = IMAGE_HOSTING_NAMES.aliyun;
      } else if (isQiniuyunOpen) {
        type = IMAGE_HOSTING_NAMES.qiniuyun;
      } else if (isGiteeOpen) {
        type = IMAGE_HOSTING_NAMES.isGitee;
      }
      this.props.imageHosting.setType(type);
      window.localStorage.setItem(IMAGE_HOSTING_TYPE, type);
    }
  };

  setEditorContent = () => {
    const {defaultText} = this.props;
    if (defaultText) {
      this.props.content.setContent(defaultText);
    }
  };

  setCurrentIndex(index) {
    this.index = index;
  }

  solveScreenChange = () => {
    const {isImmersiveEditing} = this.props.view;
    this.props.view.setImmersiveEditing(!isImmersiveEditing);
  };

  getInstance = (instance) => {
    instance.editor.on("inputRead", function(cm, event) {
      if (event.origin === "paste") {
        var text = event.text[0]; // pasted string
        var new_text = ""; // any operations here
        cm.refresh();
        const {length} = cm.getSelections();
        // my first idea was
        // note: for multiline strings may need more complex calculations
        cm.replaceRange(new_text, event.from, {line: event.from.line, ch: event.from.ch + text.length});
        // first solution did'nt work (before i guess to call refresh) so i tried that way, works too
        if (length === 1) {
          cm.execCommand("undo");
        }
        // cm.setCursor(event.from);
        cm.replaceSelection(new_text);
      }
    });
    if (instance) {
      this.props.content.setMarkdownEditor(instance.editor);
    }
  };

  handleScroll = () => {
    if (this.props.navbar.isSyncScroll) {
      const {markdownEditor} = this.props.content;
      const cmData = markdownEditor.getScrollInfo();
      const editorToTop = cmData.top;
      const editorScrollHeight = cmData.height - cmData.clientHeight;
      this.scale = (this.previewWrap.offsetHeight - this.previewContainer.offsetHeight + 55) / editorScrollHeight;
      if (this.index === 1) {
        this.previewContainer.scrollTop = editorToTop * this.scale;
      } else {
        this.editorTop = this.previewContainer.scrollTop / this.scale;
        markdownEditor.scrollTo(null, this.editorTop);
      }
    }
  };

  handleChange = (editor) => {
    if (this.state.focus) {
      const content = editor.getValue();
      this.props.content.setContent(content);
      this.props.onTextChange && this.props.onTextChange(content);
    }
  };

  handleFocus = (editor) => {
    this.setState({
      focus: true,
    });
    this.props.onTextFocus && this.props.onTextFocus(editor.getValue());
  };

  handleBlur = (editor) => {
    this.setState({
      focus: false,
    });
    this.props.onTextBlur && this.props.onTextBlur(editor.getValue());
  };

  getStyleInstance = (instance) => {
    if (instance) {
      this.styleEditor = instance.editor;
      this.styleEditor.on("keyup", (cm, e) => {
        if ((e.keyCode >= 65 && e.keyCode <= 90) || e.keyCode === 189) {
          cm.showHint(e);
        }
      });
    }
  };

  handleDrop = (instance, e) => {
    // e.preventDefault();
    // console.log(e.dataTransfer.files[0]);
    if (!(e.dataTransfer && e.dataTransfer.files)) {
      return;
    }
    for (let i = 0; i < e.dataTransfer.files.length; i++) {
      // console.log(e.dataTransfer.files[i]);
      uploadAdaptor({file: e.dataTransfer.files[i], content: this.props.content});
    }
  };

  handlePaste = async (instance, e) => {
    const cbData = e.clipboardData;

    const insertPasteContent = async (cm, content) => {
        try {
            // 检查是否是来自 Obsidian 的内容
            const obsidianStartMark = '<!--obsidian-markdown2html-start-->';
            const obsidianEndMark = '<!--obsidian-markdown2html-end-->';
            
            if (content.includes(obsidianStartMark) && content.includes(obsidianEndMark)) {
                // 提取 Obsidian 内容
                const start = content.indexOf(obsidianStartMark) + obsidianStartMark.length;
                const end = content.indexOf(obsidianEndMark);
                const obsidianContent = content.substring(start, end).trim();
                
                // 处理本地图片路径
                const processedContent = await this.processObsidianImages(obsidianContent);
                
                // 插入处理后的内容
                const {length} = cm.getSelections();
                cm.replaceSelections(Array(length).fill(processedContent));
            } else {
                // 处理普通内容
                const processedContent = await ImageProcessor.processExternalImages(
                    content,
                    this.props.content,
                    (current, total) => {
                        console.log(`处理图片进度: ${current}/${total}`);
                    }
                );

                const {length} = cm.getSelections();
                cm.replaceSelections(Array(length).fill(processedContent));
            }
            
            this.setState(
                {
                    focus: true,
                },
                () => {
                    this.handleChange(cm);
                },
            );
        } catch (error) {
            console.error('Error in insertPasteContent:', error);
            // 如果处理失败，至少插入原始内容
            const {length} = cm.getSelections();
            cm.replaceSelections(Array(length).fill(content));
            message.error('处理粘贴内容时出错');
        }
    };

    try {
        // 处理文件粘贴
        if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
            for (let i = 0; i < e.clipboardData.files.length; i++) {
                await new Promise((resolve, reject) => {
                    uploadAdaptor({
                        file: e.clipboardData.files[i],
                        content: this.props.content,
                        onSuccess: resolve,
                        onError: reject
                    });
                });
            }
            return;
        }

        // 处理文本粘贴
        if (cbData) {
            const html = cbData.getData("text/html");
            const text = cbData.getData("TEXT");
            await insertPasteContent(instance, text);

            if (html) {
                this.props.footer.setPasteHtmlChecked(true);
                this.props.footer.setPasteHtml(html);
                this.props.footer.setPasteText(text);
            } else {
                this.props.footer.setPasteHtmlChecked(false);
            }
        }
    } catch (error) {
        console.error('Error in handlePaste:', error);
        message.error('粘贴处理失败');
    }
  };

  // 处理 Obsidian 本地图片
  processObsidianImages = async (content) => {
    try {
        const imageRegex = /!\[(.*?)\]\(obsidian-base64:\/\/(data:.*?;base64,.*?)\)/g;
        let processedContent = content;
        let match;
        
        while ((match = imageRegex.exec(content)) !== null) {
            const [fullMatch, altText, dataUrl] = match;
            try {
                // 从 base64 创建 Blob
                const response = await fetch(dataUrl);
                const blob = await response.blob();
                
                // 创建文件对象
                const filename = `image_${Date.now()}.png`;
                const file = new File([blob], filename, { type: blob.type || 'image/png' });
                
                // 上传到图床
                const uploadResult = await new Promise((resolve, reject) => {
                    uploadAdaptor({
                        file,
                        onSuccess: (response) => resolve(response),
                        onError: (error) => reject(error)
                    });
                });

                // 替换为实际的图片 URL
                const newImageMark = `![${altText}](${uploadResult.url})`;
                processedContent = processedContent.replace(fullMatch, newImageMark);
            } catch (error) {
                console.error('Error processing image:', error);
            }
        }
        
        return processedContent;
    } catch (error) {
        console.error('Error in processObsidianImages:', error);
        return content; // 如果处理失败，返回原始内容
    }
  };

  addContainer(math, doc) {
    const tag = "span";
    const spanClass = math.display ? "span-block-equation" : "span-inline-equation";
    const cls = math.display ? "block-equation" : "inline-equation";
    math.typesetRoot.className = cls;
    math.typesetRoot.setAttribute(MJX_DATA_FORMULA, math.math);
    math.typesetRoot.setAttribute(MJX_DATA_FORMULA_TYPE, cls);
    math.typesetRoot = doc.adaptor.node(tag, {class: spanClass, style: "cursor:pointer"}, [math.typesetRoot]);
  }

  render() {
    const {codeNum, previewType} = this.props.navbar;
    const {isEditAreaOpen, isPreviewAreaOpen, isStyleEditorOpen, isImmersiveEditing} = this.props.view;
    const {isSearchOpen} = this.props.dialog;

    const parseHtml =
      codeNum === 0
        ? markdownParserWechat.render(this.props.content.content)
        : markdownParser.render(this.props.content.content);

    const mdEditingClass = classnames({
      "nice-md-editing": !isImmersiveEditing,
      "nice-md-editing-immersive": isImmersiveEditing,
      "nice-md-editing-hide": !isEditAreaOpen,
    });

    const styleEditingClass = classnames({
      "nice-style-editing": true,
      "nice-style-editing-hide": isImmersiveEditing,
    });

    const richTextClass = classnames({
      "nice-marked-text": true,
      "nice-marked-text-pc": previewType === "pc",
      "nice-marked-text-hide": isImmersiveEditing || !isPreviewAreaOpen,
    });

    const richTextBoxClass = classnames({
      "nice-wx-box": true,
      "nice-wx-box-pc": previewType === "pc",
    });

    const textContainerClass = classnames({
      "nice-text-container": !isImmersiveEditing,
      "nice-text-container-immersive": isImmersiveEditing,
    });

    return (
      <appContext.Consumer>
        {({defaultTitle, onStyleChange, onStyleBlur, onStyleFocus, token}) => (
          <div className="nice-app">
            <Navbar title={defaultTitle} token={token} />
            <Toobar token={token} />
            <div className={textContainerClass}>
              <div id="nice-md-editor" className={mdEditingClass} onMouseOver={(e) => this.setCurrentIndex(1, e)}>
                {isSearchOpen && <SearchBox />}
                <CodeMirror
                  value={this.props.content.content}
                  options={{
                    theme: "md-mirror",
                    keyMap: "sublime",
                    mode: "markdown",
                    lineWrapping: true,
                    lineNumbers: false,
                    extraKeys: {
                      ...bindHotkeys(this.props.content, this.props.dialog),
                      Tab: betterTab,
                      RightClick: rightClick,
                    },
                  }}
                  onChange={this.handleChange}
                  onScroll={this.handleScroll}
                  onFocus={this.handleFocus}
                  onBlur={this.handleBlur}
                  onDrop={this.handleDrop}
                  onPaste={this.handlePaste}
                  ref={this.getInstance}
                />
              </div>
              <div id="nice-rich-text" className={richTextClass} onMouseOver={(e) => this.setCurrentIndex(2, e)}>
                <Sidebar />
                <div
                  id={BOX_ID}
                  className={richTextBoxClass}
                  onScroll={this.handleScroll}
                  ref={(node) => {
                    this.previewContainer = node;
                  }}
                >
                  <section
                    id={LAYOUT_ID}
                    data-tool="markdown2wechat编器"
                    data-website="https://aizhuanqian.com"
                    dangerouslySetInnerHTML={{
                      __html: parseHtml,
                    }}
                    ref={(node) => {
                      this.previewWrap = node;
                    }}
                  />
                </div>
              </div>

              {isStyleEditorOpen && (
                <div id="nice-style-editor" className={styleEditingClass}>
                  <StyleEditor onStyleChange={onStyleChange} onStyleBlur={onStyleBlur} onStyleFocus={onStyleFocus} />
                </div>
              )}

              <Dialog />
              <EditorMenu />
            </div>
            <Footer />
          </div>
        )}
      </appContext.Consumer>
    );
  }
}

export default App;