// /**
//  * backend/src/libs/passwordEncryption.js
//  * 
//  * Password Encryption & Decryption utility for database storage
//  * 
//  * This module handles:
//  * 1. Encrypting user passwords before storing in DB
//  * 2. Decrypting passwords from DB when needed
//  * 3. Hashing passwords for additional security layer (bcrypt)
//  * 4. Comparing encrypted passwords for login verification
//  */

// const { encryptString, decryptString } = require('./encryption');
// const bcrypt = require('bcrypt');

// // Encryption key - Should be stored in environment variables
// const ENCRYPTION_KEY = process.env.PASSWORD_ENCRYPTION_KEY || 'your-256-bit-encryption-key';

// /**
//  * ============================================
//  * PASSWORD ENCRYPTION FUNCTIONS
//  * ============================================
//  */

// /**
//  * Encrypt a plain text password before storing in database
//  * @param {string} plainPassword - Plain text password from user
//  * @returns {string} - Encrypted password (hex string)
//  */
// function encryptPassword(plainPassword) {
//   try {
//     if (!plainPassword || typeof plainPassword !== 'string') {
//       throw new Error('Password must be a non-empty string');
//     }

//     // Use AES-256-CBC encryption
//     const encryptedPassword = encryptString(plainPassword, ENCRYPTION_KEY);
//     return encryptedPassword;
//   } catch (error) {
//     console.error('❌ Password encryption failed:', error.message);
//     throw new Error('Failed to encrypt password');
//   }
// }

// /**
//  * Decrypt an encrypted password from database
//  * @param {string} encryptedPassword - Encrypted password from DB (hex string)
//  * @returns {string} - Decrypted plain text password
//  */
// function decryptPassword(encryptedPassword) {
//   try {
//     if (!encryptedPassword || typeof encryptedPassword !== 'string') {
//       throw new Error('Encrypted password must be a non-empty string');
//     }

//     // Decrypt using AES-256-CBC
//     const decryptedPassword = decryptString(encryptedPassword, ENCRYPTION_KEY);
//     return decryptedPassword;
//   } catch (error) {
//     console.error('❌ Password decryption failed:', error.message);
//     throw new Error('Failed to decrypt password');
//   }
// }

// /**
//  * ============================================
//  * PASSWORD HASHING FUNCTIONS (Bcrypt Layer)
//  * ============================================
//  */

// /**
//  * Hash a password using bcrypt (additional security layer)
//  * @param {string} plainPassword - Plain text password
//  * @param {number} saltRounds - Number of salt rounds (default: 10)
//  * @returns {Promise<string>} - Hashed password
//  */
// async function hashPassword(plainPassword, saltRounds = 10) {
//   try {
//     if (!plainPassword || typeof plainPassword !== 'string') {
//       throw new Error('Password must be a non-empty string');
//     }

//     const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
//     return hashedPassword;
//   } catch (error) {
//     console.error('❌ Password hashing failed:', error.message);
//     throw new Error('Failed to hash password');
//   }
// }

// /**
//  * Compare a plain text password with a bcrypt hash
//  * @param {string} plainPassword - Plain text password to verify
//  * @param {string} hashedPassword - Bcrypt hash from database
//  * @returns {Promise<boolean>} - True if password matches, false otherwise
//  */
// async function comparePassword(plainPassword, hashedPassword) {
//   try {
//     if (!plainPassword || !hashedPassword) {
//       throw new Error('Password and hash must be non-empty strings');
//     }

//     const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
//     return isMatch;
//   } catch (error) {
//     console.error('❌ Password comparison failed:', error.message);
//     return false;
//   }
// }

// /**
//  * ============================================
//  * COMBINED PASSWORD STORAGE FLOW
//  * ============================================
//  */

// /**
//  * Prepare password for database storage
//  * Returns both encrypted and hashed password
//  * 
//  * FLOW:
//  * 1. Encrypt password: plain → AES-256 encrypted
//  * 2. Hash encrypted password: encrypted → bcrypt hash
//  * 3. Store: encrypted (for recovery) + hash (for verification)
//  * 
//  * @param {string} plainPassword - Plain text password from user
//  * @returns {Promise<{encrypted: string, hashed: string}>}
//  */
// async function preparePasswordForStorage(plainPassword) {
//   try {
//     // Step 1: Encrypt the plain password
//     const encryptedPassword = encryptPassword(plainPassword);

//     // Step 2: Hash the encrypted password with bcrypt
//     const hashedPassword = await hashPassword(encryptedPassword);

//     return {
//       encrypted: encryptedPassword,  // Store in password_encrypted column
//       hashed: hashedPassword,        // Store in password_hash column
//     };
//   } catch (error) {
//     console.error('❌ Password preparation failed:', error.message);
//     throw new Error('Failed to prepare password for storage');
//   }
// }

