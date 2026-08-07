export const getPasswordStrength = (password) => {
    if (!password) return { level: "", score: 0 };

    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return { level: "Weak", score };
    if (score <= 4) return { level: "Medium", score };
    return { level: "Strong", score };
};
