import {
  changedDocAtom,
  collectionHasBeenDeleteAtom,
  deletedDocsAtom,
  newDocsAtom,
} from "@/atoms/firestore";
import {
  actionCommitChange,
  actionReverseChange,
  actionReverseDocChange,
} from "@/atoms/firestore.action";
import { isShowPreviewChangeModalAtom } from "@/atoms/ui";
import { ClientDocumentSnapshot } from "@/types/ClientDocumentSnapshot";
import { getParentPath } from "@/utils/common";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import classNames from "classnames";
import { groupBy } from "lodash";
import React, { useCallback, useEffect, useMemo } from "react";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { actionGoTo } from "@/atoms/navigator.action";

const PreviewChanges = () => {
  const setShowChangeModal = useSetRecoilState(isShowPreviewChangeModalAtom);
  const changedDocs = useRecoilValue(changedDocAtom);
  const newDocs = useRecoilValue(newDocsAtom);
  const deletedDocs = useRecoilValue(deletedDocsAtom);
  const deletedCollections = useRecoilValue(collectionHasBeenDeleteAtom);

  const changes = useMemo(() => {
    return [...changedDocs, ...newDocs, ...deletedDocs];
  }, [changedDocs, newDocs, deletedDocs]);

  useEffect(() => {
    if (changes.length <= 0 && deletedCollections.length <= 0) {
      setShowChangeModal(false);
    }
  }, [changes, deletedCollections]);

  const groupSimilarDoc = useMemo(() => {
    return groupBy(changes, (doc) => getParentPath(doc.ref.path));
  }, [changes]);

  const handleOnCommit = () => {
    actionCommitChange();
    setShowChangeModal(false);
  };

  const handleOnReverseAll = () => {
    // TODO: Show confirm dialog
    actionReverseChange();
    setShowChangeModal(false);
  };

  const getTag = (
    doc: ClientDocumentSnapshot
  ): "new" | "modified" | "deleted" => {
    if (doc.isNew) {
      return "new";
    }

    if (doc.isChanged()) {
      return "modified";
    }

    return "deleted";
  };

  const handleReverseDoc = useCallback((doc: ClientDocumentSnapshot) => {
    actionReverseDocChange(doc.ref.path, getTag(doc));
  }, []);

  const handleGotoDoc = useCallback(
    (path: string) => {
      actionGoTo(path);
      setShowChangeModal(false);
    },
    [setShowChangeModal]
  );

  return (
    <Dialog
      open={true}
      onOpenChange={(open) => !open && setShowChangeModal(false)}
    >
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col bg-background rounded-lg outline-none focus:outline-none focus-visible:outline-none focus:ring-0">
        <DialogHeader>
          <DialogTitle>Preview Changes</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-auto px-2 -mx-2">
          <h3 className="text-lg font-medium">Collections</h3>
          <table className="w-full mb-4 table-fixed">
            <thead>
              <tr>
                <th className="w-full"></th>
                <th className="w-20"></th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {deletedCollections.map((collection) => (
                <tr key={collection}>
                  <td>
                    <svg
                      className="inline-block mr-2"
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M5 2.5l.5-.5h2l.5.5v11l-.5.5h-2l-.5-.5v-11zM6 3v10h1V3H6zm3.171.345l.299-.641 1.88-.684.64.299 3.762 10.336-.299.641-1.879.684-.64-.299L9.17 3.345zm1.11.128l3.42 9.396.94-.341-3.42-9.397-.94.342zM1 2.5l.5-.5h2l.5.5v11l-.5.5h-2l-.5-.5v-11zM2 3v10h1V3H2z"
                      />
                    </svg>{" "}
                    {collection}
                  </td>
                  <td>
                    <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium bg-status-deleted text-foreground">
                      deleted
                    </span>
                  </td>
                  <td />
                </tr>
              ))}
            </tbody>
          </table>

          <h3 className="text-lg font-medium">Documents</h3>
          {Object.keys(groupSimilarDoc)
            .sort((a, b) => a.localeCompare(b))
            .map((collection) => {
              const sameParentDocs = groupSimilarDoc[collection];

              return (
                <div key={collection}>
                  <table className="w-full table-fixed ml-1 mb-4">
                    <thead>
                      <tr>
                        <th className="w-full"></th>
                        <th className="w-20"></th>
                        <th className="w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td colSpan={3}>
                          <svg
                            className="inline-block mr-2"
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M5 2.5l.5-.5h2l.5.5v11l-.5.5h-2l-.5-.5v-11zM6 3v10h1V3H6zm3.171.345l.299-.641 1.88-.684.64.299 3.762 10.336-.299.641-1.879.684-.64-.299L9.17 3.345zm1.11.128l3.42 9.396.94-.341-3.42-9.397-.94.342zM1 2.5l.5-.5h2l.5.5v11l-.5.5h-2l-.5-.5v-11zM2 3v10h1V3H2z"
                            />
                          </svg>
                          {collection}
                        </td>
                      </tr>
                      {sameParentDocs.map((doc) => (
                        <tr key={doc.id} className="hover:bg-accent group">
                          <td className="pl-4">
                            <svg
                              className="inline-block mr-2"
                              width="16"
                              height="16"
                              viewBox="0 0 16 16"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                clipRule="evenodd"
                                d="M13.71 4.29l-3-3L10 1H4L3 2v12l1 1h9l1-1V5l-.29-.71zM13 14H4V2h5v4h4v8zm-3-9V2l3 3h-3z"
                              />
                            </svg>
                            <a
                              className="font-mono text-sm text-primary underline cursor-pointer"
                              onClick={() => handleGotoDoc(doc.ref.path)}
                            >
                              {doc.id}
                            </a>
                          </td>
                          <td>
                            <span
                              className={classNames(
                                "inline-flex items-center rounded px-2 py-0.5 text-xs font-medium text-foreground",
                                {
                                  ["bg-status-deleted"]:
                                    getTag(doc) === "deleted",
                                  ["bg-status-changed"]:
                                    getTag(doc) === "modified",
                                  ["bg-status-new"]: getTag(doc) === "new",
                                }
                              )}
                            >
                              {getTag(doc)}
                            </span>
                          </td>
                          <td>
                            {/* // TODO: Tooltip to let user know this is reverse button */}
                            <button
                              className="p-1 opacity-0 group-hover:opacity-100 outline-none focus:outline-none focus-visible:outline-none focus:ring-0"
                              onClick={() => handleReverseDoc(doc)}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                                />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={handleOnReverseAll} className="outline-none focus:outline-none focus-visible:outline-none focus:ring-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
              />
            </svg>
            Revert all
          </Button>
          <Button size="sm" onClick={handleOnCommit} className="outline-none focus:outline-none focus-visible:outline-none focus:ring-0">
            Commit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PreviewChanges;
