import { getPasswordStrength } from "./passwordStrength.js";

const PasswordStrengthMeter = ({ password }) => {
    if (!password) return null;

    const { level } = getPasswordStrength(password);

    return (
        <div className={`password-strength password-strength--${level.toLowerCase()}`}>
            <div className="password-strength-bar">
                <span />
                <span />
                <span />
            </div>
            <small>Password strength: {level}</small>
        </div>
    );
};

export default PasswordStrengthMeter;
