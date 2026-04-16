import {
  changedDocAtom,
  collectionHasBeenDeleteAtom,
  deletedDocsAtom,
  newDocsAtom,
} from "@/atoms/firestore";
import {
  actionCommitChange,
  actionReverseChange,
} from "@/atoms/firestore.action";
import { globalHotKeys } from "@/atoms/hotkeys";
import { isShowPreviewChangeModalAtom } from "@/atoms/ui";
import PathInput from "@/components/PathInput";
import { Button as ShadcnButton } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import React, { useEffect, useState } from "react";
import { useRecoilCallback, useSetRecoilState } from "recoil";
import ShortcutKey from "../ShortcutKey";

const NavBar = () => {
  const setShowChangeModal = useSetRecoilState(isShowPreviewChangeModalAtom);
  // const isCommittable = useRecoilValue(isCommittableAtom);
  const [isCommittable, setCommittable] = useState(false);

  const checkCommittable = useRecoilCallback(({ snapshot }) => async () => {
    const changedDocs = await snapshot.getPromise(changedDocAtom);
    const newDocs = await snapshot.getPromise(newDocsAtom);
    const deletedDocs = await snapshot.getPromise(deletedDocsAtom);
    const deletedCollections = await snapshot.getPromise(
      collectionHasBeenDeleteAtom
    );
    setCommittable(
      changedDocs.length > 0 ||
        newDocs.length > 0 ||
        deletedDocs.length > 0 ||
        deletedCollections.length > 0
    );
  });

  useEffect(() => {
    const id = setInterval(() => {
      checkCommittable();
    }, 300);

    return () => {
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    // TODO: Show confirm dialog when reload or exit
  }, [isCommittable]);

  return (
    <div className="flex flex-row items-center gap-2 h-10 px-3 w-full">
      <div className="flex flex-row items-center gap-2">
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <ShadcnButton
              size="sm"
              variant="outline"
              onClick={() => setShowChangeModal(true)}
              disabled={!isCommittable}
              className="h-7 px-3 dark:text-white"
            >
              Preview changes
            </ShadcnButton>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="z-50 max-w-2xl p-2">
            <ShortcutKey
              size="small"
              hotkey={globalHotKeys.PREVIEW_CHANGES.sequences}
            />
          </TooltipContent>
        </Tooltip>
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <ShadcnButton
              size="sm"
              disabled={!isCommittable}
              onClick={actionCommitChange}
              className="h-7 px-3 dark:text-white"
            >
              Commit
            </ShadcnButton>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-2xl p-2">
            <ShortcutKey
              size="small"
              hotkey={globalHotKeys.COMMIT_CHANGES.sequences}
            />
          </TooltipContent>
        </Tooltip>
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <ShadcnButton
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full"
              onClick={actionReverseChange}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </ShadcnButton>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="z-50 max-w-2xl p-2">
            <ShortcutKey
              size="small"
              title="Refresh - Revert uncommitted changes"
              hotkey={globalHotKeys.REVERT_CHANGES.sequences}
            />
          </TooltipContent>
        </Tooltip>
      </div>
      <div className="flex-1 min-w-0">
        <PathInput />
      </div>
    </div>
  );
};

export default NavBar;
