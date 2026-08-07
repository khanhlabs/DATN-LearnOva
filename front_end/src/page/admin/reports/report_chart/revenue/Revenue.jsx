import { createElement } from "react";
import CategoryChart from "./category_chart/CategoryChart.jsx";
import VoucherChart from "./voucher_chart/VoucherChart.jsx";
import "./Revenue.css";

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
