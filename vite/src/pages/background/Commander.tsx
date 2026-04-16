import { globalHotKeysHandler } from "@/atoms/hotkeys";
import { isModalCommandAtom } from "@/atoms/ui";
import ListOptions from "@/components/ListOptions";
import ShortcutKey from "@/components/ShortcutKey";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import classNames from "classnames";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { getApplicationKeyMap } from "react-hotkeys";
import { useSetRecoilState } from "recoil";

interface ICommand {
  name: string;
  sequences: {
    sequence: string;
  }[];
  key: string;
}

const CommandOption = ({
  isActive,
  command,
  onClickItem,
}: {
  isActive?: boolean;
  command: ICommand;
  onClickItem?: (string) => void;
}) => (
  <a
    href="#"
    key={command.name}
    className={classNames(
      "flex flex-row justify-between px-3 py-2 text-sm rounded-sm text-foreground hover:bg-accent",
      { ["bg-accent"]: isActive }
    )}
    role="menuitem"
    onClick={(e) => {
      e.preventDefault();
      if (onClickItem) {
        onClickItem(command.key);
      }
    }}
    data-id={command.key}
  >
    {command.name}
    <span className="space-x-4">
      {command.sequences.map((data, index) => (
        <ShortcutKey key={index} hotkey={data.sequence} />
      ))}
    </span>
  </a>
);

const Commander = () => {
  const setShowModalCommand = useSetRecoilState(isModalCommandAtom);
  const [keyword, setKeyword] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [activeOption, setActive] = useState<number>(1);

  const keyMap = getApplicationKeyMap();

  const filteredCommands = useMemo<ICommand[]>(() => {
    const keywordLowercase = keyword.toLowerCase();
    return Object.keys(keyMap)
      .map((key) => ({ ...keyMap[key], key }))
      .filter((command) => {
        return (
          command &&
          command?.name &&
          command?.name.toLowerCase().includes(keywordLowercase)
        );
      }) as any;
  }, [keyMap, keyword]);

  useEffect(() => {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 250);
  }, []);

  const options = useMemo(() => {
    const filtered = filteredCommands.map((command) => ({
      element: <CommandOption command={command} />,
      key: command.key,
    }));

    return filtered;
  }, [filteredCommands]);

  const currentOption = useMemo(() => options[activeOption], [
    activeOption,
    options,
  ]);

  useEffect(() => {
    if (!currentOption) {
      setActive(1);
    }
  }, [currentOption]);

  const onSelectOption = useCallback((command) => {
    setShowModalCommand(false);
    if (globalHotKeysHandler[command]) {
      globalHotKeysHandler[command]();
    }
  }, []);

  const handleInputKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (
    e
  ) => {
    const maxOptionsIndex = options.length;
    switch (e.key) {
      case "ArrowUp":
        setActive((index) =>
          index === 0 ? maxOptionsIndex - 1 : (index - 1) % maxOptionsIndex
        );
        break;
      case "ArrowDown":
        setActive((index) => (index + 1) % maxOptionsIndex);
        break;
      case "Enter":
        onSelectOption(currentOption.key);
        break;
      case "Escape":
        setShowModalCommand(false);
        break;
    }
  };

  // TODO: Add a section for recent commands

  return (
    <Dialog
      open={true}
      onOpenChange={(open) => !open && setShowModalCommand(false)}
    >
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
        <div className="p-3 border-b border-border">
          <Input
            placeholder="Commit changes, preview changes,... anything in your head 🤓"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={handleInputKeyDown}
            ref={inputRef}
            autoFocus
            className="h-9"
            tabIndex={1}
          />
        </div>
        <div
          className="max-h-80 overflow-auto p-1"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="options-menu"
        >
          <ListOptions
            options={options}
            onChange={onSelectOption}
            currentOption={currentOption?.key || "general"}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Commander;