// /**
//  * Verify login password against database stored values
//  * 
//  * FLOW:
//  * 1. Encrypt provided password: plain → AES-256 encrypted
//  * 2. Compare with bcrypt hash stored in DB
//  * 
//  * @param {string} plainPassword - Password provided by user at login
//  * @param {string} hashedPasswordFromDB - Bcrypt hash stored in database
//  * @returns {Promise<boolean>} - True if password is correct
//  */
// async function verifyLoginPassword(plainPassword, hashedPasswordFromDB) {
//   try {
//     // Step 1: Encrypt the provided password
//     const encryptedPassword = encryptPassword(plainPassword);

//     // Step 2: Compare with hash from DB
//     const isValid = await comparePassword(encryptedPassword, hashedPasswordFromDB);

//     return isValid;
//   } catch (error) {
//     console.error('❌ Password verification failed:', error.message);
//     return false;
//   }
// }

// /**
//  * ============================================
//  * UTILITY FUNCTIONS
//  * ============================================
//  */

// /**
//  * Check if a string looks like encrypted password (hex format)
//  * @param {string} str - String to check
//  * @returns {boolean} - True if looks like encrypted password
//  */
// function isEncryptedPassword(str) {
//   // Encrypted passwords are hex strings (0-9, A-F)
//   return /^[0-9A-F]{32,}$/i.test(str);
// }

// /**
//  * Check if a string looks like bcrypt hash
//  * @param {string} str - String to check
//  * @returns {boolean} - True if looks like bcrypt hash
//  */
// function isBcryptHash(str) {
//   // Bcrypt hashes start with $2a$, $2b$, or $2x$
//   return /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(str);
// }

// /**
//  * Validate password strength
//  * @param {string} password - Password to validate
//  * @returns {object} - Validation result with score and feedback
//  */
// function validatePasswordStrength(password) {
//   const result = {
//     isStrong: false,
//     score: 0,
//     feedback: [],
//   };

//   if (!password) {
//     result.feedback.push('Password is required');
//     return result;
//   }

//   if (password.length < 8) {
//     result.feedback.push('Password must be at least 8 characters long');
//   } else {
//     result.score += 1;
//   }

//   if (!/[a-z]/.test(password)) {
//     result.feedback.push('Password must contain lowercase letters');
//   } else {
//     result.score += 1;
//   }

//   if (!/[A-Z]/.test(password)) {
//     result.feedback.push('Password must contain uppercase letters');
//   } else {
//     result.score += 1;
//   }

//   if (!/[0-9]/.test(password)) {
//     result.feedback.push('Password must contain numbers');
//   } else {
//     result.score += 1;
//   }

//   if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
//     result.feedback.push('Password must contain special characters');
//   } else {
//     result.score += 1;
//   }

//   result.isStrong = result.score >= 3;
//   return result;
// }

// /**
//  * ============================================
//  * EXPORTS
//  * ============================================
//  */

// module.exports = {
//   // Core encryption/decryption
//   encryptPassword,
//   decryptPassword,

//   // Hashing functions
//   hashPassword,
//   comparePassword,

//   // Combined flows
//   preparePasswordForStorage,
//   verifyLoginPassword,

//   // Utility functions
//   isEncryptedPassword,
//   isBcryptHash,
//   validatePasswordStrength,
// };



/**
 * backend/src/libs/oracleEncryption.js
 * 
 * TripleDES Encryption (C# compatible)
 * Mode: ECB
 * Padding: PKCS7
 * Output: Base64 string (same as CryptoJS)
 */

const CryptoJS = require('crypto-js');

const ENCRYPTION_KEY =
  process.env.ORACLE_ENCRYPTION_KEY ||
  "AS23N7E2H4V717DEAS23N7E2H4V717DE";

/**
 * Encrypt string using TripleDES (ECB)
 */
function encryptString(plainText) {
  try {
    console.log("🔐 [ENCRYPT] Input:", plainText);

    if (!plainText || typeof plainText !== "string") {
      throw new Error("Invalid plainText");
    }

    const key = CryptoJS.enc.Utf8.parse(ENCRYPTION_KEY);

    const encrypted = CryptoJS.TripleDES.encrypt(plainText, key, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7,
    });

    const output = encrypted.toString(); // Base64

    console.log("🔐 [ENCRYPT] Key:", ENCRYPTION_KEY);
    console.log("🔐 [ENCRYPT] Output:", output);

    return output;
  } catch (error) {
    console.error("❌ TripleDES encryption failed:", error);
    throw new Error("Encryption failed");
  }
}

/**
 * Decrypt string
 */
function decryptString(cipherText) {
  try {
    console.log("🔓 [DECRYPT] Input:", cipherText);

    if (!cipherText || typeof cipherText !== "string") {
      throw new Error("Invalid cipherText");
    }

    const key = CryptoJS.enc.Utf8.parse(ENCRYPTION_KEY);

    const decrypted = CryptoJS.TripleDES.decrypt(cipherText, key, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7,
    });

    const output = decrypted.toString(CryptoJS.enc.Utf8);

    console.log("🔓 [DECRYPT] Output:", output);

    return output;
  } catch (error) {
    console.error("❌ TripleDES decryption failed:", error);
    throw new Error("Decryption failed");
  }
}

module.exports = {
  encryptString,
  decryptString,
};