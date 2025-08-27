import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export type ProfileStatus = "online" | "away" | "busy";

const statusOptions = [
  { value: "online", label: "Online", color: "#4ade80" },
  { value: "away", label: "Away", color: "#FFD600" },
  { value: "busy", label: "Busy", color: "#f87171" },
];

export function ProfileStatusSelect({ value, onChange, disabled }: {
  value: ProfileStatus;
  onChange: (v: ProfileStatus) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor="status" className="text-yellow-400">Status</Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="w-full bg-[#181818] border-[#333] text-white rounded-lg">
          <span className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full" style={{ background: statusOptions.find(o => o.value === value)?.color }} />
            <SelectValue />
          </span>
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <span className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-full" style={{ background: option.color }} />
                {option.label}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
