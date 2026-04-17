import { docAtom } from "@/atoms/firestore";
import { actionNewDocument } from "@/atoms/firestore.action";
import { navigatorPathAtom } from "@/atoms/navigator";
import { actionGoTo } from "@/atoms/navigator.action";
import {
  resetRecoilExternalState,
  setRecoilExternalState,
} from "@/atoms/RecoilExternalStatePortal";
import { defaultEditorAtom } from "@/atoms/ui";
import { getPathEntities, isCollection } from "@/utils/common";
import { Button as ShadcnButton } from "@/components/ui/button";
import { Input as ShadcnInput } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import classNames from "classnames";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import CopyIcon from "../CopyIcon";
import EmptyBox from "./EmptyBox.png";
import MonacoProperty from "./MonacoProperty";
import PropertyTable from "./PropertyTable";

const Property = () => {
  const currentPath = useRecoilValue(navigatorPathAtom);
  const doc = useRecoilValue(docAtom(currentPath));
  const [searchInput, setSearchInput] = useState("");
  const [editorType] = useRecoilState(defaultEditorAtom);
  const idInputRef = useRef<HTMLInputElement>(null);

  const handleCreateDocument = useCallback(() => {
    if (isCollection(currentPath)) {
      actionNewDocument(currentPath);
      return;
    }

    const paths = getPathEntities(currentPath);
    const newId = paths.pop() || "newId";
    actionNewDocument(paths.join("/"), newId);
    return;
  }, [currentPath]);

  useEffect(() => {
    if (doc && idInputRef.current) {
      idInputRef.current.value = doc.id;
    }
  }, [doc?.id]);

  if (!doc) {
    if (currentPath === "/") {
      return null;
    }

    if (isCollection(currentPath)) {
      return (
        <div className="flex flex-col items-center justify-center w-full h-full text-center">
          {/* <div className="w-1/4">
            <img src={Launching} />
          </div> */}
          <h2 className="mt-4">
            Click document on the table to start editing or
          </h2>
          <ShadcnButton
            size="sm"
            className="mt-3"
            onClick={handleCreateDocument}
          >
            New Document
          </ShadcnButton>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center w-full h-full text-center">
        <div className="w-1/4">
          <img src={EmptyBox} />
        </div>
        <h2 className="mt-4">Opps...The document is not exist</h2>
        <ShadcnButton
          size="sm"
          className="mt-3"
          onClick={handleCreateDocument}
        >
          Create
        </ShadcnButton>
      </div>
    );
  }

  const onIdKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (!idInputRef.current) {
      return;
    }
    if (e.key === "Escape") {
      idInputRef.current.value = doc.id;
      return;
    }

    if (e.key === "Enter") {
      handleOnChangeId(idInputRef.current.value);
      return;
    }
  };

  const handleOnChangeId = (id: string) => {
    if (id === doc.id) {
      return;
    }
    const newDoc = doc.clone(undefined, id);
    const letOldPath = currentPath;
    setRecoilExternalState(docAtom(newDoc.ref.path), newDoc);
    actionGoTo(newDoc.ref.path);
    resetRecoilExternalState(docAtom(letOldPath));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-border">
        <div className="relative group">
          <div className="flex">
            <div
              className={classNames(
                "w-8 h-7 text-center text-foreground border font-bold flex items-center justify-center bg-muted border-r-0 rounded-l-md text-xs",
                {
                  ["border-border"]: !doc.isNew,
                  ["border-primary"]: doc.isNew,
                }
              )}
            >
              _id
            </div>
            <ShadcnInput
              ref={idInputRef}
              className="rounded-l-none h-7 font-mono text-sm pr-6 disabled:text-muted-foreground disabled:border-border text-foreground"
              placeholder="Document id"
              defaultValue={doc.id}
              disabled={!doc.isNew}
              onBlur={(e) => handleOnChangeId(e.target.value)}
              onKeyDown={onIdKeyDown}
            />
          </div>
          {!doc.isNew && (
            <CopyIcon
              value={doc.id}
              className="absolute w-6 transform -translate-y-1/2 bg-card opacity-0 cursor-pointer right-1 top-1/2 group-hover:opacity-100 p-0.5 rounded"
            />
          )}
        </div>
      </div>
      {/* <div className="flex flex-row items-center justify-between mt-3 px-3">
        {editorType === "basic" ? (
          <ShadcnInput
            placeholder="Search for property or value..."
            className="h-8"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        ) : (
          <Tooltip delayDuration={100}>
            <TooltipTrigger asChild>
              <a className="text-xs text-primary cursor-pointer">
                <svg
                  className="inline-block w-4 mb-0.5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                    clipRule="evenodd"
                  />
                </svg>{" "}
                How to insert Timestamp, Geopoint or Reference?
              </a>
            </TooltipTrigger>
            <TooltipContent side="top" align="start" className="max-w-2xl z-40">
              <span className="text-foreground">
                Type <code className="text-destructive bg-muted p-0.5">/</code>{" "}
                to start insert new type
              </span>
            </TooltipContent>
          </Tooltip>
        )}
      </div> */}
      <div className="flex-1 min-h-0 mt-2 px-3 pb-2 overflow-auto">
        {editorType === "basic" && (
          <PropertyTable searchInput={searchInput} doc={doc} />
        )}
        {editorType === "advantage" && <MonacoProperty doc={doc} />}
      </div>
    </div>
  );
};

export default Property;
