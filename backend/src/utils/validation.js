const MIN_USERNAME_LENGTH = 3;
const MIN_PASSWORD_LENGTH = 6;

function validateRegister(body) {
  const errors = [];
  const {
    username,
    password,
    firstName,
    lastName,
    email,
    country,
    city,
    address,
    role,
  } = body || {};

  if (!username || typeof username !== "string" || username.trim().length < MIN_USERNAME_LENGTH) {
    errors.push(`username is required (min ${MIN_USERNAME_LENGTH} characters)`);
  }
  if (!password || typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    errors.push(`password is required (min ${MIN_PASSWORD_LENGTH} characters)`);
  }
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    errors.push("email must be a valid address");
  }
  if (role && !["user", "technician", "admin"].includes(role)) {
    errors.push("role must be one of user, technician, admin");
  }

  return {
    errors,
    value: {
      username: username ? username.trim() : null,
      password,
      firstName: firstName || null,
      lastName: lastName || null,
      email: email || null,
      country: country || null,
      city: city || null,
      address: address || null,
      role: role || "user",
    },
  };
}

function validateLogin(body) {
  const errors = [];
  const { username, password } = body || {};

  if (!username || typeof username !== "string") {
    errors.push("username is required");
  }
  if (!password || typeof password !== "string") {
    errors.push("password is required");
  }

  return { errors, value: { username, password } };
}

module.exports = { validateRegister, validateLogin };
