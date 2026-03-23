"use client";

import { useMemo } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import type { Options } from "highcharts";
import type { OperationType } from "@/shared/gql/__generated__/schema-types";
import { dateStringToUtcTimestamp } from "@/shared/utils/date";

type Operation = {
  id: string;
  type: OperationType;
  amount: number;
  operationDate: string;
  createdAt: string;
};

type GoalChartProps = {
  operations: Operation[];
  color: string;
  height?: number;
  range: "all" | "7d" | "1m" | "6m" | "12m";
};

const DAY_MS = 24 * 60 * 60 * 1000;

export const GoalChart = ({ operations, color, height = 320, range }: GoalChartProps) => {
  const seriesData = useMemo<Array<[number, number]>>(() => {
    let total = 0;
    const sortedOperations = [...operations]
      .sort((a, b) => {
        const dateComparison = a.operationDate.localeCompare(b.operationDate);
        return dateComparison !== 0 ? dateComparison : a.createdAt.localeCompare(b.createdAt);
      });

    const allData = sortedOperations
      .map((operation): [number, number] => {
        total += operation.type === "INCREASE" ? operation.amount : -operation.amount;
        return [dateStringToUtcTimestamp(operation.operationDate), Number(total.toFixed(2))];
      });

    if (range === "all" || !allData.length) {
      return allData;
    }

    const lastTimestamp = allData[allData.length - 1][0];
    const rangeStart = (() => {
      switch (range) {
        case "7d":
          return lastTimestamp - 7 * DAY_MS;
        case "1m":
          return lastTimestamp - 30 * DAY_MS;
        case "6m":
          return lastTimestamp - 183 * DAY_MS;
        case "12m":
          return lastTimestamp - 365 * DAY_MS;
        default:
          return 0;
      }
    })();

    const firstVisibleIndex = allData.findIndex(([timestamp]) => timestamp >= rangeStart);
    if (firstVisibleIndex <= 0) {
      return allData;
    }

    return [allData[firstVisibleIndex - 1], ...allData.slice(firstVisibleIndex)];
  }, [operations, range]);

  const options = useMemo<Options>(
    () => ({
      title: { text: "Progress over time" },
      xAxis: { type: "datetime" },
      yAxis: { title: { text: "Current amount" } },
      series: [
        {
          type: "line",
          name: "Amount",
          data: seriesData,
          color,
        },
      ],
      credits: { enabled: false },
      chart: { height },
    }),
    [color, height, seriesData]
  );

  return <HighchartsReact highcharts={Highcharts} options={options} />;
};
