export const SECURITY_OVERVIEW = {
  title: "Your account is well protected",
  description: "You have enabled important security features.",
  levelLabel: "Security Level:",
  levelValue: "High",
  progressSegments: [true, true, true, false],
  checks: ["Strong Password", "Verified Email", "Verified Phone Number"],
};

export const PASSWORD_FIELDS = [
  {
    id: "currentPassword",
    label: "Current Password",
    placeholder: "••••••••••••",
  },
  {
    id: "newPassword",
    label: "New Password",
    placeholder: "••••••••••••",
    strength: "Strong",
    hint: "Password must be at least 8 characters long and include uppercase letters, lowercase letters, numbers, and special characters.",
  },
  {
    id: "confirmPassword",
    label: "Confirm New Password",
    placeholder: "••••••••••••",
  },
];

export const CONTACT_ROWS = [
  {
    id: "email",
    label: "Email",
    profileKey: "email",
    fallback: "johndoe@example.com",
  },
  {
    id: "phone",
    label: "Phone Number",
    profileKey: "phone",
    fallback: "+1 (123) 456-7890",
  },
  {
    id: "changeContact",
    label: "Change Email or Phone Number",
  },
];

export const SECURITY_ACTIONS = [
  {
    id: "deleteAccount",
    title: "Delete Account",
    description: "Permanently delete your account and all associated data",
    buttonLabel: "Delete Account",
    danger: true,
  },
];

export const SECURITY_CARD_TITLES = {
  password: {
    title: "Change Password",
    description: "Update your password to keep your account secure",
    submitLabel: "Update Password",
  },
  contact: {
    title: "Email & Phone Number",
    description: "Manage the email and phone number linked to your account",
  },
  options: {
    title: "Other Security Options",
  },
};

export const getSecurityContactRows = (profileData = {}) =>
  CONTACT_ROWS.map((row) => ({
    ...row,
    value: row.profileKey ? profileData[row.profileKey] || row.fallback : "",
  }));
