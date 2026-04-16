import { navigatorPathAtom } from "@/atoms/navigator";
import { actionGoTo } from "@/atoms/navigator.action";
import { viewModePathInputAtom } from "@/atoms/ui";
import CopyIcon from "@/components/CopyIcon";
import {
  getCollectionPath,
  getPathEntities,
  getProjectId,
} from "@/utils/common";
import { Input } from "@zendeskgarden/react-forms";
import React, {
  ChangeEvent,
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRecoilState } from "recoil";

function PathInput() {
  const [path, setPath] = useRecoilState(navigatorPathAtom);
  const [isViewMode, toggleViewMode] = useRecoilState(viewModePathInputAtom);
  const [pathInput, setPathInput] = useState(path);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChangeValue = (e: ChangeEvent<HTMLInputElement>) => {
    setPathInput(e.target.value);
  };

  const handlePathChange = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setPath(pathInput);
    }
  };

  useEffect(() => {
    setPathInput(path);
  }, [path]);

  useEffect(() => {
    if (!isViewMode) {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [isViewMode]);

  const handleClickEntity = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    entity: string
  ) => {
    e.preventDefault();
    e.stopPropagation();
    actionGoTo(path.substring(0, path.indexOf(entity) + entity.length));
  };

  const PathViewer = useMemo(() => {
    let entities = getPathEntities(path);
    if (["", "/"].includes(path)) {
      entities = [getProjectId()];
    }

    if (entities.length > 8) {
      entities = [...entities.slice(0, 3), "…", ...entities.slice(-4)];
    }

    return (
      <div
        className="flex items-center gap-1 w-full overflow-hidden whitespace-nowrap cursor-pointer px-2"
        onClick={() => toggleViewMode(false)}
        key={getCollectionPath(path)}
      >
        {entities.map((entity, index) => {
          const isLast = index === entities.length - 1;
          const separator =
            index > 0 ? (
              <span
                key={`sep-${index}`}
                className="text-muted-foreground/60"
              >
                /
              </span>
            ) : null;

          if (entity === "…") {
            return (
              <React.Fragment key={`ellipsis-${index}`}>
                {separator}
                <span className="text-muted-foreground">…</span>
              </React.Fragment>
            );
          }

          if (isLast) {
            return (
              <React.Fragment key={`${entity}-${index}`}>
                {separator}
                <span className="font-medium text-foreground truncate">
                  {entity}
                </span>
              </React.Fragment>
            );
          }

          return (
            <React.Fragment key={`${entity}-${index}`}>
              {separator}
              <button
                type="button"
                onClick={(e) => handleClickEntity(e, entity)}
                className="text-muted-foreground hover:text-foreground truncate"
              >
                {entity}
              </button>
            </React.Fragment>
          );
        })}
      </div>
    );
  }, [path]);

  return (
    <div className="relative flex flex-row items-center h-7 bg-card border border-border rounded-md group w-full overflow-hidden">
      {isViewMode ? (
        PathViewer
      ) : (
        <Input
          ref={inputRef}
          isCompact
          value={pathInput}
          onChange={handleChangeValue}
          onKeyDown={handlePathChange}
          className="pr-8 bg-card border-0 h-7 focus:ring-0"
          onBlur={() => toggleViewMode(true)}
        />
      )}
      <CopyIcon
        value={path}
        className="absolute w-4 transform -translate-y-1/2 opacity-0 cursor-pointer right-1.5 top-1/2 group-hover:opacity-100 text-muted-foreground hover:text-foreground"
      />
    </div>
  );
}

export default PathInput;
