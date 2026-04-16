import { buildFSUrl, fieldAtom, fieldChangedAtom } from "@/atoms/firestore";
import { actionRemoveFieldKey } from "@/atoms/firestore.action";
import { FIELD_TYPES } from "@/atoms/navigator";
import { actionGoTo } from "@/atoms/navigator.action";
import DataInput from "@/components/DataInput";
import DateTimePicker from "@/components/DataInput/DateTimePicker";
import DropdownMenu from "@/components/DropdownMenu";
import { useContextMenu } from "@/hooks/contextMenu";
import { isNumeric } from "@/utils/common";
import { convertFSValue } from "@/utils/fieldConverter";
import { getFireStoreType } from "@/utils/simplifr";
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
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import ArrayInput from "../DataInput/ArrayInput";
import BooleanInput from "../DataInput/BooleanInput";
import GeopointPicker from "../DataInput/GeopointPicker";
import ObjectInput from "../DataInput/ObjectInput";

interface IEditableCell {
  docPath: string;
  column: {
    id: string;
  };
  tabIndex: number;
  canChangeType?: boolean;
  toggleExpand: (boolean) => void;
}

export const EditablePropertyValue = ({
  docPath,
  column: { id },
  tabIndex,
  canChangeType = true,
  toggleExpand,
}: IEditableCell): React.ReactElement => {
  const fieldPath = buildFSUrl({ path: docPath, field: id });
  const [value, setValue] = useRecoilState(fieldAtom(fieldPath));
  const isFieldChanged = useRecoilValue(fieldChangedAtom(fieldPath));
  const [instanceValue, setInstanceValue] = useState(value);
  const [isHighlight, toggleHighlight] = useState(false);
  const [isHovered, setHovered] = useState(false);
  const [isFocused, setFocused] = useState(false);
  const wrapperEl = useRef(null);
  const inputEl = useRef<HTMLTextAreaElement>(null);

  const onChange = useCallback(
    (newInstanceValue) => {
      if (
        getFireStoreType(instanceValue) === "number" &&
        isNumeric(newInstanceValue)
      ) {
        // Respect current type
        setInstanceValue(Number(newInstanceValue));
      } else {
        setInstanceValue(newInstanceValue);
      }
    },
    [setInstanceValue]
  );

  const onBlur = useCallback(() => {
    setFocused(false);
    if (instanceValue !== value) {
      setValue(instanceValue);
    }
  }, [instanceValue, value]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      setFocused(true);
      if (e.key === "Escape") {
        setInstanceValue(value);
      }
    },
    [value]
  );

  const toggleHight = useCallback(() => {
    toggleHighlight(true);
    setTimeout(() => {
      toggleHighlight(false);
    }, 300);
  }, []);

  // Sync the external into instanceValue
  useEffect(() => {
    if (!isUndefined(value) && !isEqual(instanceValue, value)) {
      setInstanceValue(value);
      toggleHight();
    }
  }, [value]);

  const menuOptions = useMemo(() => {
    return FIELD_TYPES.map((fieldType) => ({
      title: fieldType,
      hint: fieldType,
      onClick: () => {
        const newValue = convertFSValue(instanceValue, fieldType);
        setValue(newValue);
      },
    }));
  }, [instanceValue, setValue]);

  useContextMenu(
    "DELETE_PROPERTY_VALUE",
    () => {
      actionRemoveFieldKey(fieldPath);
    },
    fieldPath
  );

  const fieldType = useMemo(() => {
    return getFireStoreType(instanceValue);
  }, [instanceValue]);

  // console.log(fieldPath, fieldType, instanceValue);

  const handleClickFollowLink = useCallback(
    (e: MouseEvent | null, link: string, isInternal = true) => {
      if (e === null || e.ctrlKey || e.metaKey) {
        if (isInternal) {
          actionGoTo(link);
        } else {
          window.open(link, "_blank");
        }
      }
    },
    []
  );

  let defaultEditor: ReactElement | null;

  switch (fieldType) {
    case "timestamp":
      defaultEditor = (
        <DateTimePicker
          value={instanceValue as firebase.firestore.Timestamp}
          onChange={setValue}
        />
      );
      break;
    case "null":
      defaultEditor = null;
      break;
    case "map":
      defaultEditor = (
        <ObjectInput fieldPath={fieldPath} toggleExpand={toggleExpand} />
      );
      break;
    case "array":
      defaultEditor = (
        <ArrayInput fieldPath={fieldPath} toggleExpand={toggleExpand} />
      );
      break;
    case "boolean":
      defaultEditor = (
        <BooleanInput value={instanceValue as boolean} onChange={setValue} />
      );
      break;
    case "reference":
      const refValue = instanceValue as DocRef;
      defaultEditor = (
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <DataInput
              ref={inputEl}
              className="text-primary underline focus:ring-1 focus:ring-ring"
              onClick={(e) => handleClickFollowLink(e, refValue.path)}
              tabIndex={tabIndex}
              value={refValue.path}
              onChange={(e) => onChange(new DocRef(e.target.value))}
              onBlur={onBlur}
              onKeyDown={onKeyDown}
            />
          </TooltipTrigger>
          <TooltipContent side="top" align="start" className="max-w-2xl">
            <span className="text-foreground">
              <a
                className="text-primary"
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
    case "geopoint":
      const mapValue = instanceValue as firebase.firestore.GeoPoint;
      defaultEditor = (
        <GeopointPicker
          value={mapValue}
          onChange={(newValue) => onChange(newValue)}
        />
      );
      break;
    default:
      const isUrl = /^(https?:\/\/[^\s]+)$/.test(
        instanceValue?.toString() || ""
      );
      const urlInput = (
        <DataInput
          ref={inputEl}
          className={classNames("focus:ring-1 focus:ring-ring", {
            ["underline text-primary"]: isUrl,
          })}
          minRows={2}
          maxRows={12}
          onClick={(e) =>
            handleClickFollowLink(e, instanceValue?.toString() || "", false)
          }
          tabIndex={tabIndex}
          value={instanceValue}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
        />
      );
      defaultEditor = isUrl ? (
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>{urlInput}</TooltipTrigger>
          <TooltipContent side="top" align="start" className="max-w-2xl">
            <span>
              <a
                className="text-primary"
                onClick={() =>
                  handleClickFollowLink(
                    null,
                    instanceValue?.toString() || "",
                    false
                  )
                }
              >
                Follow URL
              </a>{" "}
              (cmd + click)
            </span>
          </TooltipContent>
        </Tooltip>
      ) : (
        urlInput
      );
      break;
  }

  return (
    <div
      className={classNames("relative w-full outline-none min-h-12", {
        ["bg-status-changed"]: isFieldChanged,
        ["bg-status-highlight transition-colors duration-300"]: isHighlight,
      })}
      ref={wrapperEl}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      cm-template="propertyValue"
      cm-id={fieldPath}
    >
      <div
        className={classNames(
          "absolute z-20 opacity-0 top-0.5 right-0.5 hover:opacity-100 transition-opacity",
          {
            ["opacity-70"]: isHovered && !isFocused,
          }
        )}
      >
        {isHovered && (
          <DropdownMenu menu={menuOptions} isSmall disabled={!canChangeType}>
            <button
              role="button"
              className="p-1 font-mono text-xs text-destructive bg-card border border-border"
            >
              {fieldType}
            </button>
          </DropdownMenu>
        )}
      </div>
      {defaultEditor}
    </div>
  );
};

export default EditablePropertyValue;
