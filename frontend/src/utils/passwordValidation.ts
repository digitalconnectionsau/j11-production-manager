/**
 * Password strength validation utilities
 */

export interface PasswordStrength {
  score: number; // 0-4
  label: string;
  color: string;
  requirements: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
  };
  isValid: boolean;
}

export const validatePasswordStrength = (password: string): PasswordStrength => {
  const requirements = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[^A-Za-z0-9]/.test(password),
  };

  // Calculate score based on requirements met
  const requirementsMet = Object.values(requirements).filter(Boolean).length;
  
  let score = 0;
  let label = 'Weak';
  let color = '#DC2626'; // red

  if (requirementsMet === 5) {
    score = 4;
    label = 'Strong';
    color = '#16A34A'; // green
  } else if (requirementsMet === 4) {
    score = 3;
    label = 'Good';
    color = '#84CC16'; // lime
  } else if (requirementsMet === 3) {
    score = 2;
    label = 'Fair';
    color = '#EAB308'; // yellow
  } else if (requirementsMet >= 1) {
    score = 1;
    label = 'Weak';
    color = '#F59E0B'; // orange
  }

  const isValid = Object.values(requirements).every(Boolean);

  return {
    score,
    label,
    color,
    requirements,
    isValid,
  };
};

export const getPasswordRequirementsText = (): string[] => {
  return [
    'At least 8 characters',
    'One uppercase letter (A-Z)',
    'One lowercase letter (a-z)',
    'One number (0-9)',
    'One special character (!@#$%^&*)',
  ];
};
