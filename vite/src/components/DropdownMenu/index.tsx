import {
  DropdownMenu as Root,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import React from "react";
import ShortcutKey from "../ShortcutKey";

interface IMenuItem {
  title: string;
  onClick: () => void;
  hotkey?: string | string[];
  hint?: string;
  className?: string;
  disabled?: boolean;
}

interface IDropdownMenuProps {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  placement?: string;
  isSmall?: boolean;
  disabled?: boolean;
  menu: IMenuItem[];
}

function DropdownMenu({
  children,
  placement = "bottom-start",
  className,
  containerClassName,
  menu,
  disabled = false,
}: IDropdownMenuProps) {
  const align = placement.endsWith("end")
    ? "end"
    : placement.endsWith("start")
    ? "start"
    : "center";
  const side = placement.startsWith("top")
    ? "top"
    : placement.startsWith("left")
    ? "left"
    : placement.startsWith("right")
    ? "right"
    : "bottom";

  return (
    <Root>
      <DropdownMenuTrigger asChild disabled={disabled} className={className}>
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={align as "start" | "end" | "center"}
        side={side as "top" | "bottom" | "left" | "right"}
        className={cn("min-w-[8rem]", containerClassName)}
      >
        {menu.map((item, index) => (
          <DropdownMenuItem
            key={`${item.title}${index}`}
            disabled={item.disabled}
            onSelect={() => item.onClick()}
            className={cn(
              "flex flex-row justify-between items-center gap-4 cursor-pointer",
              item.className
            )}
          >
            <span>{item.title}</span>
            {item.hotkey && (
              <ShortcutKey hotkey={item.hotkey} size="small" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </Root>
  );
}

export default DropdownMenu;
