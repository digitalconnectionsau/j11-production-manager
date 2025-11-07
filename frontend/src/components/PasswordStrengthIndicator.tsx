import React from 'react';
import { validatePasswordStrength } from '../utils/passwordValidation';

interface PasswordStrengthIndicatorProps {
  password: string;
  showRequirements?: boolean;
}

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  showRequirements = true,
}) => {
  if (!password) return null;

  const strength = validatePasswordStrength(password);

  return (
    <div className="mt-2">
      {/* Strength bar */}
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className="h-full transition-all duration-300 rounded-full"
            style={{
              width: `${(strength.score / 4) * 100}%`,
              backgroundColor: strength.color,
            }}
          />
        </div>
        <span
          className="text-xs font-medium min-w-[60px]"
          style={{ color: strength.color }}
        >
          {strength.label}
        </span>
      </div>

      {/* Requirements checklist */}
      {showRequirements && (
        <div className="text-xs space-y-1">
          <RequirementItem
            met={strength.requirements.minLength}
            text="At least 8 characters"
          />
          <RequirementItem
            met={strength.requirements.hasUppercase}
            text="One uppercase letter"
          />
          <RequirementItem
            met={strength.requirements.hasLowercase}
            text="One lowercase letter"
          />
          <RequirementItem
            met={strength.requirements.hasNumber}
            text="One number"
          />
          <RequirementItem
            met={strength.requirements.hasSpecialChar}
            text="One special character"
          />
        </div>
      )}
    </div>
  );
};

interface RequirementItemProps {
  met: boolean;
  text: string;
}

const RequirementItem: React.FC<RequirementItemProps> = ({ met, text }) => (
  <div className={`flex items-center gap-1.5 ${met ? 'text-green-600' : 'text-gray-500'}`}>
    <svg
      className="w-3.5 h-3.5 flex-shrink-0"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      {met ? (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 13l4 4L19 7"
        />
      ) : (
        <circle cx="12" cy="12" r="9" strokeWidth={2} />
      )}
    </svg>
    <span>{text}</span>
  </div>
);

export default PasswordStrengthIndicator;
