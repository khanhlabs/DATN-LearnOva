import { CalendarDays, X } from "lucide-react";
import { formatPromotionCurrency } from "../utils/PromotionConfig";

const PromotionModal = ({ course, formValues, finalPrice, isSaving, onClose, onFormChange, onSubmit }) => {
  const savedAmount = Number(formValues.basePrice || 0) - finalPrice;

  return (
    <div className="teacher-promotion-modal" role="dialog" aria-modal="true" aria-labelledby="promotion-modal-title">
      <form className="teacher-promotion-modal__panel" onSubmit={onSubmit}>
        <header className="teacher-promotion-modal__header">
          <div>
            <h2 id="promotion-modal-title">Set Promotion</h2>
            <p>{course.title}</p>
          </div>
          <button type="button" aria-label="Close promotion modal" onClick={onClose}>
            <X size={20} />
          </button>
        </header>

        <div className="teacher-promotion-modal__fields">
          <label>
            <span>Discount (%)</span>
            <input
              name="percent"
              type="number"
              min="1"
              max="100"
              value={formValues.percent}
              onChange={onFormChange}
              required
            />
          </label>

          <label>
            <span>Start date</span>
            <div className="teacher-promotion-modal__date-input">
              <CalendarDays size={16} />
              <input name="startDate" type="date" value={formValues.startDate} onChange={onFormChange} required />
            </div>
          </label>

          <label>
            <span>End date</span>
            <div className="teacher-promotion-modal__date-input">
              <CalendarDays size={16} />
              <input name="endDate" type="date" value={formValues.endDate} onChange={onFormChange} required />
            </div>
          </label>

          <div className="teacher-promotion-modal__preview">
            <span>Preview Price</span>
            <strong>{formatPromotionCurrency(finalPrice)}</strong>
            <small>You save {formatPromotionCurrency(savedAmount)}</small>
          </div>
        </div>

        <footer className="teacher-promotion-modal__footer">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Apply Promotion"}
          </button>
        </footer>
      </form>
    </div>
  );
};

export default PromotionModal;
