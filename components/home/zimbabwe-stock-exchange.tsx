"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CiBank, CiGlobe } from "react-icons/ci";
import { HiTrendingUp, HiTrendingDown, HiGlobe, HiChevronDown } from "react-icons/hi";
import { useAppSelector } from "@/lib/store";
import { Skeleton } from "@/components/ui/skeleton";

interface MarketData {
  id: string;
  name: string;
  icon: any;
  color: string;
  summary: {
    index: string;
    change: string;
    value: string;
  };
  details: {
    title: string;
    data: Array<{
      name: string;
      change: string;
      value: string;
    }>;
  };
}

// Market data will be dynamically generated from API data

export function ZimbabweStockExchange() {
  const [selectedMarket, setSelectedMarket] = useState<MarketData | null>(null);
  
  const marketIndices = useAppSelector((state) => state.financialData.marketIndices);
  const topGainers = useAppSelector((state) => state.financialData.topGainers);
  const topLosers = useAppSelector((state) => state.financialData.topLosers);
  const africanIndices = useAppSelector((state) => state.financialData.africanIndices);
  const worldIndices = useAppSelector((state) => state.financialData.worldIndices);

  const loading = marketIndices.loading || topGainers.loading || topLosers.loading || 
                  africanIndices.loading || worldIndices.loading;
  const error = marketIndices.error || topGainers.error || topLosers.error || 
                africanIndices.error || worldIndices.error;

  // Data is now provided by FinancialDataProvider
  // No need for individual API calls here

  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  };

  const formatValue = (value: number, currency: string) => {
    return `${value.toLocaleString()} ${currency}`;
  };

  // Helper function to get gradient color based on change
  const getGradientColor = (change: string) => {
    if (!change) return "from-gray-500 to-gray-600";
    const changeValue = parseFloat(change.replace('%', '').replace('+', ''));
    if (changeValue > 0) return "from-green-500 to-emerald-600";
    if (changeValue < 0) return "from-red-500 to-orange-600";
    return "from-gray-500 to-gray-600";
  };

  // Helper function to get change icon
  const getChangeIcon = (change: string) => {
    if (!change) return HiTrendingUp;
    const changeValue = parseFloat(change.replace('%', '').replace('+', ''));
    return changeValue >= 0 ? HiTrendingUp : HiTrendingDown;
  };

  const marketData: MarketData[] = [
    {
      id: "zse",
      name: "ZSE",
      icon: HiTrendingUp,
      color: getGradientColor(marketIndices.data?.market_indices?.[0]?.change?.toString() || "0"),
      summary: {
        index: marketIndices.data?.market_indices?.[0]?.index || "All Share",
        change: formatChange(marketIndices.data?.market_indices?.[0]?.change || 0),
        value: formatValue(marketIndices.data?.market_indices?.[0]?.value || 0, marketIndices.data?.market_indices?.[0]?.currency || "ZWG")
      },
      details: {
        title: "Zimbabwe Stock Exchange",
        data: [
          ...(topGainers.data?.top_gainers?.slice(0, 3).map(item => ({
            name: item.symbol,
            change: formatChange(item.change),
            value: formatValue(item.value, item.currency)
          })) || []),
          ...(topLosers.data?.top_losers?.slice(0, 3).map(item => ({
            name: item.symbol,
            change: formatChange(item.change),
            value: formatValue(item.value, item.currency)
          })) || [])
        ]
      }
    },
    {
      id: "rbz",
      name: "RBZ",
      icon: CiBank,
      color: "from-blue-500 to-cyan-600",
      summary: {
        index: "Lending Rate",
        change: "14.5%",
        value: "Current"
      },
      details: {
        title: "Reserve Bank of Zimbabwe",
        data: [
          { name: "Lending Rate", change: "14.5%", value: "Current" },
          { name: "Deposit Rate", change: "8.2%", value: "Current" },
          { name: "Inflation", change: "12.3%", value: "YoY" }
        ]
      }
    },
    {
      id: "african",
      name: "African Markets",
      icon: getChangeIcon(africanIndices.data?.indices?.[0]?.['change %'] || "0%"),
      color: getGradientColor(africanIndices.data?.indices?.[0]?.['change %'] || "0%"),
      summary: {
        index: africanIndices.data?.indices?.[0]?.symbol || "JSE",
        change: africanIndices.data?.indices?.[0]?.['change %'] || "+1.2%",
        value: africanIndices.data?.indices?.[0]?.price || "ZAR 78,450"
      },
      details: {
        title: "African Markets",
        data: africanIndices.data?.indices?.slice(0, 6).map(item => ({
          name: item.symbol || 'N/A',
          change: item['change %'] || '0%',
          value: item.price || 'N/A'
        })) || []
      }
    },
    {
      id: "global",
      name: "Global Markets",
      icon: getChangeIcon(worldIndices.data?.indices?.[0]?.['change %'] || "0%"),
      color: getGradientColor(worldIndices.data?.indices?.[0]?.['change %'] || "0%"),
      summary: {
        index: worldIndices.data?.indices?.[0]?.symbol || "S&P 500",
        change: worldIndices.data?.indices?.[0]?.['change %'] || "+0.8%",
        value: worldIndices.data?.indices?.[0]?.price || "4,567"
      },
      details: {
        title: "Global Markets",
        data: worldIndices.data?.indices?.slice(0, 6).map(item => ({
          name: item.symbol || 'N/A',
          change: item['change %'] || '0%',
          value: item.price || 'N/A'
        })) || []
      }
    }
  ];

  const getChangeColor = (change: string | undefined) => {
    if (!change) return 'text-gray-600';
    return change.startsWith('+') ? 'text-green-600' : 'text-red-600';
  };

  if (loading) {
    return (
      <div className="bg-white">
        <h2 className="text-lg text-gray-900 mb-4">Market Overview</h2>
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="bg-gradient-to-r from-gray-300 to-gray-400 rounded-2xl p-4 shadow-lg">
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-3 pr-10 mb-4">
                  <Skeleton className="w-10 h-10 rounded-full bg-white/20" />
                  <Skeleton className="h-6 w-20 bg-white/20" />
                </div>
                <div className="flex-1"></div>
                <div className="flex items-center justify-end gap-3">
                  <Skeleton className="h-8 w-16 bg-white/20" />
                  <Skeleton className="h-6 w-20 bg-white/20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white">
        <h2 className="text-lg text-gray-900 mb-4">Market Overview</h2>
        <div className="text-center py-8 text-red-600">
          <p>Failed to load market data. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <h2 className="text-lg text-gray-900 mb-4">Market Overview</h2>
      <div className="grid grid-cols-4 gap-3">
        {marketData.map((market, index) => {
          const Icon = market.icon;

          return (
            <motion.div
              key={market.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`group bg-gradient-to-r ${market.color} hover:opacity-90 rounded-2xl p-4 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl`}
              onClick={() => setSelectedMarket(market)}
            >
              <div className="flex flex-col h-full relative">
                {/* Top right dropdown button */}
                <div className="absolute top-0 right-0">
                  <button 
                    className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all duration-200 hover:scale-110"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMarket(market);
                    }}
                  >
                    <HiChevronDown className="w-4 h-4 text-white transition-transform duration-200 hover:rotate-180" />
                  </button>
                </div>

                {/* Header with Title */}
                <div className="flex items-center gap-3 pr-10">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl text-white drop-shadow-sm">
                    {market.name}
                  </h3>
                </div>
                
                {/* Spacer to push percentage/value to bottom */}
                <div className="flex-1"></div>
                
                {/* Percentage and Value in bottom right */}
                <div className="flex items-center justify-end gap-3 text-white drop-shadow-sm">
                  <span className="text-2xl text-white drop-shadow-sm">
                    {market.summary.change}
                  </span>
                  <span className="text-lg text-white/80 drop-shadow-sm">
                    {market.summary.value}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Dialog for Market Details */}
      <Dialog open={!!selectedMarket} onOpenChange={() => setSelectedMarket(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">
              {selectedMarket?.details.title}
            </DialogTitle>
          </DialogHeader>
          
          {selectedMarket && (
            <div className="space-y-6">
              {/* Sort and rank the data by change value */}
              {(() => {
                const sortedData = [...selectedMarket.details.data].sort((a, b) => {
                  const aValue = parseFloat(a.change.replace('%', '').replace('+', ''));
                  const bValue = parseFloat(b.change.replace('%', '').replace('+', ''));
                  return bValue - aValue; // Sort descending
                });

                return (
                  <div className="grid gap-4">
                    {sortedData.map((item, index) => {
                      const changeValue = parseFloat(item.change.replace('%', '').replace('+', ''));
                      const isPositive = changeValue >= 0;
                      const rank = index + 1;
                      
                      return (
                        <motion.div
                          key={`${item.name}-${index}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`relative p-6 rounded-2xl border-2 transition-all duration-300 hover:shadow-lg ${
                            isPositive 
                              ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 hover:border-green-300' 
                              : 'bg-gradient-to-r from-red-50 to-orange-50 border-red-200 hover:border-red-300'
                          }`}
                        >
                          {/* Rank Badge */}
                          <div className={`absolute -top-3 -left-3 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                            rank === 1 ? 'bg-yellow-500' : 
                            rank === 2 ? 'bg-gray-400' : 
                            rank === 3 ? 'bg-orange-500' : 
                            'bg-gray-300'
                          }`}>
                            {rank}
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              {/* Arrow Icon */}
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                isPositive 
                                  ? 'bg-green-100 text-green-600' 
                                  : 'bg-red-100 text-red-600'
                              }`}>
                                {isPositive ? (
                                  <HiTrendingUp className="w-6 h-6" />
                                ) : (
                                  <HiTrendingDown className="w-6 h-6" />
                                )}
                              </div>

                              {/* Stock/Index Name */}
                              <div>
                                <h4 className="text-xl font-bold text-gray-900">{item.name}</h4>
                                <p className="text-sm text-gray-600">Current Value</p>
                              </div>
                            </div>

                            {/* Values */}
                            <div className="text-right">
                              <div className={`text-2xl font-bold ${
                                isPositive ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {item.change}
                              </div>
                              <div className="text-lg font-medium text-gray-700">
                                {item.value}
                              </div>
                            </div>
                          </div>

                          {/* Performance Bar */}
                          <div className="mt-4">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all duration-1000 ${
                                  isPositive 
                                    ? 'bg-gradient-to-r from-green-400 to-green-600' 
                                    : 'bg-gradient-to-r from-red-400 to-red-600'
                                }`}
                                style={{ 
                                  width: `${Math.min(Math.abs(changeValue) * 10, 100)}%` 
                                }}
                              ></div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                );
              })()}
              
              <div className="flex justify-center pt-6">
                <Button 
                  onClick={() => setSelectedMarket(null)}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 text-lg font-semibold rounded-xl"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
