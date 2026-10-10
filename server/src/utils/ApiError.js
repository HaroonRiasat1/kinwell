export class ApiError extends Error {
  // `code` is a stable id (e.g. "code_expired") the client can translate.
  constructor(status, message, details, code) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
  static badRequest(msg = 'Bad request', details) { return new ApiError(400, msg, details); }
  static unauthorized(msg = 'Please sign in', code) { return new ApiError(401, msg, undefined, code); }
  static forbidden(msg = "You don't have access to this") { return new ApiError(403, msg); }
  static notFound(msg = 'Not found', code) { return new ApiError(404, msg, undefined, code); }
}
