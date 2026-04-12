"use client"

import { useState, useEffect } from "react"
import { useDispatch } from "react-redux"
import type { AppDispatch } from "@/lib/store/store"
import { fetchSTISettings, fetchSTIInstruments, fetchSTIDashboard } from "@/lib/store/slices/shortTermInvestmentsSlice"
import { fetchCurrencies, fetchChartOfAccounts } from "@/lib/store/slices/accountingSlice"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  List,
  Settings,
  Plus,
} from "lucide-react"
import { toast } from "sonner"
import { STIDashboard } from "./sti-dashboard"
import { STIInstrumentsList } from "./sti-instruments-list"
import { STISettingsPanel } from "./sti-settings"
import { CreateInstrumentModal } from "./create-instrument-modal"

type Tab = "dashboard" | "instruments" | "settings"

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "instruments", label: "Instruments", icon: List },
  { id: "settings", label: "Settings", icon: Settings },
]

export function ShortTermInvestmentsManagement() {
  const dispatch = useDispatch<AppDispatch>()
  const [activeTab, setActiveTab] = useState<Tab>("dashboard")
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  useEffect(() => {
    dispatch(fetchSTISettings())
    dispatch(fetchSTIInstruments())
    dispatch(fetchSTIDashboard({}))
    dispatch(fetchCurrencies())
    dispatch(fetchChartOfAccounts({ isActive: true }))
  }, [dispatch])

  const handleInstrumentCreated = () => {
    setIsCreateOpen(false)
    dispatch(fetchSTIInstruments())
    dispatch(fetchSTIDashboard({}))
  }

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Short-Term Investments</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage and track short-term liquid investment instruments
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              className="h-10 px-5 rounded-full gap-2 bg-[#4f77ff] hover:bg-[#4f77ff]/90 font-semibold text-xs shadow-md"
              onClick={() => setIsCreateOpen(true)}
            >
              <Plus className="w-4 h-4" />
              New Instrument
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-white rounded-full p-1 border border-gray-200 w-fit">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <Button
                key={tab.id}
                variant="ghost"
                size="sm"
                className={`rounded-full h-9 px-5 text-xs font-semibold gap-2 ${
                  activeTab === tab.id
                    ? "bg-[#1a3a4a] text-white hover:bg-[#1a3a4a]/90"
                    : "text-muted-foreground hover:bg-gray-50"
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </Button>
            )
          })}
        </div>

        {/* Tab Content */}
        {activeTab === "dashboard" && <STIDashboard />}
        {activeTab === "instruments" && (
          <STIInstrumentsList onCreateNew={() => setIsCreateOpen(true)} />
        )}
        {activeTab === "settings" && <STISettingsPanel />}

        {/* Create Modal */}
        <CreateInstrumentModal
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          onCreated={handleInstrumentCreated}
        />
      </div>
    </div>
  )
}
