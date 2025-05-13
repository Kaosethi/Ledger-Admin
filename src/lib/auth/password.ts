/**
 * Hash a password using Bun's native password hashing
 *
 * @param password - The plain text password to hash
 * @returns A promise that resolves to the hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  return Bun.password.hash(password, {
    algorithm: "bcrypt",
    cost: 12, // Work factor, higher is more secure but slower
  });
}

/**
 * Verify a password against a hash
 *
 * @param password - The plain text password to verify
 * @param hash - The hash to verify against
 * @returns A promise that resolves to true if the password matches the hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return Bun.password.verify(password, hash);
}

/**
 * Generate a secure random password
 *
 * @param length - The length of the password to generate (default: 12)
 * @returns A secure random password
 */
export function generatePassword(length: number = 12): string {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=";
  let password = "";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);

  for (let i = 0; i < length; i++) {
    password += charset[array[i] % charset.length];
  }

  return password;
}
