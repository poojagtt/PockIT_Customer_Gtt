export function isValidEmail(email: string): boolean {
  if (!email) {
    return false;
  }
  const emailRegex =
    /(?!.*\.{2})^([a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+(\.[a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+)*|"((([\t]*\r\n)?[\t]+)?([\x01-\x08\x0b\x0c\x0e-\x1f\x7f\x21\x23-\x5b\x5d-\x7e\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|\\[\x01-\x09\x0b\x0c\x0d-\x7f\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))*(([\t]*\r\n)?[\t]+)?")@(([a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.)+([a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.?$/i;
  return emailRegex.test(email);
}

export function isValidPassword(password: string): boolean {
  if (!password) {
    return false;
  }
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
}
export function isValidMobile(mobile: string): boolean {
  if (!mobile) {
    return false;
  }
  const mobileRegex = /^[6-9]\d{9}$/;
  return mobileRegex.test(mobile);
}

export function isValidName(name: string): boolean {
  return /^[A-Za-z]+( [A-Za-z]+)*$/.test(name);
}

export function isValidFullName(name: string): boolean {
  if (!name) return false;
  const trimmed = name.trim(); // Remove both leading and trailing spaces
  if (trimmed.length === 0) return false;
  // validate against trimmed value
  return /^[A-Za-z]+( [A-Za-z]+)*$/.test(trimmed);
}

export function isValidGST(gst: string): boolean {
  if (!gst) {
    return false;
  }
  // GST format: 2 digits + 10 digits + 1 digit + 1 character
  // Example: 22AAAAA0000A1Z5
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstRegex.test(gst.toUpperCase());
}

export function isValidShortCode(code: string): boolean {
  if (!code) {
    return false;
  }
  // Allow only alphabets and numbers (no spaces or special characters)
  const alphanumericRegex = /^[A-Za-z0-9]+$/;
  return alphanumericRegex.test(code);
}