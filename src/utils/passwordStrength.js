export function validatePassword(pwd) {
  const errors = [];
  if (pwd.length < 8)            errors.push('mínimo 8 caracteres');
  if (!/[A-Z]/.test(pwd))        errors.push('pelo menos uma letra maiúscula');
  if (!/[0-9]/.test(pwd))        errors.push('pelo menos um número');
  if (!/[^A-Za-z0-9]/.test(pwd)) errors.push('pelo menos um símbolo (!@#$...)');
  return errors;
}

export function passwordStrengthLabel(pwd) {
  const score = [
    pwd.length >= 8,
    /[A-Z]/.test(pwd),
    /[0-9]/.test(pwd),
    /[^A-Za-z0-9]/.test(pwd),
    pwd.length >= 12,
  ].filter(Boolean).length;

  if (score <= 1) return { label: 'Muito fraca', color: 'text-red-500' };
  if (score === 2) return { label: 'Fraca',       color: 'text-orange-500' };
  if (score === 3) return { label: 'Razoável',    color: 'text-yellow-500' };
  if (score === 4) return { label: 'Boa',         color: 'text-emerald-400' };
  return                  { label: 'Forte',       color: 'text-emerald-500' };
}
