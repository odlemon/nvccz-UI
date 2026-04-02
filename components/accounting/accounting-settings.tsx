"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DollarSign,
  TrendingUp,
  Calculator,
  Tag,
  Landmark
} from "lucide-react"
import { ExchangeRatesManagement } from "./exchange-rates-management"
import { cn } from "@/lib/utils"
import { CurrenciesManagement } from "./currencies-management"
import { ChartOfAccountsManagement } from "./chart-of-accounts-management"
import { ExpenseCategoriesManagement } from "./expense-categories-management"
import { BankAccountsManagement } from "./bank-accounts-management"
import { AccountingSettingsSkeleton } from "./accounting-settings-skeleton"

const tabs = [
  {
    id: "currencies",
    label: "Currencies",
    icon: DollarSign,
    description: "Manage system currencies",
    gradient: "from-blue-400 to-blue-600"
  },
  {
    id: "exchange-rates",
    label: "Exchange Rates", 
    icon: TrendingUp,
    description: "Configure exchange rates",
    gradient: "from-green-400 to-green-600"
  },
  {
    id: "chart-of-accounts",
    label: "Chart of Accounts",
    icon: Calculator,
    description: "Manage account structure",
    gradient: "from-purple-400 to-purple-600"
  },
  {
    id: "expense-categories",
    label: "Expense Categories",
    icon: Tag,
    description: "Configure expense categories",
    gradient: "from-yellow-400 to-yellow-600"
  },
  {
    id: "bank-accounts",
    label: "Bank Accounts",
    icon: Landmark,
    description: "Manage bank accounts",
    gradient: "from-teal-400 to-teal-600"
  }
]

export function AccountingSettings() {
  const [activeTab, setActiveTab] = useState("currencies")
  const [loading, setLoading] = useState(false)

  const renderTabContent = () => {
    if (loading) {
      return <AccountingSettingsSkeleton />
    }

    switch (activeTab) {
      case "currencies":
        return <CurrenciesManagement />
      case "exchange-rates":
        return <ExchangeRatesManagement />
      case "chart-of-accounts":
        return <ChartOfAccountsManagement />
      case "expense-categories":
        return <ExpenseCategoriesManagement />
      case "bank-accounts":
        return <BankAccountsManagement />
      default:
        return <CurrenciesManagement />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-normal">Accounting Settings</h1>
          <p className="text-muted-foreground">Configure your accounting system preferences</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div>
        <CardHeader className="pb-0">
          <div className="flex items-center overflow-x-auto border-b ">


            <div className="flex space-x-1 min-w-max ">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-t-lg border-b-2 transition-all duration-200",
                      isActive
                        ? "text-blue-600 border-blue-600"
                        : "text-gray-600 border-transparent hover:text-gray-900 hover:border-gray-300"
                    )}
                  >
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center bg-gradient-to-br transition-all duration-200",
                      isActive ? tab.gradient : "from-gray-300 to-gray-400"
                    )}>
                      <Icon className="w-3 h-3 text-white" />
                    </div>
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-6">
          {/* Active tab description */}
         
          {/* Tab content */}
          {renderTabContent()}
        </CardContent>
      </div>
    </div>
  )
}