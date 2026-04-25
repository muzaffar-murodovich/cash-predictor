import { useQuery } from "@tanstack/react-query";
import { api } from "./api";

export const useSummary = () =>
  useQuery({
    queryKey: ["summary"],
    queryFn: api.getSummary,
    refetchInterval: 60_000,
  });

export const useBranches = () =>
  useQuery({
    queryKey: ["branches"],
    queryFn: api.getBranches,
  });

export const useForecast = (branchId: number | null) =>
  useQuery({
    queryKey: ["forecast", branchId],
    queryFn: () => api.getForecast(branchId!),
    enabled: branchId !== null,
  });

export const useRecommendations = (branchId: number | null) =>
  useQuery({
    queryKey: ["recommendations", branchId],
    queryFn: () => api.getRecommendations(branchId!),
    enabled: branchId !== null,
  });

export const useAnomalies = () =>
  useQuery({
    queryKey: ["anomalies"],
    queryFn: api.getAnomalies,
    refetchInterval: 60_000,
  });

export const useHistory = (branchId: number | null) =>
  useQuery({
    queryKey: ["history", branchId],
    queryFn: () => api.getHistory(branchId!),
    enabled: branchId !== null,
  });
