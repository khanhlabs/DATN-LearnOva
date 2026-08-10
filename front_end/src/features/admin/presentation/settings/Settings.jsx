import { useEffect, useState } from "react";
import { Bell, KeyRound, Save, SlidersHorizontal, Users } from "lucide-react";
import { toast } from "react-toastify";
import "./Settings";

const LANGUAGE_STORAGE_KEY = "learnova_admin_language";

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "vi", label: "Vietnamese" },
];

/** Values that match current LearnOva backend behavior (not editable mock policy). */
const PLATFORM_FACTS = {
  platformName: "LearnOva",
  /** Target share: platform 20% / instructor 80% (admin share capped at 20%). */
  revenueShare: "80% instructor / 20% platform",
};

const AUTH_FACTS = [
  {
    label: "Access token lifetime",
    value: "15 minutes",
    note: "From jwt.access-token-expiration (900000 ms).",
  },
  {
    label: "Password change",
    value: "On request only",
    note: "PUT /user/change-password or forgot-password. No forced rotation.",
  },
  {
    label: "Two-factor authentication",
    value: "Not implemented",
    note: "Project does not require 2FA for admins.",
  },
];

const NOTIFICATION_FACTS = [
  {
    label: "New instructor application",
    value: "Enabled",
    note: "Notifies all admins when a user submits an application.",
  },
  {
    label: "Course submitted for review",
    value: "Enabled",
    note: "Notifies all admins when a teacher sets a course to PENDING_REVIEW.",
  },
  {
    label: "New payout request",
    value: "Enabled",
    note: "Notifies all admins when a teacher requests a payout.",
  },
];

const ACCESS_RULES = [
  "ROLE_ADMIN — manage users, instructors, course approval, vouchers, revenue, payouts, settings.",
  "ROLE_TEACHER — create/submit courses, students, reviews, Q&A, revenue & payout requests.",
  "ROLE_USER — browse/buy courses, learning profile, apply to become instructor.",
];

const Settings = () => {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return saved === "vi" || saved === "en" ? saved : "en";
  });

  useEffect(() => {
    document.documentElement.lang = language === "vi" ? "vi" : "en";
  }, [language]);

  const handleSave = () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    document.documentElement.lang = language === "vi" ? "vi" : "en";
    toast.success("Admin language preference saved.");
  };

  return (
    <section className="adminSettingsPage" aria-label="System settings">
      <div className="adminSettingsContent">
        <div className="adminSettingsHeader">
          <div>
            <h1>System Settings</h1>
            <p>
              Preferences and facts from the current LearnOva codebase — not placeholder
              policy text.
            </p>
          </div>
          <button type="button" className="adminSettingsSaveButton" onClick={handleSave}>
            <Save size={18} />
            Save language
          </button>
        </div>

        <div className="adminSettingsGrid">
          <article className="adminSettingsCard">
            <div className="adminSettingsCardHeader">
              <span>
                <SlidersHorizontal size={22} />
              </span>
              <div>
                <h2>Platform Preferences</h2>
                <p>Identity and revenue split used on the admin console.</p>
              </div>
            </div>

            <div className="adminSettingsRows">
              <label className="adminSettingsRow">
                <span>Platform name</span>
                <input type="text" value={PLATFORM_FACTS.platformName} readOnly />
              </label>

              <label className="adminSettingsRow">
                <span>Admin language</span>
                <select
                  value={language}
                  onChange={(event) => setLanguage(event.target.value)}
                  aria-label="Admin language"
                >
                  {LANGUAGE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="adminSettingsRow">
                <span>Default revenue share</span>
                <input type="text" value={PLATFORM_FACTS.revenueShare} readOnly />
              </label>
            </div>
            <p className="adminSettingsHint">
              Platform (admin) share is fixed at 20%. Course lock threshold was removed —
              admin does not publish courses; teachers submit courses for approval.
            </p>
          </article>

          <article className="adminSettingsCard">
            <div className="adminSettingsCardHeader">
              <span>
                <KeyRound size={22} />
              </span>
              <div>
                <h2>Auth &amp; Session</h2>
                <p>
                  Applies to <strong>all logged-in roles</strong> (Admin, Teacher, Student) —
                  one JWT setup for everyone, not admin-only.
                </p>
              </div>
            </div>

            <div className="adminSettingsRows">
              {AUTH_FACTS.map((item) => (
                <label className="adminSettingsRow" key={item.label}>
                  <span>{item.label}</span>
                  <input type="text" value={item.value} readOnly title={item.note} />
                </label>
              ))}
            </div>
            <p className="adminSettingsHint">
              Same access/refresh cookies and change-password API for Admin, Teacher, and
              Student. There is no separate admin security policy in this project.
            </p>
          </article>

          <article className="adminSettingsCard">
            <div className="adminSettingsCardHeader">
              <span>
                <Bell size={22} />
              </span>
              <div>
                <h2>Admin Notifications</h2>
                <p>Events that already write into the admin notification bell.</p>
              </div>
            </div>

            <div className="adminSettingsRows">
              {NOTIFICATION_FACTS.map((item) => (
                <label className="adminSettingsRow" key={item.label}>
                  <span>{item.label}</span>
                  <input type="text" value={item.value} readOnly title={item.note} />
                </label>
              ))}
            </div>
          </article>

          <article className="adminSettingsCard">
            <div className="adminSettingsCardHeader">
              <span>
                <Users size={22} />
              </span>
              <div>
                <h2>Roles in this project</h2>
                <p>Only roles defined in RoleName are used.</p>
              </div>
            </div>

            <ul className="adminSettingsList">
              {ACCESS_RULES.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          </article>
        </div>
      </div>
    </section>
  );
};

export default Settings;
