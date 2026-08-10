import { createElement } from "react";
import CategoryChart from "./category_chart/CategoryChart";
import VoucherChart from "./voucher_chart/VoucherChart";
import "./Revenue";

const charts = [
  { id: "revenue-category", component: CategoryChart },
  { id: "voucher-structure", component: VoucherChart },
];

const Revenue = () => {
  return (
    <div className="revenueTabContent">
      <div className="revenueChartsGrid">
        {charts.map(({ id, component: ChartComponent }) => (
          createElement(ChartComponent, { key: id })
        ))}
      </div>
    </div>
  );
};

export default Revenue;
