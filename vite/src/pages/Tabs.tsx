import React, { useEffect, useState } from "react";
import classNames from "classnames";
import { X, Plus } from "lucide-react";
// import BrowserView from "react-electron-browser-view";

const TabsPage = () => {
  const [selectedTab, setSelectedTab] = useState("tab-1");
  const [tabList, setTabList] = useState<string[]>([]);

  const handleSelectTab = (tabName: string) => {
    if (tabName === "add") {
      window.api.newTab(window.location.href);
      return;
    }

    window.api.setTab(tabName);
  };

  useEffect(() => {
    getInitTab();
    window.api.onTabChange((data) => {
      setTabList(data.tabs);
      setSelectedTab(data.active);
    });
  }, []);

  const getInitTab = async () => {
    const data = await window.api.getTabs();
    setTabList(data.tabs);
    setSelectedTab(data.active);
  };

  const handleCloseTab = (e: React.MouseEvent, tab: string) => {
    e.preventDefault();
    e.stopPropagation();

    window.api.closeTab(tab);
  };

  const handleCloseWindow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    window.api.closeWindow();
  };

  const handleMinimumWindow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    window.api.minimumWindow();
  };

  const handleToggleMaximumWindow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    window.api.toggleMaximumWindow();
  };

  const isMacOS = window.os === "darwin" || window.os === "Darwin";
  // const isMacOS = false;

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <div
        className={classNames(
          "flex flex-row justify-between h-9 bg-background py-1",
          {
            ["mr-30"]: !isMacOS,
            ["ml-20"]: isMacOS,
          }
        )}
        id="drag-title"
        onDoubleClick={handleToggleMaximumWindow}
      >
        <div className="flex flex-row items-stretch">
          {tabList.map((tab) => {
            const isActive = tab === selectedTab;
            return (
              <button
                type="button"
                key={tab}
                onClick={() => handleSelectTab(tab)}
                className={classNames(
                  "group relative flex items-center gap-2 py-2 pl-4 pr-8 text-sm has-border transition-colors cursor-pointer rounded-md",
                  {
                    "bg-card text-foreground": isActive,
                    "text-muted-foreground hover:bg-accent hover:text-foreground": !isActive,
                  }
                )}
              >
                <span className="truncate max-w-[200px]">{tab}</span>
                <span
                  role="button"
                  onClick={(e) => handleCloseTab(e, tab)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 rounded hover:bg-accent text-muted-foreground hover:text-foreground p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => handleSelectTab("add")}
            className="flex items-center justify-center px-3 py-2 text-muted-foreground hover:bg-accent hover:text-foreground border-r border-border rounded-md"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <section className="draggable-containers p-3 xl:w-auto flex-1 md:w-auto sm:w-auto bg-background"></section>
        {!isMacOS && (
          <div className="flex flex-row items-stretch justify-center">
            <div
              className="p-3 hover:bg-accent"
              onClick={handleMinimumWindow}
            >
              <img
                className="icon"
                srcSet="icons/min-w-10.png 1x, icons/min-w-12.png 1.25x, icons/min-w-15.png 1.5x, icons/min-w-15.png 1.75x, icons/min-w-20.png 2x, icons/min-w-20.png 2.25x, icons/min-w-24.png 2.5x, icons/min-w-30.png 3x, icons/min-w-30.png 3.5x"
                draggable="false"
              />
            </div>

            <div
              className="p-3 hover:bg-accent"
              onClick={handleToggleMaximumWindow}
            >
              <img
                className="icon"
                srcSet="icons/max-w-10.png 1x, icons/max-w-12.png 1.25x, icons/max-w-15.png 1.5x, icons/max-w-15.png 1.75x, icons/max-w-20.png 2x, icons/max-w-20.png 2.25x, icons/max-w-24.png 2.5x, icons/max-w-30.png 3x, icons/max-w-30.png 3.5x"
                draggable="false"
              />
            </div>

            <div className="p-3 hover:bg-destructive" onClick={handleCloseWindow}>
              <img
                className="icon"
                srcSet="icons/close-w-10.png 1x, icons/close-w-12.png 1.25x, icons/close-w-15.png 1.5x, icons/close-w-15.png 1.75x, icons/close-w-20.png 2x, icons/close-w-20.png 2.25x, icons/close-w-24.png 2.5x, icons/close-w-30.png 3x, icons/close-w-30.png 3.5x"
                draggable="false"
              />
            </div>
          </div>
        )}
      </div>
      <div className="w-full h-full bg-background"></div>
    </div>
  );
};

export default TabsPage;
