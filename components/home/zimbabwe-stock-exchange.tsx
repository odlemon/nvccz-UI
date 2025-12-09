"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HiTrendingUp, HiTrendingDown, HiChartBar } from "react-icons/hi";
import { useAppSelector, useAppDispatch } from "@/lib/store";
import { fetchMarketOverview } from "@/lib/store/market-overview-slice";
import { Skeleton } from "@/components/ui/skeleton";

export function ZimbabweStockExchange() {
  const dispatch = useAppDispatch();
  const { data: stocks, loading, error } = useAppSelector((state) => state.marketOverview);
  const [selectedStock, setSelectedStock] = useState<any>(null);

  useEffect(() => {
    if (!stocks.length && !loading && !error) {
      dispatch(fetchMarketOverview());
    }
  }, [dispatch, stocks.length, loading, error]);

  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`;
  };

  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}`;
  };

  const getChangeColor = (change: number) => {
    return change >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getGradientColor = (change: number) => {
    return change >= 0 ? "from-green-500 to-emerald-600" : "from-red-500 to-orange-600";
  };

  const getChangeIcon = (change: number) => {
    return change >= 0 ? HiTrendingUp : HiTrendingDown;
  };

  if (loading) {
    return (
      <div className="bg-white">
        <h2 className="text-lg text-gray-900 mb-4">Market Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="bg-gradient-to-r from-gray-300 to-gray-400 rounded-2xl p-3 shadow-lg">
              <div className="space-y-3">
                <Skeleton className="h-5 w-20 bg-white/20" />
                <Skeleton className="h-6 w-24 bg-white/20" />
                <Skeleton className="h-4 w-16 bg-white/20" />
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stocks.map((stock, index) => {
          const Icon = getChangeIcon(stock.day_change);

          return (
            <motion.div
              key={stock.ticker}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`group bg-gradient-to-r ${getGradientColor(stock.day_change)} hover:opacity-90 rounded-2xl p-3 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl`}
              onClick={() => setSelectedStock(stock)}
            >
              <div className="flex flex-col h-full">
                {/* Header with Change */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg text-white drop-shadow-sm font-bold">
                        {stock.ticker}
                      </h3>
                      <p className="text-xs text-white/80 drop-shadow-sm">
                        {stock.name}
                      </p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1 text-white drop-shadow-sm`}>
                    <Icon className="w-3 h-3" />
                    <span className="text-sm font-semibold">
                      {formatChange(stock.day_change)}
                    </span>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-2">
                  <div className="text-2xl font-bold text-white drop-shadow-sm">
                    {formatPrice(stock.price)}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Dialog for Stock Details */}
      <Dialog open={!!selectedStock} onOpenChange={() => setSelectedStock(null)}>
        <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">
              {selectedStock?.name} ({selectedStock?.ticker})
            </DialogTitle>
          </DialogHeader>

          {selectedStock && (
            <div className="space-y-4">
              {/* Main Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center col-span-1">
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {formatPrice(selectedStock.price)}
                  </div>
                  <div className={`flex items-center justify-center gap-2 ${getChangeColor(selectedStock.day_change)}`}>
                    {React.createElement(getChangeIcon(selectedStock.day_change), { className: "w-5 h-5" })}
                    <span className="text-xl font-semibold">
                      {formatChange(selectedStock.day_change)}
                    </span>
                  </div>
                </div>
                <div className="space-y-2 col-span-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Previous Close:</span>
                      <span className="font-medium">{formatPrice(selectedStock.previous_close_price)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Volume:</span>
                      <span className="font-medium">{selectedStock.volume.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Currency:</span>
                      <span className="font-medium">{selectedStock.currency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Exchange:</span>
                      <span className="font-medium">{selectedStock.mic_code}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Day Stats */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="text-lg font-semibold mb-4 text-center">Today's Trading Session</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                    <p className="text-sm text-gray-600 mb-1">Open</p>
                    <p className="text-lg font-bold text-gray-900">{formatPrice(selectedStock.day_open)}</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg shadow-sm border border-green-200">
                    <p className="text-sm text-green-700 mb-1">Day High</p>
                    <p className="text-lg font-bold text-green-600">{formatPrice(selectedStock.day_high)}</p>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg shadow-sm border border-red-200">
                    <p className="text-sm text-red-700 mb-1">Day Low</p>
                    <p className="text-lg font-bold text-red-600">{formatPrice(selectedStock.day_low)}</p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg shadow-sm border border-blue-200">
                    <p className="text-sm text-blue-700 mb-1">Current</p>
                    <p className="text-lg font-bold text-blue-600">{formatPrice(selectedStock.price)}</p>
                  </div>
                </div>
              </div>

              {/* Additional Details */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="text-lg font-semibold mb-3 text-center">Additional Information</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-white p-3 rounded-lg shadow-sm text-center">
                    <p className="text-sm text-gray-600 mb-1">Market Cap</p>
                    <p className="text-base font-bold">{selectedStock.market_cap ? `$${selectedStock.market_cap.toLocaleString()}` : 'N/A'}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg shadow-sm text-center">
                    <p className="text-sm text-gray-600 mb-1">52W High</p>
                    <p className="text-base font-bold">{selectedStock['52_week_high'] ? `$${selectedStock['52_week_high']}` : 'N/A'}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg shadow-sm text-center">
                    <p className="text-sm text-gray-600 mb-1">52W Low</p>
                    <p className="text-base font-bold">{selectedStock['52_week_low'] ? `$${selectedStock['52_week_low']}` : 'N/A'}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg shadow-sm text-center">
                    <p className="text-sm text-gray-600 mb-1">Extended Hours</p>
                    <p className="text-base font-bold">{selectedStock.is_extended_hours_price ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              </div>

              {/* Last Trade Time */}
              <div className="text-center text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                <p className="font-medium">Last Trade Time</p>
                <p>{new Date(selectedStock.last_trade_time).toLocaleString()}</p>
                <p className="text-xs mt-1">Previous Close: {new Date(selectedStock.previous_close_price_time).toLocaleString()}</p>
              </div>

              <div className="flex justify-center pt-2">
                <Button
                  onClick={() => setSelectedStock(null)}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-2 text-base font-semibold rounded-xl"
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
