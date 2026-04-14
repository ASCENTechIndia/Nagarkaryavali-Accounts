// /**
//  * backend/src/libs/encryption.js
//  * 
//  * AES-256-CBC Encryption and Decryption functions.
//  * Matches the C# RijndaelManaged implementation with 256-bit key, 128-bit block size,
//  * CBC mode, PKCS7 padding, and a fixed 16-byte IV of zeros.
//  * 
//  * Encryption output is hex string.
//  * Decryption input is hex string.
//  */

// const crypto = require('crypto');

// const ALGORITHM = 'aes-256-cbc';
// const IV_LENGTH = 16; // 128 bits
// const KEY_LENGTH = 32; // 256 bits

// // Fixed IV from C# implementation: { 0, 0, ..., 0 }
// const IV = Buffer.alloc(IV_LENGTH, 0);

// /**
//  * Derives a 32-byte (256-bit) key from a string `KeyValue`.
//  * It takes the UTF-8 bytes of `KeyValue` and truncates/pads to 32 bytes.
//  * Matches Array.Copy(keyArr, KeyArrBytes32Value, 32) in C#.
//  */
// function deriveKey(keyValue) {
//   const keyBuffer = Buffer.from(keyValue, 'utf8');
//   const derivedKey = Buffer.alloc(KEY_LENGTH);
//   keyBuffer.copy(derivedKey, 0, 0, Math.min(keyBuffer.length, KEY_LENGTH));
//   return derivedKey;
// }

// /**
//  * Encrypts a plain text string using AES-256-CBC.
//  * @param {string} plainText The string to encrypt.
//  * @param {string} keyValue The key string to derive the encryption key from.
//  * @returns {string} The encrypted data as a hex string.
//  */
// function encryptString(plainText, keyValue) {
//   if (typeof plainText !== 'string' || typeof keyValue !== 'string') {
//     throw new Error("Invalid input: plainText and keyValue must be strings.");
//   }

//   const key = deriveKey(keyValue);

//   // Create cipher with AES-256-CBC, derived key, and fixed IV
//   const cipher = crypto.createCipheriv(ALGORITHM, key, IV);
//   cipher.setAutoPadding(true); // PKCS7 padding is default for Node.js AES CBC

//   let encrypted = cipher.update(plainText, 'utf8', 'hex');
//   encrypted += cipher.final('hex');

//   return encrypted.toUpperCase();
// }

// /**
//  * Decrypts a hex-encoded cipher text string using AES-256-CBC.
//  * @param {string} cipherTextHex The hex-encoded string to decrypt.
//  * @param {string} keyValue The key string to derive the decryption key from.
//  * @returns {string} The decrypted plain text string.
//  */
// function decryptString(cipherTextHex, keyValue) {
//   if (typeof cipherTextHex !== 'string' || typeof keyValue !== 'string') {
//     throw new Error("Invalid input: cipherTextHex and keyValue must be strings.");
//   }

//   const key = deriveKey(keyValue);

//   // Create decipher with AES-256-CBC, derived key, and fixed IV
//   const decipher = crypto.createDecipheriv(ALGORITHM, key, IV);
//   decipher.setAutoPadding(true); // PKCS7 padding is default for Node.js AES CBC

//   let decrypted = decipher.update(cipherTextHex, 'hex', 'utf8');
//   decrypted += decipher.final('utf8');

//   return decrypted;
// }

// module.exports = {
//   encryptString,
//   decryptString,
// };


const { encryptString, decryptString } = require("./passwordEncryption");
const bcrypt = require("bcrypt");


function encryptPassword(plainPassword) {
  try {
    console.log("🔐 [PASSWORD ENCRYPT] Input:", plainPassword);

    if (!plainPassword || typeof plainPassword !== "string") {
      throw new Error("Password must be string");
    }

    const encrypted = encryptString(plainPassword);

    console.log("🔐 [PASSWORD ENCRYPT] Output:", encrypted);

    return encrypted;
  } catch (error) {
    console.error("❌ Encrypt password failed:", error.message);
    throw new Error("Encryption failed");
  }
}


function decryptPassword(encryptedPassword) {
  try {
    console.log("🔓 [PASSWORD DECRYPT] Input:", encryptedPassword);

    if (!encryptedPassword || typeof encryptedPassword !== "string") {
      throw new Error("Invalid encrypted password");
    }

    const decrypted = decryptString(encryptedPassword);

    console.log("🔓 [PASSWORD DECRYPT] Output:", decrypted);

    return decrypted;
  } catch (error) {
    console.error("❌ Decrypt password failed:", error.message);
    throw new Error("Decryption failed");
  }
}


async function hashPassword(plainPassword, saltRounds = 10) {
  console.log("🔐 [HASH] Input:", plainPassword);
  const hashed = await bcrypt.hash(plainPassword, saltRounds);
  console.log("🔐 [HASH] Output:", hashed);
  return hashed;
}

async function comparePassword(plainPassword, hashedPassword) {
  console.log("🔍 [COMPARE] Plain:", plainPassword);
  console.log("🔍 [COMPARE] Hash:", hashedPassword);

  const result = await bcrypt.compare(plainPassword, hashedPassword);

  console.log("🔍 [COMPARE RESULT]:", result);

  return result;
}

async function preparePasswordForStorage(plainPassword) {
  try {
    console.log("📦 [STORE FLOW] Step 1: Encrypt");

    const encrypted = encryptPassword(plainPassword);

    console.log("📦 [STORE FLOW] Step 2: Hash");

    const hashed = await hashPassword(encrypted);

    return {
      encrypted,
      hashed,
    };
  } catch (error) {
    console.error("❌ Prepare password failed:", error.message);
    throw error;
  }
}


async function verifyLoginPassword(plainPassword, hashedFromDB) {
  try {
    console.log("🔐 [LOGIN VERIFY] Input password:", plainPassword);

    const encrypted = encryptPassword(plainPassword);

    console.log("🔐 [LOGIN VERIFY] Encrypted:", encrypted);

    const result = await comparePassword(encrypted, hashedFromDB);

    console.log("🔐 [LOGIN VERIFY RESULT]:", result);

    return result;
  } catch (error) {
    console.error("❌ Verify login failed:", error.message);
    return false;
  }
}

module.exports = {
  encryptPassword,
  decryptPassword,
  hashPassword,
  comparePassword,
  preparePasswordForStorage,
  verifyLoginPassword,
};