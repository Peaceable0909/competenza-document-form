const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no confusable chars

export function makeReferenceId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  let code = "";
  for (const b of bytes) code += ALPHABET[b % ALPHABET.length];
  return `CTZ-${code}`;
}
