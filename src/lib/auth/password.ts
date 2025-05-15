import * as crypto from "crypto";

/**
 * Hash a password using bcrypt algorithm
 *
 * @param password - The plain text password to hash
 * @returns A promise that resolves to the hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  // Generate a salt (16 bytes is recommended for bcrypt)
  const salt = crypto.randomBytes(16).toString("hex");

  // Use scrypt for password hashing (a modern, secure alternative)
  return new Promise((resolve, reject) => {
    const keyLength = 64; // Length of the derived key
    const cost = 16384; // CPU/memory cost parameter (N)

    crypto.scrypt(
      password,
      salt,
      keyLength,
      { N: cost },
      (err: Error | null, derivedKey: Buffer) => {
        if (err) reject(err);

        // Format: algorithm:iterations:salt:hash
        const hash = `scrypt:${cost}:${salt}:${derivedKey.toString("hex")}`;
        resolve(hash);
      }
    );
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
  try {
    // Parse the stored hash value
    const [algorithm, iterationsStr, salt, hashValue] = hash.split(":");

    if (algorithm !== "scrypt") {
      throw new Error("Unknown hashing algorithm");
    }

    const iterations = parseInt(iterationsStr, 10);
    const keyLength = 64; // Same as in hashPassword

    // Hash the input password with the same parameters
    return new Promise((resolve, reject) => {
      crypto.scrypt(
        password,
        salt,
        keyLength,
        { N: iterations },
        (err: Error | null, derivedKey: Buffer) => {
          if (err) reject(err);

          // Compare the derived key with the stored hash
          const hashBuffer = Buffer.from(hashValue, "hex");
          resolve(crypto.timingSafeEqual(derivedKey, hashBuffer));
        }
      );
    });
  } catch (error) {
    // If hash format is invalid or any other error
    return false;
  }
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
  const array = crypto.randomBytes(length);

  for (let i = 0; i < length; i++) {
    password += charset[array[i] % charset.length];
  }

  return password;
}
