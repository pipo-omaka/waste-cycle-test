const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

const validatePassword = (password) => {
  // Example: at least 6 characters
  return password && password.length >= 6;
};

export {
  validateEmail,
  validatePassword,
};