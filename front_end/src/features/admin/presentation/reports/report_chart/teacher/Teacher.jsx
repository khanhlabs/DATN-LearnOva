import { Clock, Star, Users } from "lucide-react";
import GrowthChart from "./growth_chart/GrowthChart";
import ApprovalChart from "./approval_chart/ApprovalChart";
import ActivityChart from "./activity_chart/ActivityChart";
import "./Teacher.css";

const charts = [
  { id: "growth", component: GrowthChart },
  { id: "approval", component: ApprovalChart },
  { id: "activity", component: ActivityChart },
];

const cards = [
  {
    id: "best-rated",
    icon: Star,
    iconClass: "iconOrange",
    title: "Best Rated Instructors",
    items: [
      {
        name: "TS. Nguyễn Văn A",
        meta: "14 courses • 8,450 students",
        value: "4.92",
      },
      {
        name: "ThS. Trần Thị B",
        meta: "8 courses • 5,120 students",
        value: "4.89",
      },
      {
        name: "Kỹ sư Phạm Minh C",
        meta: "11 courses • 9,210 students",
        value: "4.85",
      },
      {
        name: "Phó TS. Lê Hoàng D",
        meta: "15 courses • 7,600 students",
        value: "4.82",
      },
      {
        name: "Bà Hoàng Thu E",
        meta: "6 courses • 3,420 students",
        value: "4.79",
      },
    ],
  },
  {
    id: "most-active",
    icon: Clock,
    iconClass: "iconGreen",
    title: "Most Active Instructors",
    items: [
      {
        name: "Phạm Minh C",
        meta: "28 live support sessions",
        value: "142 teaching hours",
      },
      {
        name: "Nguyễn Văn A",
        meta: "24 live support sessions",
        value: "120 teaching hours",
      },
      {
        name: "Lê Hoàng D",
        meta: "22 live support sessions",
        value: "115 teaching hours",
      },
      {
        name: "Trần Thị B",
        meta: "18 live support sessions",
        value: "98 teaching hours",
      },
      {
        name: "Đỗ Quốc F",
        meta: "16 live support sessions",
        value: "92 teaching hours",
      },
    ],
  },
  {
    id: "top-attraction",
    icon: Users,
    iconClass: "iconPurple",
    title: "Top Enrollment Attraction",
    items: [
      {
        name: "Kỹ sư Phạm Minh C",
        meta: "11 published courses",
        value: "9,210 students",
      },
      {
        name: "TS. Nguyễn Văn A",
        meta: "14 published courses",
        value: "8,450 students",
      },
      {
        name: "Phó TS. Lê Hoàng D",
        meta: "15 published courses",
        value: "7,600 students",
      },
      {
        name: "ThS. Trần Thị B",
        meta: "8 published courses",
        value: "5,120 students",
      },
      {
        name: "Bà Hoàng Thu E",
        meta: "6 published courses",
        value: "3,420 students",
      },
    ],
  },
];

const Teacher = () => {
  return (
    <div className="instructorsTabContent">
      <div className="instructorsChartsGrid">
        {charts.map((chart) => {
          const ChartComponent = chart.component;
          return <ChartComponent key={chart.id} />;
        })}
      </div>
      <div className="instructorsCardsGrid">
        {cards.map((card) => {
          const Icon = card.icon;
          const { id, iconClass, title, items } = card;
          return (
            <div key={id} className="instructorInfoCard">
              <div className="instructorCardHeader">
                <div className={`instructorCardIcon ${iconClass}`}>
                  <Icon size={18} />
                </div>
                <div className="instructorCardTitle">{title}</div>
              </div>
              <div className="instructorCardList">
                {items.map((item) => (
                  <div key={item.name} className="instructorCardRow">
                    <div>
                      <div className="instructorCardName">{item.name}</div>
                      <div className="instructorCardMeta">{item.meta}</div>
                    </div>
                    <div className="instructorCardValue">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Teacher;
