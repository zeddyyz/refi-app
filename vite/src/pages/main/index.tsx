import { projectIdAtom } from "@/atoms/firestore";
import { actionAddPathExpander } from "@/atoms/firestore.action";
import { setRecoilExternalState } from "@/atoms/RecoilExternalStatePortal";
import { notifyErrorPromise } from "@/atoms/ui.action";
import DataSubscriber from "@/components/DataSubscriber";
import NavBar from "@/components/NavBar";
import Property from "@/components/Property";
import QuoteLoading from "@/components/QuoteLoading";
import TreeView from "@/components/TreeView";
import URLSynchronizer from "@/components/URLSynchronizer";
import React, { ReactElement, useEffect, useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useHistory, useParams } from "react-router-dom";
import Background from "../background";
import UniversalHotKey from "../hotkey";
import Main from "./main";

const RESIZE_HANDLE_CLASS =
  "w-px bg-border relative hover:bg-primary/40 data-[resize-handle-state=drag]:bg-primary/60 transition-colors after:absolute after:inset-y-0 after:-left-1 after:-right-1 after:content-['']";

function MainLayout(): ReactElement {
  const history = useHistory();
  const { projectId } = useParams() as any;
  const [showLoading, setShowLoading] = useState(true);

  useEffect(() => {
    setRecoilExternalState(projectIdAtom, projectId);
    window
      .send("fs.init", { projectId })
      .then((response: string[]) => {
        console.log("Inited fs");
        actionAddPathExpander(response);
        window.api.renameTab(projectId);
      })
      .catch((error) => {
        history.replace({
          pathname: `/`,
          hash: "/",
        });
        notifyErrorPromise(error);
      });
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen bg-background text-foreground">
      {showLoading ? (
        <QuoteLoading onDone={() => setShowLoading(false)} />
      ) : (
        <>
          <UniversalHotKey />
          <DataSubscriber />
          <URLSynchronizer />
          <div className="shrink-0 border-b border-border bg-background">
            <NavBar />
          </div>
          <PanelGroup
            direction="horizontal"
            autoSaveId="refi-main-layout"
            className="flex-1 min-h-0"
          >
            <Panel id="sidebar" defaultSize={18} minSize={12} order={1}>
              <div className="h-full w-full overflow-hidden bg-background">
                <TreeView />
              </div>
            </Panel>
            <PanelResizeHandle className={RESIZE_HANDLE_CLASS} />
            <Panel id="main" defaultSize={54} minSize={30} order={2}>
              <div className="h-full w-full overflow-hidden bg-card">
                <Main />
              </div>
            </Panel>
            <PanelResizeHandle className={RESIZE_HANDLE_CLASS} />
            <Panel id="property" defaultSize={28} minSize={18} order={3}>
              <div className="h-full w-full overflow-hidden bg-card">
                <Property />
              </div>
            </Panel>
          </PanelGroup>
          <Background />
        </>
      )}
    </div>
  );
}

export default MainLayout;
