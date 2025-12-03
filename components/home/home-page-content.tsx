"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Topbar } from "@/components/layout/topbar";
import { QuickActions } from "./quick-actions";
import { ExchangeRatesTicker } from "./exchange-rates-ticker";
import { GreetWidget } from "./greet-widget";
import { ZimbabweStockAllocation } from "./zimbabwe-stock-allocation";
import { ZimbabweStockExchange } from "./zimbabwe-stock-exchange";
import { TabView, type TabType } from "./tab-view";
import { FeedTab } from "./feed-tab";
import { ArticlesFeed } from "./articles-feed";
import { NewsletterTab } from "./newsletter-tab";
// import { ForumTab } from "./forum-tab";
import { EventCalendarTab } from "./event-calendar-tab";
import { DashboardTab } from "./dashboard-tab";
import { FinancialDataProvider } from "@/components/providers/financial-data-provider";

export function HomePageContent() {
  const [activeTab, setActiveTab] = useState<TabType>("feed");
  const [currentModule, setCurrentModule] = useState("homepage");
  const router = useRouter();

  const renderTabContent = () => {
    switch (activeTab) {
      case "feed":
        return <ArticlesFeed />;
      case "newsletter":
        return <NewsletterTab />;
      // case "forum":
      //   return <ForumTab />;
      case "calendar":
        return <EventCalendarTab />;
      case "dashboard":
        return <DashboardTab />;
      default:
        return <ArticlesFeed />;
    }
  };

  const handleModuleSelect = (module: string) => {
    console.log('Home page handleModuleSelect called with:', module);
    setCurrentModule(module);
    setActiveTab("feed");
    
    let targetPath = "/";
    
    switch (module) {
      case "homepage":
        targetPath = "/";
        break;
      case "portfolio-management":
        targetPath = "/portfolio";
        break;
      case "performance-management":
        targetPath = "/portfolio/analytics";
        break;
      case "applications":
        targetPath = "/applications";
        break;
      case "companies":
        targetPath = "/companies";
        break;
      case "funds":
        targetPath = "/funds";
        break;
      case "account-performance":
        targetPath = "/account";
        break;
      case "payroll":
        targetPath = "/payroll";
        break;
      default:
        targetPath = "/";
    }
    
    console.log('Home page navigating to:', targetPath);
    // router.push(targetPath);
    window.location.href = targetPath;
  };

  return (
    <FinancialDataProvider>
      <div className="min-h-screen bg-white">
        <Topbar 
          onModuleSelect={handleModuleSelect}
          currentModule={currentModule}
        />

        {/* Ticker - Full width, sticky below navigation */}
        <div className="sticky top-20 z-20 w-full">
          <ExchangeRatesTicker />
        </div>

        <div className="flex">
          <div className="w-1/4 fixed left-0 top-40 h-[calc(100vh-10rem)] bg-white border-r border-gray-200 p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <QuickActions />
            </motion.div>
          </div>

          <div className="flex-1 p-6 ml-[25%]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-6"
            >
              <div className="flex gap-6">
                <div className="flex-1">
                  <GreetWidget />
                </div>
                
                <div className="w-1/3">
                  <ZimbabweStockAllocation />
                </div>
              </div>

              {/* Market Overview */}
              <div className="w-full">
                <ZimbabweStockExchange />
              </div>

              {/* Sticky Tab Section - Sticks below ticker */}
              <div className="bg-white sticky top-40 z-10">
                <TabView activeTab={activeTab} onTabChange={setActiveTab}>
                  {renderTabContent()}
                </TabView>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </FinancialDataProvider>
  );
}