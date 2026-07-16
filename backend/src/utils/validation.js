// Input validation helpers for the authentication endpoints.
// Each validator returns { errors, value } where `errors` is an array of
// human-readable messages and `value` is the sanitized input object.

const MIN_USERNAME_LENGTH = 3;
const MIN_PASSWORD_LENGTH = 6;

// Shared email pattern (also reused by userController for profile updates).
const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// Validate the payload of a registration (sign-up) request.
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
  } = body || {};

  if (!username || typeof username !== "string" || username.trim().length < MIN_USERNAME_LENGTH) {
    errors.push(`username is required (min ${MIN_USERNAME_LENGTH} characters)`);
  }
  if (!password || typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    errors.push(`password is required (min ${MIN_PASSWORD_LENGTH} characters)`);
  }
  if (email && !EMAIL_REGEX.test(email)) {
    errors.push("email must be a valid address");
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
      // Security: the role is ALWAYS "user" for self-registrations. The value
      // sent by the client is ignored on purpose; an admin assigns the real
      // role (user / technician / admin) later when approving the request.
      role: "user",
    },
  };
}

// Validate the payload of a login request.
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

module.exports = { validateRegister, validateLogin, EMAIL_REGEX };
