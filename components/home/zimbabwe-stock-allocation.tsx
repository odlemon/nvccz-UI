"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { CiShop, CiBank, CiTrophy } from "react-icons/ci"
import { useAppSelector, useAppDispatch } from "@/lib/store"
import { useEffect } from "react"
import { fetchZSEStocks } from "@/lib/store/zse-stocks-slice"
import { Skeleton } from "@/components/ui/skeleton"

export function ZimbabweStockAllocation() {
  const dispatch = useAppDispatch();
  const { stocks, loading, error } = useAppSelector((state) => state.zseStocks);

  useEffect(() => {
    if (!stocks.length && !loading && !error) {
      dispatch(fetchZSEStocks());
    }
  }, [dispatch, stocks.length, loading, error]);

  if (loading) {
    return (
      <div className="bg-white">
        <h2 className="text-sm sm:text-base text-gray-900 mb-3">Zimbabwe Stock Allocation</h2>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white">
        <h2 className="text-sm sm:text-base text-gray-900 mb-3">Zimbabwe Stock Allocation</h2>
        <div className="text-center py-4 sm:py-6 text-red-600">
          <p className="text-xs sm:text-sm">Failed to load stock data. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <h2 className="text-sm sm:text-base text-gray-900 mb-3">Zimbabwe Stock Allocation</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200 rounded-xl text-xs sm:text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-2 py-2 text-left">Symbol</th>
              <th className="px-2 py-2 text-left">Name</th>
              <th className="px-2 py-2 text-right">Price</th>
              <th className="px-2 py-2 text-right">Change</th>
              <th className="px-2 py-2 text-right">Change %</th>
              <th className="px-2 py-2 text-right">Volume</th>
              <th className="px-2 py-2 text-right">Market Cap</th>
              <th className="px-2 py-2 text-right">Currency</th>
            </tr>
          </thead>
          <tbody>
            {stocks.map((stock, idx) => {
              const isStriped = idx % 2 === 1;
              let changeColor = "text-gray-500";
              if (stock.change > 0) changeColor = "text-green-600 font-semibold";
              else if (stock.change < 0) changeColor = "text-red-600 font-semibold";

              return (
                <tr
                  key={stock.symbol + idx}
                  className={isStriped ? "bg-gray-50" : "bg-white"}
                >
                  <td className="px-2 py-2 font-medium">{stock.symbol}</td>
                  <td className="px-2 py-2">{stock.name}</td>
                  <td className="px-2 py-2 text-right">{stock.price.toFixed(4)}</td>
                  <td className={`px-2 py-2 text-right ${changeColor}`}>{stock.change.toFixed(4)}</td>
                  <td className={`px-2 py-2 text-right ${changeColor}`}>{stock.changePercent.toFixed(2)}%</td>
                  <td className="px-2 py-2 text-right">{stock.volume.toLocaleString()}</td>
                  <td className="px-2 py-2 text-right">{stock.marketCap ? stock.marketCap.toLocaleString() : '-'}</td>
                  <td className="px-2 py-2 text-right">{stock.currency}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
