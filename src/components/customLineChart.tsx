import React, { useEffect, useState, useRef } from "react";
import { LineData, createChart, IChartApi, Time, AreaSeries, CrosshairMode} from "lightweight-charts";
import './customLineChart.css'

interface WalletLineChartProps {
  publicKey: string;
  apiKey: string;
  solPrice: boolean
}

type TimeRange = "1W" | "1M" | "3M"; 

const WalletLineChart: React.FC<WalletLineChartProps> = ({ publicKey, apiKey, solPrice }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [data, setData] = useState<LineData[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>("1M");
  const [error, setError] = useState<string | null>(null);

  const chartHeight = solPrice ? 150 : 300;

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const fetchWithRetry = async (url: string, retries: number = 3, delay: number = 1000): Promise<Response> => {
    for (let i = 0; i < retries; i++) {
      await sleep(delay * i);
      const response = await fetch(url);
      if (response.status === 429) {
        if (i === retries - 1) throw new Error("Max retries reached for 429 error");
        continue;
      }
      return response;
    }
    throw new Error("Failed to fetch after retries");
  };

  // historical SOL prices from CoinGecko
  const fetchSolPrices = async (from: number, to: number): Promise<{ [date: string]: number }> => {
    try {
      const response = await fetchWithRetry(
        `https://api.coingecko.com/api/v3/coins/solana/market_chart/range?vs_currency=usd&from=${from}&to=${to}`
      );
      if (!response.ok) throw new Error(`Failed to fetch SOL prices: ${response.status}`);
      const data = await response.json();
      const priceMap: { [date: string]: number } = {};
      data.prices.forEach(([timestamp, price]: [number, number]) => {
        const date = new Date(timestamp).toISOString().split("T")[0];
        priceMap[date] = price;
      });
      console.log("Fetched SOL Prices:", priceMap);
      return priceMap;
    } catch (error) {
      console.error("Error fetching SOL prices:", error);
      return {};
    }
  };

  const createDateRange = (startDate: Date, endDate: Date) => {
    const dates: string[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      dates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null);
        const endDate = new Date();
        let startDate = new Date();
        switch (timeRange) {
          case "1W": startDate.setDate(endDate.getDate() - 7); break;
          case "1M": startDate.setMonth(endDate.getMonth() - 1); break;
          case "3M": startDate.setMonth(endDate.getMonth() - 3); break;
        }

        // SOL prices for the date range
        const fromTimestamp = Math.floor(startDate.getTime() / 1000);
        const toTimestamp = Math.floor(endDate.getTime() / 1000);
        const solPrices = await fetchSolPrices(fromTimestamp, toTimestamp);

        let allTransactions: any[] = [];
        let beforeSignature: string | undefined;
        while (true) {
          const url = beforeSignature
            ? `https://api-devnet.helius.xyz/v0/addresses/${publicKey}/transactions?api-key=${apiKey}&before=${beforeSignature}`
            : `https://api-devnet.helius.xyz/v0/addresses/${publicKey}/transactions?api-key=${apiKey}`;
          const response = await fetchWithRetry(url);
          if (!response.ok) throw new Error(`Failed to fetch transactions: ${response.status}`);
          const transactions: any[] = await response.json();
          if (!transactions.length) break;

          allTransactions.push(...transactions);
          const lastTx = transactions[transactions.length - 1];
          if (lastTx.timestamp * 1000 < startDate.getTime()) break;
          beforeSignature = lastTx.signature;
        }

        const filteredTransactions = allTransactions.filter((tx: any) => {
          const txTimestamp = tx.timestamp * 1000;
          return txTimestamp >= startDate.getTime() && txTimestamp <= endDate.getTime();
        });

        if (!filteredTransactions.length) {
          setError("No transactions found for the selected time range on devnet.");
          setData([]);
          return;
        }

        filteredTransactions.sort((a: any, b: any) => a.timestamp - b.timestamp);

        let solBalance = 0;
        const tokenBalances: { [mint: string]: number } = {};
        const dailyBalances: { [date: string]: { sol: number; tokens: { [mint: string]: number } } } = {};

        for (const tx of filteredTransactions) {
          const date = new Date(tx.timestamp * 1000).toISOString().split("T")[0];
          if (!dailyBalances[date]) dailyBalances[date] = { sol: solBalance, tokens: { ...tokenBalances } };

          const accountChange = tx.accountData?.find((data: any) => data.account === publicKey);
          if (accountChange) {
            solBalance += accountChange.nativeBalanceChange;
            dailyBalances[date].sol = solBalance;
          }

          if (tx.tokenTransfers?.length) {
            for (const transfer of tx.tokenTransfers) {
              const { fromUserAccount, toUserAccount, tokenAmount, mint } = transfer;
              if (!tokenBalances[mint]) tokenBalances[mint] = 0;
              if (toUserAccount === publicKey) tokenBalances[mint] += parseFloat(tokenAmount);
              else if (fromUserAccount === publicKey) tokenBalances[mint] -= parseFloat(tokenAmount);
              dailyBalances[date].tokens = { ...tokenBalances };
            }
          }
        }

        const allDates = createDateRange(startDate, endDate);

        // Fill in missing dates with the previous day balance
        const completeBalances: { [date: string]: { sol: number; tokens: { [mint: string]: number } } } = {};
        let lastBalance = { sol: 0, tokens: {} };

        for (const date of allDates) {
          if (dailyBalances[date]) {
            lastBalance = dailyBalances[date];
            completeBalances[date] = lastBalance;
          } else {
            completeBalances[date] = { ...lastBalance, tokens: { ...lastBalance.tokens } };
          }
        }

        const balanceData: LineData[] = Object.entries(completeBalances).map(([date, balance]) => {
          const solPriceUsd = solPrices[date] || 1; // Fallback to $1 if price not available
          const solBalanceInSol = balance.sol / 1_000_000_000;
          
          if (solPrice) {
            return { time: date as Time, value: solPriceUsd };
          } else {
            const solValueUsd = solBalanceInSol * solPriceUsd;
            const tokenValueUsd = Object.values(balance.tokens).reduce((sum, amount) => sum + (amount > 0 ? amount : 0) * 1, 0); // $1 per token
            const totalValueUsd = solValueUsd + tokenValueUsd;
            console.log(`Date: ${date}, SOL Price: ${solPriceUsd}, SOL Balance: ${solBalanceInSol}, SOL Value: ${solValueUsd}, Token Value: ${tokenValueUsd}, Total: ${totalValueUsd}`);
            return { time: date as Time, value: totalValueUsd };
          }
        });

        if (!balanceData.length) {
          setData([]);
          return;
        }
        setData(balanceData);
      } catch (error) {
        setError("Failed to load wallet data.");
        console.log("Error:", error);
        setData([]);
      }
    };
    fetchData();
  }, [publicKey, apiKey, timeRange, solPrice]);

  useEffect(() => {
    if (chartContainerRef.current && data.length) {

      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
      
      chartRef.current = createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        height: chartHeight, 
        layout: { background: { color: "transparent" }, textColor: "#FFFFFF", attributionLogo: false },
        grid: { vertLines: { visible: false }, horzLines: { visible: false } },
        handleScroll: false,
        handleScale: false,
        rightPriceScale: solPrice
        ? { visible: false, autoScale: false }
        : { visible: true },
        timeScale: solPrice
        ? { visible: false, timeVisible: true, secondsVisible: false }
        : { visible: true, timeVisible: true, secondsVisible: false },
        crosshair: {
          mode: CrosshairMode.Magnet, // Enable crosshair for tooltip but we'll hide the lines
          vertLine: { visible: false }, // Hide vertical crosshair line
          horzLine: { visible: false }, // Hide horizontal crosshair line
        },
      });

      const lineSeries = chartRef.current.addSeries(AreaSeries, {
        topColor: "rgba(107, 119, 255, 0.5)",
        bottomColor: "rgba(107, 119, 255, 0.0)",
        lineColor:  "#6B77FF",
        lineWidth: 2,
      });
      lineSeries.setData(data);

      const timeScale = chartRef.current.timeScale();
      const totalPoints = data.length;
      if (totalPoints > 0) {
        let visiblePoints: number;
        switch (timeRange) {
          case "1W": visiblePoints = Math.min(totalPoints, 7); break;
          case "1M": visiblePoints = Math.min(totalPoints, 30); break;
          case "3M": visiblePoints = Math.min(totalPoints, 90); break;
          default: visiblePoints = totalPoints;
        }
        const fromIndex = Math.max(0, totalPoints - visiblePoints);
        const toIndex = totalPoints - 1;
        timeScale.setVisibleLogicalRange({ from: fromIndex, to: toIndex });
      }

      const handleResize = () => {
        if (chartRef.current && chartContainerRef.current) {
          chartRef.current.resize(chartContainerRef.current.clientWidth, chartHeight);
        }
      };
      window.addEventListener("resize", handleResize);

      return () => {
        if (chartRef.current) {
          chartRef.current.remove();
          chartRef.current = null;
        }
        window.removeEventListener("resize", handleResize);
      };
    }
  }, [data, timeRange, solPrice, chartHeight]);

  return (
    <div>
      <div ref={chartContainerRef}/>
      <div style={{marginTop: "20px"}}>
        <button
          onClick={() => setTimeRange("1W")}
          style={{background: timeRange === "1W" ? "#6B77FF" : "#2E2E2E" }}
        >
          1 Week
        </button>
        <button
          onClick={() => setTimeRange("1M")}
          style={{background: timeRange === "1M" ? "#6B77FF" : "#2E2E2E" }}
        >
          1 Month
        </button>
        <button
          onClick={() => setTimeRange("3M")}
          style={{background: timeRange === "3M" ? "#6B77FF" : "#2E2E2E"}}
        >
          3 Months
        </button>
      </div>
    </div>
  );
};

export default WalletLineChart;