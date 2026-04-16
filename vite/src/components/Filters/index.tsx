import {
  collectionWithQueryAtom,
  totalDocsWithQueryAtom,
} from "@/atoms/firestore";
import { actionNewDocument } from "@/atoms/firestore.action";
import { globalHotKeys } from "@/atoms/hotkeys";
import {
  navigatorCollectionPathAtom,
  querierAtom,
  queryVersionAtom,
} from "@/atoms/navigator";
import {
  actionAddFilter,
  actionQueryPage,
  actionSubmitQuery,
} from "@/atoms/navigator.action";
import { isModalPickProperty } from "@/atoms/ui";
import DropdownMenu from "@/components/DropdownMenu";
import PropertyList from "@/components/PropertyList";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tooltip } from "@zendeskgarden/react-tooltips";
import classNames from "classnames";
import React, { useCallback, useMemo } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import ShortcutKey from "../ShortcutKey";
import FilterItem from "./FilterItem";

const NextButton = () => {
  const queryVersionData = useRecoilValue(queryVersionAtom);
  const docs = useRecoilValue(
    collectionWithQueryAtom(queryVersionData.collectionPath)
  );
  const handleClickNext = useCallback(() => {
    actionQueryPage(true);
  }, []);

  const isDisabled = useMemo(() => {
    if (docs.length === 0 && queryVersionData.startAfter) {
      return true;
    }

    return false;
  }, [docs.length, queryVersionData.startAfter]);

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={isDisabled}
      className="px-2 h-7"
      onClick={handleClickNext}
    >
      Next
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M10.072 8.024L5.715 3.667l.618-.62L11 7.716v.618L6.333 13l-.618-.619 4.357-4.357z"
        />
      </svg>
    </Button>
  );
};

const PreviousButton = () => {
  const queryVersionData = useRecoilValue(queryVersionAtom);
  const docs = useRecoilValue(
    collectionWithQueryAtom(queryVersionData.collectionPath)
  );
  const handleClickPrevious = useCallback(() => {
    actionQueryPage(false);
  }, []);

  const isDisabled = useMemo(() => {
    if (docs.length === 0 && queryVersionData.endBefore) {
      return true;
    }

    return false;
  }, [docs.length, queryVersionData.endBefore]);

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={isDisabled}
      className="px-2 h-7"
      onClick={handleClickPrevious}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M5.928 7.976l4.357 4.357-.618.62L5 8.284v-.618L9.667 3l.618.619-4.357 4.357z"
        />
      </svg>
      Previous
    </Button>
  );
};

const Filters = () => {
  const collectionPath = useRecoilValue(navigatorCollectionPathAtom);
  const queryOptions = useRecoilValue(querierAtom(collectionPath));
  const [isShowPropertyList, setShowPropertyList] = useRecoilState(
    isModalPickProperty
  );

  const totalDocs = useRecoilValue(totalDocsWithQueryAtom(collectionPath));

  const handleAddFilter = () => {
    actionAddFilter("", "==", collectionPath);
  };

  const queryMenu = useMemo(() => {
    return [
      {
        title: "Without filter",
        hotkey: globalHotKeys.SEND_QUERY_WITHOUT_FILTER.sequences,
        className: "text-foreground",
        onClick: () => {
          actionSubmitQuery(false);
        },
      },
    ];
  }, []);

  return (
    <div className="px-3 py-2 border-b border-border space-y-2">
      {queryOptions.map((filter) => (
        <FilterItem key={filter.id} id={filter.id}></FilterItem>
      ))}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleAddFilter} className="px-3 h-7 bg-secondary">
            Add Filters
          </Button>
          <Popover open={isShowPropertyList} onOpenChange={setShowPropertyList}>
            <PopoverTrigger asChild>
              <Button
                size="sm"
                className={classNames("px-3 h-7 bg-secondary", {
                  "bg-secondary": isShowPropertyList,
                })}
              >
                Properties
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              className="p-2 w-64"
            >
              <PropertyList />
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2 text-sm text-muted-foreground">
            <div className="text-sm">
              <strong className="text-foreground">{totalDocs}</strong> document(s)
            </div>
            <div className="flex items-center gap-1">
              <PreviousButton />
              <NextButton />
            </div>
          </div>
          <Tooltip
            placement="bottom"
            appendToNode={document.body}
            zIndex={40}
            delayMS={100}
            hasArrow={false}
            size="medium"
            type="light"
            className="max-w-2xl p-2"
            content={
              <ShortcutKey
                size="small"
                hotkey={globalHotKeys.NEW_DOCUMENT.sequences}
              />
            }
          >
            <Button
              size="sm"
              onClick={() => actionNewDocument(collectionPath)}
              className="px-3 h-7"
            >
              New document
            </Button>
          </Tooltip>
          <div className="flex items-center">
            <Tooltip
              placement="bottom"
              appendToNode={document.body}
              zIndex={40}
              delayMS={100}
              hasArrow={false}
              size="medium"
              type="light"
              className="max-w-2xl p-2"
              content={
                <ShortcutKey
                  size="small"
                  hotkey={globalHotKeys.SEND_QUERY.sequences}
                />
              }
            >
              <Button
                size="sm"
                onClick={() => actionSubmitQuery(true)}
                className="px-3 h-7 rounded-r-none"
              >
                Query
              </Button>
            </Tooltip>
            <DropdownMenu
              menu={queryMenu}
              placement="bottom-end"
              className="ml-px"
              containerClassName="w-60 bg-popover"
            >
              <Button size="sm" className="h-7 px-1 rounded-l-none">
                <svg
                  className="w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </Button>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Filters;
