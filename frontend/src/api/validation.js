const labels = {
  username: 'Username',
  password: 'Password',
  body: 'Comment',
  before: 'Cursor',
  limit: 'Page size',
};
function describe(issue, field) {
  if (issue.type === 'string_too_short')
    return `Must contain at least ${issue.ctx?.min_length} characters.`;
  if (issue.type === 'string_too_long')
    return `Must contain at most ${issue.ctx?.max_length} characters.`;
  if (issue.type === 'string_pattern_mismatch' && field === 'username')
    return 'Use Latin letters, numbers or underscores only.';
  if (issue.type === 'missing') return 'This field is required.';
  return String(issue.msg || 'Invalid value.').replace(/^Value error, /, '');
}
export function parseApiError(detail) {
  if (!Array.isArray(detail))
    return {
      message:
        typeof detail === 'string' ? detail : 'Unable to complete the request. Please try again.',
      fieldErrors: {},
    };
  const fieldErrors = {};
  for (const issue of detail) {
    const path = (issue.loc || []).filter(
      (part, index) => !(index === 0 && ['body', 'query', 'path', 'header'].includes(part)),
    );
    const field = path.join('.') || 'request';
    const message = describe(issue, field);
    (fieldErrors[field] ||= []).push(message);
  }
  const message = Object.entries(fieldErrors)
    .map(([field, errors]) => `${labels[field] || field}: ${errors.join(' ')}`)
    .join(' ');
  return { message: message || 'Invalid request.', fieldErrors };
}
