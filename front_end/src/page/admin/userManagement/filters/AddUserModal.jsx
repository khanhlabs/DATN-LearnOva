import {
  Calendar,
  IdCard,
  Mail,
  LockKeyhole,
  Phone,
  Shield,
  User,
  VenusAndMars,
  X,
} from "lucide-react";
import { useState } from "react";
import "./AddUserModal.css";

const initialForm = {
  fullName: "",
  email: "",
  password: "",
  phone: "",
  dateOfBirth: "",
  gender: "",
  role: "ROLE_USER",
};

const roleOptions = [
  { value: "ROLE_USER", label: "Student" },
  { value: "ROLE_TEACHER", label: "Instructor" },
  { value: "ROLE_ADMIN", label: "Admin" },
];

const genderOptions = ["Male", "Female", "Other"];
const emailPattern = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
const phonePattern = /^0[0-9]{9}$/;
const phoneMaxLength = 10;
const passwordMinLength = 6;

const getTodayValue = () => new Date().toISOString().slice(0, 10);

const AddUserModal = ({ isOpen, onClose, onSubmit, onNotify = () => {} }) => {
  const [formData, setFormData] = useState(initialForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const updateField = (name, value) => {
    setFormData((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: "" }));
    setSubmitError("");
  };

  const handleChange = (event) => {
    updateField(event.target.name, event.target.value);
  };

  const handlePhoneChange = (event) => {
    updateField("phone", event.target.value.replace(/\D/g, "").slice(0, phoneMaxLength));
  };

  const validateForm = () => {
    const errors = {};
    const today = getTodayValue();

    if (!formData.fullName.trim()) {
      errors.fullName = "Full name is required.";
    }

    if (!formData.email.trim()) {
      errors.email = "Email is required.";
    } else if (!emailPattern.test(formData.email.trim())) {
      errors.email = "Email must be a valid Gmail address.";
    }

    if (!formData.password) {
      errors.password = "Password is required.";
    } else if (formData.password.length < passwordMinLength) {
      errors.password = "Password must contain at least 6 characters.";
    }

    if (!formData.phone.trim()) {
      errors.phone = "Phone number is required.";
    } else if (!phonePattern.test(formData.phone)) {
      errors.phone = "Phone number must start with 0 and contain exactly 10 digits.";
    }

    if (!formData.dateOfBirth) {
      errors.dateOfBirth = "Date of birth is required.";
    } else if (formData.dateOfBirth > today) {
      errors.dateOfBirth = "Date of birth cannot be in the future.";
    }

    if (!formData.gender) {
      errors.gender = "Gender is required.";
    }

    if (!formData.role) {
      errors.role = "Role is required.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitError("");

    const payload = {
      fullName: formData.fullName.trim(),
      email: formData.email.trim(),
      password: formData.password,
      phone: formData.phone.trim(),
      dateOfBirth: formData.dateOfBirth,
      gender: formData.gender,
      role: formData.role,
      isActive: true,
      isDeleted: false,
      avatar: null,
      coverImage: null,
    };

    try {
      await onSubmit(payload);
      onNotify("User created successfully", "success");
      setFormData(initialForm);
      setFieldErrors({});
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data ||
        "Could not create this user. Please try again.";
      setSubmitError(message);
      onNotify("Failed to create user", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData(initialForm);
    setFieldErrors({});
    setSubmitError("");
    onClose();
  };

  const renderFieldError = (field) =>
    fieldErrors[field] ? <p className="add-user-field-error">{fieldErrors[field]}</p> : null;

  return (
    <div className="add-user-overlay" onClick={handleClose} role="presentation">
      <form
        className="add-user-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Add New User"
        onClick={(event) => event.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <button
          type="button"
          className="add-user-close"
          onClick={handleClose}
          aria-label="Close popup"
        >
          <X size={22} aria-hidden="true" />
        </button>

        <div className="add-user-header">
          <p>Add User</p>
          <h2>Create New Account</h2>
        </div>

        <div className="add-user-grid">
          <label className="add-user-field">
            <span>
              <User aria-hidden="true" />
              Full Name *
            </span>
            <input
              name="fullName"
              placeholder="Enter full name"
              value={formData.fullName}
              onChange={handleChange}
            />
            {renderFieldError("fullName")}
          </label>

          <label className="add-user-field">
            <span>
              <Mail aria-hidden="true" />
              Email *
            </span>
            <input
              type="email"
              name="email"
              placeholder="example@gmail.com"
              value={formData.email}
              onChange={handleChange}
            />
            {renderFieldError("email")}
          </label>

          <label className="add-user-field">
            <span>
              <LockKeyhole aria-hidden="true" />
              Password *
            </span>
            <input
              type="password"
              name="password"
              placeholder="Enter password"
              value={formData.password}
              onChange={handleChange}
            />
            {renderFieldError("password")}
          </label>

          <label className="add-user-field">
            <span>
              <Phone aria-hidden="true" />
              Phone *
            </span>
            <input
              type="text"
              name="phone"
              placeholder="0987654321"
              value={formData.phone}
              onChange={handlePhoneChange}
            />
            {renderFieldError("phone")}
          </label>

          <label className="add-user-field">
            <span>
              <Calendar aria-hidden="true" />
              Date of Birth *
            </span>
            <input
              type="date"
              name="dateOfBirth"
              max={getTodayValue()}
              value={formData.dateOfBirth}
              onChange={handleChange}
            />
            {renderFieldError("dateOfBirth")}
          </label>

          <label className="add-user-field">
            <span>
              <VenusAndMars aria-hidden="true" />
              Gender *
            </span>
            <select name="gender" value={formData.gender} onChange={handleChange}>
              <option value="">Select gender</option>
              {genderOptions.map((gender) => (
                <option key={gender} value={gender}>
                  {gender}
                </option>
              ))}
            </select>
            {renderFieldError("gender")}
          </label>

          <label className="add-user-field">
            <span>
              <Shield aria-hidden="true" />
              Role *
            </span>
            <select name="role" value={formData.role} onChange={handleChange}>
              {roleOptions.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
            {renderFieldError("role")}
          </label>

          <div className="add-user-note">
            <IdCard aria-hidden="true" />
            <span>ID is generated automatically after the account is created.</span>
          </div>
        </div>

        {submitError ? <p className="add-user-submit-error">{submitError}</p> : null}

        <div className="add-user-actions">
          <button
            type="button"
            className="add-user-cancel"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button type="submit" className="add-user-submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create User"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddUserModal;
