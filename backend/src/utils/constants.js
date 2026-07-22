// Allowed values for the enum-like columns, used for validation in controllers.
const ROLES = ["user", "technician", "admin"];
const REGISTER_STATUSES = ["pending", "denied", "accepted"];
const TICKET_STATUSES = ["open", "in_progress", "closed"];
const PRIORITIES = ["low", "medium", "high"];

module.exports = { ROLES, REGISTER_STATUSES, TICKET_STATUSES, PRIORITIES };
