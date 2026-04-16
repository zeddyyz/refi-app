import { allDocsAtom } from "@/atoms/firestore";
import { isShowDocFinderModalCommandAtom } from "@/atoms/ui";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import React, { useEffect, useMemo, useState } from "react";
import { useRecoilState, useRecoilValue } from "recoil";

const DocFinder = () => {
  const [
    isShowDocFinderModalCommand,
    setShowDocFinderModalCommand,
  ] = useRecoilState(isShowDocFinderModalCommandAtom);
  const [keyword, setKeyword] = useState("");
  const allDocs = useRecoilValue(allDocsAtom);

  const filteredDocs = useMemo(() => {
    const keywordLowercase = keyword.toLowerCase();
    if (keywordLowercase.length >= 2) {
      return allDocs.filter((doc) => {
        return doc.ref.path.toLowerCase().includes(keywordLowercase);
      });
    }
    // TODO: Show recent search result
    return [];
  }, [allDocs, keyword]);

  useEffect(() => {
    if (!isShowDocFinderModalCommand) {
      setKeyword("");
    }
  }, [isShowDocFinderModalCommand]);

  // TODO: Focus on input once modal mount
  // TODO: Reset keyword when unmount
  // TODO: Lazy get all docs

  return (
    <Dialog
      open={isShowDocFinderModalCommand}
      onOpenChange={(open) => !open && setShowDocFinderModalCommand(false)}
    >
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
        <div className="p-3 border-b border-border">
          <Input
            placeholder="Search documents, collections by path, id"
            tabIndex={1}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            autoFocus
            className="h-9"
          />
        </div>
        <div
          className="max-h-80 overflow-auto p-1"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="options-menu"
        >
          {filteredDocs.map((doc) => (
            <a
              href="#"
              key={doc.id}
              className="block px-3 py-2 text-sm rounded-sm text-foreground hover:bg-accent"
              role="menuitem"
            >
              {doc.id} <span>{doc.ref.path}</span>
            </a>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocFinder;
