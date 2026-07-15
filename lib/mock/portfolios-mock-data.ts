// Mock data + thunks for Portfolios "Folder Setup" and "Setup" screens.
//
// There is no backend endpoint for portfolio folder hierarchy or
// portfolio-level settings yet. Each thunk below is shaped exactly like a
// real future `investmentsApi.*` thunk (same createAsyncThunk pattern,
// same async/await shape) so that swapping in a real API call later is a
// one-line change inside the thunk body — see the TODO(backend) markers.
import { createAsyncThunk } from "@reduxjs/toolkit"

// ─── Folder Setup — portfolio grouping / hierarchy ─────────────────────────
export interface PortfolioFolder {
  id: string
  name: string
  description: string
  parentId: string | null
  fundNames: string[]
  createdAt: string
}

export const PORTFOLIO_FOLDERS_MOCK: PortfolioFolder[] = [
  {
    id: "folder-equities",
    name: "Equities",
    description: "Listed equity mandates across ZSE, VFEX, and cross-border venues",
    parentId: null,
    fundNames: ["Growth Equity Fund", "Pan-African Equity Fund"],
    createdAt: "2025-01-14T09:00:00Z",
  },
  {
    id: "folder-fixed-income",
    name: "Fixed Income",
    description: "Government and corporate bond mandates",
    parentId: null,
    fundNames: ["Money Market Fund"],
    createdAt: "2025-01-14T09:05:00Z",
  },
  {
    id: "folder-fixed-income-short",
    name: "Short Duration",
    description: "Sub-12-month paper and treasury bills",
    parentId: "folder-fixed-income",
    fundNames: [],
    createdAt: "2025-02-02T11:30:00Z",
  },
  {
    id: "folder-multi-asset",
    name: "Multi-Asset",
    description: "Blended mandates spanning equities, fixed income, and cash",
    parentId: null,
    fundNames: ["Balanced Growth Fund"],
    createdAt: "2025-03-11T14:20:00Z",
  },
]

export const fetchPortfolioFolders = createAsyncThunk(
  "portfoliosMock/fetchPortfolioFolders",
  async () => {
    // TODO(backend): replace with investmentsApi.getPortfolioFolders()
    await new Promise((r) => setTimeout(r, 150))
    return PORTFOLIO_FOLDERS_MOCK
  }
)

export const createPortfolioFolder = createAsyncThunk(
  "portfoliosMock/createPortfolioFolder",
  async (input: { name: string; description: string; parentId: string | null }) => {
    // TODO(backend): replace with investmentsApi.createPortfolioFolder(input)
    const folder: PortfolioFolder = {
      id: `folder-${Date.now()}`,
      name: input.name,
      description: input.description,
      parentId: input.parentId,
      fundNames: [],
      createdAt: new Date().toISOString(),
    }
    return folder
  }
)

// ─── Setup — portfolio-level configuration ─────────────────────────────────
export interface PortfolioSettings {
  defaultBaseCurrency: string
  valuationFrequency: "DAILY" | "WEEKLY" | "MONTHLY"
  autoValuationEnabled: boolean
  priceDeviationThresholdPct: number
  requireDualApprovalAboveUsd: number
  notifyOnSettlementFailure: boolean
}

export const PORTFOLIO_SETTINGS_MOCK: PortfolioSettings = {
  defaultBaseCurrency: "USD",
  valuationFrequency: "DAILY",
  autoValuationEnabled: true,
  priceDeviationThresholdPct: 15,
  requireDualApprovalAboveUsd: 250000,
  notifyOnSettlementFailure: true,
}

export const fetchPortfolioSettings = createAsyncThunk(
  "portfoliosMock/fetchPortfolioSettings",
  async () => {
    // TODO(backend): replace with investmentsApi.getPortfolioSettings()
    await new Promise((r) => setTimeout(r, 150))
    return PORTFOLIO_SETTINGS_MOCK
  }
)

export const updatePortfolioSettings = createAsyncThunk(
  "portfoliosMock/updatePortfolioSettings",
  async (settings: PortfolioSettings) => {
    // TODO(backend): replace with investmentsApi.updatePortfolioSettings(settings)
    await new Promise((r) => setTimeout(r, 150))
    return settings
  }
)
