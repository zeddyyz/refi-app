import React, { useRef } from "react";
import { uniqueId } from "lodash";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface IBooleanInputProps {
  value: boolean;
  onChange: (boolean) => void;
}

const BooleanInput = ({ value, onChange }: IBooleanInputProps) => {
  const idRef = useRef(uniqueId("boolean-input-"));

  return (
    <div className="h-12 p-1">
      <div className="flex items-center gap-2">
        <Checkbox
          id={idRef.current}
          checked={value}
          onCheckedChange={(v) => onChange(!!v)}
        />
        <Label htmlFor={idRef.current} hidden>
          {value ? "true" : "false"}
        </Label>
      </div>
    </div>
  );
};

export default BooleanInput;
