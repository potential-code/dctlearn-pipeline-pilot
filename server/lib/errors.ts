/**
 * The error type the API throws on purpose. Codes and statuses are API-CONTRACT §0.0.1.
 * The error middleware renders `{ error: { code, message, fields? } }`; anything else is a 500
 * with a generic message when deployed.
 */
export class HttpError extends Error {
  readonly status: number
  readonly code: string
  readonly fields?: Record<string, string>
  readonly headers?: Record<string, string>

  constructor(
    status: number,
    code: string,
    message: string,
    fields?: Record<string, string>,
    headers?: Record<string, string>,
  ) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.code = code
    this.fields = fields
    this.headers = headers
  }
}

export const unauthenticated = (message = 'Sign in to continue') =>
  new HttpError(401, 'unauthenticated', message)
export const forbidden = (message = 'You do not have access to this') =>
  new HttpError(403, 'forbidden', message)
export const notFound = (message = 'Not found') => new HttpError(404, 'not_found', message)
export const validationFailed = (
  fields: Record<string, string>,
  message = 'Check the highlighted fields',
) => new HttpError(422, 'validation_failed', message, fields)
export const conflict = (message = 'This already exists') => new HttpError(409, 'conflict', message)
export const locked = (message = 'This action is not allowed in the current state') =>
  new HttpError(409, 'locked', message)
export const emailNotVerified = () =>
  new HttpError(403, 'email_not_verified', 'Verify your e-mail address first')
export const accountDisabled = () =>
  new HttpError(403, 'account_disabled', 'This account is disabled')
export const invitationInvalid = () =>
  new HttpError(410, 'invitation_invalid', 'This invitation is no longer valid')
export const rateLimited = (retryAfterSeconds: number) =>
  new HttpError(429, 'rate_limited', 'Too many requests, please try again later', undefined, {
    'Retry-After': String(retryAfterSeconds),
  })
export const featureOff = (status: 404 | 503 = 404, message = 'This feature is not available') =>
  new HttpError(status, 'feature_off', message)
export const payloadTooLarge = (message = 'The request or file is too large') =>
  new HttpError(413, 'payload_too_large', message)
export const badRequest = (message = 'Bad request') => new HttpError(400, 'bad_request', message)

export type ErrorBody = {
  error: { code: string; message: string; fields?: Record<string, string> }
}

export function errorBody(
  code: string,
  message: string,
  fields?: Record<string, string>,
): ErrorBody {
  return { error: fields === undefined ? { code, message } : { code, message, fields } }
}

/** Zod issues → `fields` map (first message per path). */
export function zodFields(issues: ReadonlyArray<{ path: PropertyKey[]; message: string }>) {
  const fields: Record<string, string> = {}
  for (const issue of issues) {
    const key = issue.path.map(String).join('.') || '_'
    fields[key] ??= issue.message
  }
  return fields
}
