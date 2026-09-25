"use client";

import type { FlagType, FlagVariationValue } from "@dariise/contracts";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

/**
 * The value control a variation gets, chosen by the flag's declared type.
 *
 * Shared by flag creation and the configuration tab so a value is entered the
 * same way in both, and so neither can drift into offering a shape the server
 * would reject. The type is what an SDK relies on: a `string` flag serving
 * `true` would be a type error on the client.
 */
export function VariationValueInput({
  id,
  type,
  value,
  disabled = false,
  onChange,
}: {
  id: string;
  type: FlagType;
  value: FlagVariationValue;
  disabled?: boolean;
  onChange: (value: FlagVariationValue) => void;
}) {
  if (type === "boolean") {
    return (
      <Select
        value={String(value)}
        onValueChange={(next) => onChange(next === "true")}
        disabled={disabled}
      >
        <SelectTrigger id={id} className="h-8 w-full text-[12px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="true">true</SelectItem>
          <SelectItem value="false">false</SelectItem>
        </SelectContent>
      </Select>
    );
  }

  if (type === "number") {
    return (
      <Input
        id={id}
        type="number"
        className="h-8 text-[12px]"
        disabled={disabled}
        value={String(value)}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    );
  }

  if (type === "json") {
    return (
      <Textarea
        id={id}
        rows={3}
        spellCheck={false}
        className="font-mono text-[11px]"
        disabled={disabled}
        value={JSON.stringify(value)}
        onChange={(event) => {
          // Held out of the parsed value until it parses, so a half-typed
          // document does not blank the field the user is working in.
          try {
            onChange(JSON.parse(event.target.value) as FlagVariationValue);
          } catch {
            onChange(value);
          }
        }}
      />
    );
  }

  return (
    <Input
      id={id}
      className="h-8 text-[12px]"
      disabled={disabled}
      value={String(value)}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}
