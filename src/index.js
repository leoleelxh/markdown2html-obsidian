import React from "react";
import ReactDOM from "react-dom";

import Lib from "./Lib";
import * as serviceWorker from "./serviceWorker";

ReactDOM.render(
  <Lib
    useImageHosting={{
      url: "",
      name: "GitHub",
      isSmmsOpen: false,
      isQiniuyunOpen: false,
      isAliyunOpen: false,
      isGiteeOpen: false,
      isGitHubOpen: true,
    }}
    defaultTitle="Markdown2Html"
  />,
  document.getElementById("root"),
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.register();
