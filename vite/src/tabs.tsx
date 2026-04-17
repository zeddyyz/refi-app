import React from "react";
import ReactDOM from "react-dom";
import "./styles/tailwind.css";
import "./styles/globals.css";
import * as serviceWorker from "./serviceWorker";
import { ThemeProvider } from "@zendeskgarden/react-theming";
import { darkTheme } from "./styles/theme";
// import { RecoilExternalStatePortal } from "./atoms/RecoilExternalStatePortal";
import TabsPage from "./pages/Tabs";

// The tabs bar lives in its own Electron view with a separate HTML entry
// (tabs.html), so theme state from the main window isn't shared. Opt this
// window into the same dark tokens used by the main app so the drag region
// and tab strip paint with `--background` instead of the browser default.
document.documentElement.classList.add("dark");
document.body.classList.add("dark");

ReactDOM.render(
  <ThemeProvider theme={darkTheme} focusVisibleRef={null}>
    <TabsPage />
  </ThemeProvider>,
  document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
