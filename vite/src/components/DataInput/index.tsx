import { Textarea } from "@/components/ui/textarea";
import React, { useMemo } from "react";
import classNames from "classnames";

const DataInput = (props: any, ref) => {
  const isMultipleLine = useMemo(() => {
    return String(props.value)?.split("\n").length >= 2;
  }, [props.value]);

  const isVeryLong = String(props.value)?.length > 100;

  return (
    <Textarea
      {...props}
      ref={ref}
      className={classNames(
        "w-full outline-none ring-inset focus:bg-accent text-foreground p-1.5 bg-transparent border-0 focus:ring-0",
        {
          ["h-8"]: isMultipleLine || isVeryLong,
        },
        props.className
      )}
    />
  );
};

export default React.forwardRef(DataInput);
