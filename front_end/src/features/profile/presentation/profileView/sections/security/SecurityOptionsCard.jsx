import { Settings } from "lucide-react";

const SecurityOptionsCard = ({ card, actions }) => (
  <section className="security-card security-options-card">
    <div className="security-card-heading">
      <span className="orange">
        <Settings size={22} />
      </span>
      <div>
        <h3>{card.title}</h3>
      </div>
    </div>

    <div className="security-action-list">
      {actions.map((action) => (
        <div key={action.id}>
          <div>
            <strong>{action.title}</strong>
            <p>{action.description}</p>
          </div>
          <button className={action.danger ? "danger" : ""} type="button">
            {action.buttonLabel}
          </button>
        </div>
      ))}
    </div>
  </section>
);

export default SecurityOptionsCard;
