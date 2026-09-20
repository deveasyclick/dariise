// Part of the wire contract: the dashboard switches on these values, and
// `apiErrorSchema` in `@dariise/contracts` describes the envelope.
export const ERROR_CODE = {
  invalidRequest: "invalid_request",
  unauthorized: "unauthorized",
  forbidden: "forbidden",
  notFound: "not_found",
  internalError: "internal_error",
} as const;
