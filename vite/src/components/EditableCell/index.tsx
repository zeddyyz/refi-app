import { buildFSUrl, fieldAtom, fieldChangedAtom } from "@/atoms/firestore";
import { navigatorPathAtom } from "@/atoms/navigator";
import { actionGoTo } from "@/atoms/navigator.action";
import { useContextMenu } from "@/hooks/contextMenu";
import { ClientDocumentSnapshot } from "@/types/ClientDocumentSnapshot";
import { getPathEntities, isNumeric } from "@/utils/common";
import { getFireStoreType } from "@/utils/simplifr";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import classNames from "classnames";
import { DocRef } from "firestore-serializers";
import { isEqual, isUndefined } from "lodash";
import React, {
  ReactElement,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import CopyIcon from "@/components/CopyIcon";
import DateTimePicker from "@/components/DataInput/DateTimePicker";

interface IEditableCell {
  row: ClientDocumentSnapshot;
  column: {
    id: string;
  };
  value: any;
  tabIndex: number;
}

const EditableCell = ({
  row,
  column: { id },
  tabIndex,
}: IEditableCell): React.ReactElement => {
  const fieldPath = buildFSUrl({ path: row.ref.path, field: id });
  const [value, setValue] = useRecoilState(fieldAtom(fieldPath));
  const isFieldChanged = useRecoilValue(fieldChangedAtom(fieldPath));
  const [instanceValue, setInstanceValue] = useState(value);
  const [isHighlight, toggleHighlight] = useState(false);
  const wrapperEl = useRef(null);
  const inputEl = useRef<HTMLTextAreaElement>(null);

  const fieldType = useMemo(() => {
    return getFireStoreType(value);
  }, [value]);

  const onChange = (newInstanceValue) => {
    if (isUndefined(value)) {
      setValue(newInstanceValue);
      return;
    }
    if (
      (fieldType === "number" && isNumeric(newInstanceValue)) ||
      (fieldType === "number" && newInstanceValue === "")
    ) {
      // Respect current type
      setInstanceValue(Number(newInstanceValue));
    } else {
      setInstanceValue(newInstanceValue);
    }
  };

  const onBlur = () => {
    if (instanceValue !== value) {
      setValue(instanceValue);
    }
  };

  const toggleHight = () => {
    toggleHighlight(true);
    setTimeout(() => {
      toggleHighlight(false);
    }, 300);
  };

  // Sync the external into instanceValue
  useEffect(() => {
    if (!isEqual(instanceValue, value)) {
      setInstanceValue(value);
      // TODO: Need approach to only toggleHight if the changes come from others source
      toggleHight();
    }
  }, [value]);

  const handleClickFollowLink = (
    e: MouseEvent | null,
    link: string,
    isInternal = true
  ) => {
    if (e === null || e.ctrlKey || e.metaKey) {
      if (isInternal) {
        actionGoTo(link);
      } else {
        window.open(link, "_blank");
      }
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape") {
      setInstanceValue(value);
    }

    if (e.key === "Enter" && (e.shiftKey || e.altKey)) {
      setInstanceValue((curValue) => curValue + "\n");
      return;
    }

    // How about break line case?
    if (e.key === "Enter") {
      if (instanceValue !== value) {
        setValue(instanceValue);
      }
      e.preventDefault();
      return;
    }
  };

  // TODO: Add quick look for object type. It will open a modal showing what inside, user can see it but can not edit it

  const editorComponent = useMemo(() => {
    let defaultEditor: ReactElement = (
      <Textarea
        ref={inputEl}
        className={classNames(
          "w-full absolute bg-transparent overflow-hidden truncate h-full min-h-full outline-none border-0 rounded-none ring-inset focus:bg-accent p-1.5 pt-2 focus:ring-1 focus:ring-ring focus:z-50 focus:shadow-lg",
          {
            ["text-right"]: fieldType === "number",
            ["h-focus-full-2"]: String(instanceValue).includes("\n"),
          }
        )}
        value={instanceValue as string}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
      />
    );

    if (!isUndefined(instanceValue)) {
      switch (fieldType) {
        case "array":
          defaultEditor = (
            <div className="p-1.5 font-mono truncate">
              {JSON.stringify(value)}
            </div>
          );
          break;
        case "map":
          defaultEditor = (
            <div className="p-1.5 font-mono truncate">
              {JSON.stringify(value)}
            </div>
          );
          break;
        case "geopoint":
          defaultEditor = (
            <div className="p-1.5 font-mono text-destructive">geopoint</div>
          );
          break;
        case "timestamp":
          defaultEditor = (
            <DateTimePicker
              value={value as firebase.firestore.Timestamp}
              onChange={(newValue) => setValue(newValue)}
            />
          );
          break;
        case "boolean":
          defaultEditor = (
            <div className="p-1.5">
              <div className="flex items-center gap-2">
                <Checkbox
                  id={fieldPath}
                  checked={value as boolean}
                  onCheckedChange={(v) => setValue(Boolean(v))}
                />
                <Label htmlFor={fieldPath} hidden>
                  {value ? "true" : "false"}
                </Label>
              </div>
            </div>
          );
          break;
        case "reference":
          const refValue = instanceValue as DocRef;
          defaultEditor = (
            <Tooltip delayDuration={100}>
              <TooltipTrigger asChild>
                <Textarea
                  ref={inputEl}
                  className={classNames(
                    "focus:ring-1 p-1.5 pt-2 bg-transparent break-all outline-none border-0 rounded-none min-h-0 focus:ring-ring h-full w-full truncate underline text-primary focus:z-50 focus:shadow-lg",
                    {
                      ["bg-status-changed"]: isFieldChanged,
                      ["bg-status-highlight transition-colors duration-300"]: isHighlight,
                    }
                  )}
                  onClick={(e) => handleClickFollowLink(e as any, refValue.path)}
                  tabIndex={tabIndex}
                  value={refValue.path}
                  onChange={(e) => onChange(new DocRef(e.target.value))}
                  onBlur={onBlur}
                  onKeyDown={onKeyDown}
                />
              </TooltipTrigger>
              <TooltipContent side="top" align="start" className="w-32">
                <span className="text-foreground">
                  <a
                    className="text-primary cursor-pointer"
                    onClick={() => handleClickFollowLink(null, refValue.path)}
                  >
                    Follow reference
                  </a>{" "}
                  (cmd + click)
                </span>
              </TooltipContent>
            </Tooltip>
          );
          break;
      }
    }

    return defaultEditor;
  }, [fieldType, instanceValue, onChange, setValue]);

  return (
    <div
      ref={wrapperEl}
      className={classNames("w-full h-full outline-none group relative", {
        ["bg-status-changed"]: isFieldChanged,
        ["bg-status-highlight transition-colors duration-300"]: isHighlight,
      })}
    >
      {editorComponent}
    </div>
  );
};

interface IIDReadonlyCell {
  value?: string;
  children?: ReactNode;
  isNew?: boolean;
}

export const IDReadOnlyField = ({
  value,
  children,
  isNew = false,
}: IIDReadonlyCell) => {
  const currentPath = useRecoilValue(navigatorPathAtom);
  const isActive = value === getPathEntities(currentPath).pop();

  if (children) {
    return <div className="w-full h-full px-px">{children}</div>;
  }

  return (
    <div className="relative w-full h-full px-px font-mono group">
      <input
        className={classNames(
          "focus:ring-1 focus:ring-ring w-full h-full bg-transparent outline-none ring-inset focus:bg-accent p-1.5 text-foreground font-mono text-sm",
          {
            ["pl-0.5 border-l-4 border-primary"]: isActive,
            ["bg-status-new"]: isNew,
          }
        )}
        value={value}
        readOnly
      />
      <CopyIcon
        value={value || ""}
        className="absolute w-6 transform -translate-y-1/2 bg-card opacity-0 cursor-pointer right-1 top-1/2 group-hover:opacity-100 p-0.5 rounded"
      />
    </div>
  );
};

export default EditableCell;
