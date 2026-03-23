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
};

export const GoalChart = ({ operations }: GoalChartProps) => {
  const seriesData = useMemo<Array<[number, number]>>(() => {
    let total = 0;
    return [...operations]
      .sort((a, b) => {
        const dateComparison = a.operationDate.localeCompare(b.operationDate);
        return dateComparison !== 0 ? dateComparison : a.createdAt.localeCompare(b.createdAt);
      })
      .map((operation) => {
        total += operation.type === "INCREASE" ? operation.amount : -operation.amount;
        return [dateStringToUtcTimestamp(operation.operationDate), Number(total.toFixed(2))];
      });
  }, [operations]);

  const options = useMemo<Options>(
    () => ({
      title: { text: "Progress over time" },
      xAxis: { type: "datetime" },
      yAxis: { title: { text: "Current Amount ($)" } },
      series: [{ type: "line", name: "Amount", data: seriesData }],
      credits: { enabled: false },
      chart: { height: 320 },
    }),
    [seriesData]
  );

  return <HighchartsReact highcharts={Highcharts} options={options} />;
};
