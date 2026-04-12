const specialCharacterPattern = /[@#$%^&+=!]/;

export const passwordRequirements = [
  {
    id: "length",
    label: "Minimo 8 caracteres",
    test: (password) => password.length >= 8,
  },
  {
    id: "uppercase",
    label: "Al menos una mayuscula",
    test: (password) => /[A-Z]/.test(password),
  },
  {
    id: "lowercase",
    label: "Al menos una minuscula",
    test: (password) => /[a-z]/.test(password),
  },
  {
    id: "number",
    label: "Al menos un numero",
    test: (password) => /\d/.test(password),
  },
  {
    id: "special",
    label: "Al menos un caracter especial: @#$%^&+=!",
    test: (password) => specialCharacterPattern.test(password),
  },
];

export function getPasswordRequirementChecks(password) {
  return passwordRequirements.map((requirement) => ({
    ...requirement,
    passed: requirement.test(password),
  }));
}

export function isPasswordValid(password) {
  return getPasswordRequirementChecks(password).every(
    (requirement) => requirement.passed
  );
}

export function getPasswordStrength(password) {
  const score = getPasswordRequirementChecks(password).filter(
    (requirement) => requirement.passed
  ).length;

  if (!password) {
    return {
      label: "Sin evaluar",
      tone: "neutral",
      progress: 0,
    };
  }

  if (score <= 2) {
    return {
      label: "Debil",
      tone: "weak",
      progress: 33,
    };
  }

  if (score <= 4) {
    return {
      label: "Media",
      tone: "medium",
      progress: 66,
    };
  }

  return {
    label: "Fuerte",
    tone: "strong",
    progress: 100,
  };
}
