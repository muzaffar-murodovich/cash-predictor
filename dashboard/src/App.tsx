import { useState, useEffect } from "react";
import { Building2 } from "lucide-react";
import { useBranches } from "@/lib/queries";
import { SummaryCards } from "@/components/SummaryCards";
import { BranchSelector } from "@/components/BranchSelector";
import { ForecastChart } from "@/components/ForecastChart";
import { RecommendationsList } from "@/components/RecommendationsList";
import { AnomaliesTable } from "@/components/AnomaliesTable";

export default function App() {
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const { data: branches } = useBranches();

  useEffect(() => {
    if (branches && branches.length > 0 && selectedBranchId === null) {
      setSelectedBranchId(branches[0].branch_id);
    }
  }, [branches, selectedBranchId]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-screen-xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-blue-600 p-1.5">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-slate-800 text-sm">Kassa Forecast</span>
              <span className="ml-2 text-xs text-slate-400">AI tahlil tizimi</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Jonli
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 py-6 space-y-6">
        <SummaryCards />

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-4">
            <BranchSelector
              selectedId={selectedBranchId}
              onSelect={setSelectedBranchId}
            />
            <ForecastChart branchId={selectedBranchId} />
          </div>

          <div className="lg:col-span-2">
            <RecommendationsList branchId={selectedBranchId} />
          </div>
        </div>

        <AnomaliesTable />
      </main>

      <footer className="border-t border-slate-200 bg-white mt-8">
        <div className="max-w-screen-xl mx-auto px-6 py-3 text-xs text-slate-400 text-center">
          Bank Kassa Forecast &mdash; Hackathon Demo
        </div>
      </footer>
    </div>
  );
}
