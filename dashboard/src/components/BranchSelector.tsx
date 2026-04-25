import { MapPin } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useBranches } from "@/lib/queries";
import { formatCurrency } from "@/lib/formatters";
import type { Branch } from "@/lib/api";

interface BranchSelectorProps {
  selectedId: number | null;
  onSelect: (id: number) => void;
}

export function BranchSelector({ selectedId, onSelect }: BranchSelectorProps) {
  const { data: branches, isLoading } = useBranches();

  if (isLoading) return <Skeleton className="h-10 w-full" />;

  const selected = branches?.find((b: Branch) => b.branch_id === selectedId);

  return (
    <div className="space-y-2">
      <Select
        value={selectedId?.toString() ?? ""}
        onValueChange={(val) => onSelect(Number(val))}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Filial tanlang…" />
        </SelectTrigger>
        <SelectContent>
          {branches?.map((branch: Branch) => (
            <SelectItem key={branch.branch_id} value={branch.branch_id.toString()}>
              <div className="flex items-center gap-2">
                <span className="font-medium">{branch.name}</span>
                <span className="text-slate-400 text-xs">— {branch.city}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selected && (
        <div className="flex items-center justify-between px-1 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {selected.city}
          </span>
          <span className="font-medium text-slate-700">
            Joriy balans: {formatCurrency(selected.current_balance)}
          </span>
        </div>
      )}
    </div>
  );
}
