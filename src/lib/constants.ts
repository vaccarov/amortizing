import type { Params } from "@/types";

export const SOCIAL_CONTRIBUTIONS = 18.6;

export const TMI_BRACKETS = [0, 11, 30, 41, 45] as const;

export const DEFAULT_PARAMS: Params = {
  loanAmount: 150000,
  annualRate: 4.35,
  duration: 240,
  insuranceRate: 0.2,
  gracePeriod: 6,
  vestingPeriod: 5,
  startDate: "2026-05-25",
  grossYield: 6,
  guaranteeFee: 2400,
  processingFee: 1200,
  brokerFee: 1500,
  annualAppreciation: 0.5,
  apport: 5100,
  tmi: 30,
  avgTaxRate: 17,
  cashback: 4500,
  europeanScpiPercent: 100,
};
