import { useEffect, useRef, useState } from "react";
import "./AdminHoverSelect.css";

const normalizeOptions = (options) =>
  options.map((option) =>
    typeof option === "string"
      ? { id: option, value: option, label: option }
      : {
          id: option.id ?? option.value ?? option.label,
          value: option.value ?? option.id ?? option.label,
          label: option.label ?? option.value ?? option.id,
        },
  );

const AdminHoverSelect = ({
  options,
  value,
  defaultValue,
  onChange = () => {},
  ariaLabel,
  id,
  className = "",
}) => {
  const normalizedOptions = normalizeOptions(options);
  const initialValue =
    value ?? defaultValue ?? normalizedOptions[0]?.value ?? "";
  const [internalValue, setInternalValue] = useState(initialValue);
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);
  const selectedValue = value ?? internalValue;
  const selectedLabel =
    normalizedOptions.find((option) => option.value === selectedValue)?.label ??
    normalizedOptions[0]?.label ??
    "";

  useEffect(() => {
    const closeSelect = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", closeSelect);
    return () => document.removeEventListener("mousedown", closeSelect);
  }, []);

  const handleSelect = (option) => {
    setInternalValue(option.value);
    onChange(option.value);
    setIsOpen(false);
  };

  return (
    <div
      ref={selectRef}
      className={`adminHoverSelect ${isOpen ? "open" : ""} ${className}`}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        id={id}
        type="button"
        className={`adminHoverSelectButton ${isOpen ? "active" : ""}`}
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        onClick={() => setIsOpen(true)}
      >
        <span>{selectedLabel}</span>
      </button>
      <div className="adminHoverSelectMenu">
        {normalizedOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`adminHoverSelectItem ${
              selectedValue === option.value ? "active" : ""
            }`}
            onClick={() => handleSelect(option)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default AdminHoverSelect;
