"use client"

import { useEffect, useRef, memo } from 'react'
import { Card } from "@/components/ui/card"

function TradingViewSymbolOverview() {
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!containerRef.current) return

        const script = document.createElement("script")
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js"
        script.type = "text/javascript"
        script.async = true
        script.innerHTML = JSON.stringify({
            lineWidth: 2,
            lineType: 0,
            chartType: "area",
            fontColor: "rgb(106, 109, 120)",
            gridLineColor: "rgba(46, 46, 46, 0.06)",
            volumeUpColor: "rgba(34, 171, 148, 0.5)",
            volumeDownColor: "rgba(247, 82, 95, 0.5)",
            backgroundColor: "#ffffff",
            widgetFontColor: "#0F0F0F",
            upColor: "#22ab94",
            downColor: "#f7525f",
            borderUpColor: "#22ab94",
            borderDownColor: "#f7525f",
            wickUpColor: "#22ab94",
            wickDownColor: "#f7525f",
            colorTheme: "light",
            isTransparent: false,
            locale: "en",
            chartOnly: false,
            scalePosition: "right",
            scaleMode: "Normal",
            fontFamily: "-apple-system, BlinkMacSystemFont, Trebuchet MS, Roboto, Ubuntu, sans-serif",
            valuesTracking: "1",
            changeMode: "price-and-percent",
            symbols: [
                ["Apple", "NASDAQ:AAPL|1D"],
                ["Google", "NASDAQ:GOOGL|1D"],
                ["Microsoft", "NASDAQ:MSFT|1D"],
                ["Tesla", "NASDAQ:TSLA|1D"],
                ["Amazon", "NASDAQ:AMZN|1D"]
            ],
            dateRanges: [
                "1d|1",
                "1m|30",
                "3m|60",
                "12m|1D",
                "60m|1W",
                "all|1M"
            ],
            fontSize: "10",
            headerFontSize: "medium",
            autosize: true,
            width: "100%",
            height: "300",
            noTimeScale: false,
            hideDateRanges: false,
            hideMarketStatus: false,
            hideSymbolLogo: false
        })

        containerRef.current.appendChild(script)

        return () => {
            if (containerRef.current) {
                containerRef.current.innerHTML = ''
            }
        }
    }, [])

    return (
        <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white">
            <div
                className="tradingview-widget-container w-full"
                style={{ height: '400px' }}
                ref={containerRef}
            >
                <div className="tradingview-widget-container__widget h-full"></div>
            </div>

        </div>
    )
}

export default memo(TradingViewSymbolOverview)
