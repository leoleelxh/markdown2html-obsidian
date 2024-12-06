export default `#nice {
  line-height: 1.6;
  letter-spacing: .034em;
  color: rgb(63, 63, 63);
  font-size: 16px;
  word-break:all;
}
#nice p {
  padding-top: 1em;
  color: rgb(74,74,74);
  line-height: 1.75em;
}
/* 一级标题 */
#nice h1 {
  text-align:center;
  background-image: url(https://my-wechat.mdnice.com/koala-1.png); 
  background-position: center top;
  background-repeat: no-repeat;
  background-size: 75px;
  line-height:95px;
  margin-top: 38px;
  margin-bottom: 10px;
}
/* 一级标题内容 */
#nice h1 .content {
  font-size: 20px;
  color: #48b378;;
  border-bottom:2px solid #2e7950;
}
/* 一级标题修饰 请参考有实例的主题 */
#nice h1:after {
}
 
/* 二级标题 */
#nice h2 {
  display:block;
  text-align:center;
  background-image: 	url(https://my-wechat.mdnice.com/koala-2.png); 
  background-position: center center;
  background-repeat: no-repeat;
  background-attachment: initial;
  background-origin: initial;
  background-clip: initial;
  background-size: 50px;
  margin-top: 1em;
  margin-bottom: 10px;
}
/*二级标题伪元素*/
#nice h2:before {
}
/* 二级标题内容 */
#nice h2 .content {
  text-align:center;
  display: inline-block;
  height: 38px;
  line-height: 42px;
  color: #48b378;
  background-position: left center;
  background-repeat: no-repeat;
  background-attachment: initial;
  background-origin: initial;
  background-clip: initial;
  background-size: 63px;
  margin-top: 38px;
  font-size:18px;
  margin-bottom: 10px;
}
/* 三级标题 */
#nice h3:before {
  content: "";
  background-image:url(https://my-wechat.mdnice.com/koala-3.png);
  background-size:100% 100%;
  background-repeat:no-repeat;
  display: inline-block;
  width: 16px;
  height: 15px;
  line-height:15px;
  margin-bottom:-1px;
}
#nice h3 {
  margin-top:1.2em;
}
#nice h4 {
  margin-top: 30px;
}
/* 三级标题内容 */
#nice h3 .content {
  font-size:17px;
  font-weight:bold;
  display:inline-block;
  margin-left:8px;
  color:#48b378;
}
/* 三级标题修饰 请参考有实例的主题 */
#nice h3:after {
}
/* 列表内容 */
#nice li {
}
/* 引用
 * 左边缘颜色 border-left-color:black;
 * 背景色 background:gray;
 */
#nice blockquote {
  padding: 15px 20px;
  line-height: 27px;
  background-color:#FBF9FD;
  border-left:3px solid #35b378;
  display:block;
}
/* 引用文字 */
#nice blockquote p {
  padding: 0px;
  font-size:15px;
  color:rgb(89,89,89);
}
/* 链接 */
#nice a {
  color: #48b378;
  text-decoration:none;
  border-bottom: 1px solid #48b378;
}
/* 加粗 */
#nice strong {
  line-height: 1.75em;
  color: rgb(74,74,74);
}
/* 斜体 */
#nice em {
}
/* 加粗斜体 */
#nice em strong {
  color:rgb(248,57,41);
  letter-spacing:0.3em;
}
/* 删除线 */
#nice del {
}
 
/* 分割线 */
#nice hr {
  height:1px;
  padding:0;
  border:none;
  text-align:center;
  background-image:linear-gradient(to right,rgba(93, 186, 133,0),rgba(93, 186, 133,0.75),rgba(93, 186, 133,0));
}
/* 图片 */
#nice img {
    border-radius:4px;
    margin-bottom:25px;
}
/* 图片描述文字 */
#nice figcaption {
  display:block;
  font-size:12px;
  font-family:PingFangSC-Light;
}
/* 行内代码 */
#nice p code, #nice li code {
	color: #28ca71;
}
/* 非微信代码块
 * 代码块不换行 display:-webkit-box !important;
 * 代码块换行 display:block;
 */
#nice pre code {
}
/* 表格内的单元格
 * 字体大小 font-size: 16px;
 * 边框 border: 1px solid #ccc;
 * 内边距 padding: 5px 10px;
 */
#nice table tr th,
#nice table tr td {
  font-size: 14px;
}
#nice .footnotes{
  padding-top: 8px;
}
/* 脚注文字 */
#nice .footnote-word {
  color: rgb(90, 185, 131);
}
/* 脚注上标 */
#nice .footnote-ref {
  color: rgb(90, 185, 131);
}
/* 脚注超链接样式 */
#nice .footnote-item em {
  color: rgb(90, 185, 131);
  font-size:13px;
  font-style:normal;
  border-bottom-color:1px dashed rgb(90, 185, 131); 
}
/* "参考资料"四个字 
 * 内容 content: "参考资料";
 */
#nice .footnotes-sep:before {
  background-image: none;
  background-size: none;
  display: block;
  width: auto;
  height: auto;
}
/* 参考资料编号 */
#nice .footnote-num {
  color: rgb(90, 185, 131);
}
/* 参考资料文字 */
#nice .footnote-item p {
  color: rgb(90, 185, 131);
  font-weight:bold;
}
/* 参考资料超链接 */
#nice .footnote-item a {
  color:rgb(93, 186, 133);
}
/* 参考资料解释 */
#nice .footnote-item p em {
  font-size:14px;
  font-weight:normal;
  border-bottom:1px dashed rgb(93, 186, 133);
}
/* 行间公式
 * 最大宽度 max-width: 300% !important;
 */
#nice .block-equation svg {
}
/* 行内公式*/
#nice .inline-equation svg {  
}

/* 滑动图片
 */
#nice .imageflow-img {
  display: inline-block;
  width:100%;
  margin-bottom: 0;
}`;
