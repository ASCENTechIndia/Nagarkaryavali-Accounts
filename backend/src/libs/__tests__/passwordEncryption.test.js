/**
 * backend/src/libs/__tests__/passwordEncryption.test.js
 * 
 * Test file for password encryption/decryption
 * Run with: node src/libs/__tests__/passwordEncryption.test.js
 */

const passwordEncryption = require('../passwordEncryption');

/**
 * ============================================
 * TEST SUITE: Password Encryption & Decryption
 * ============================================
 */

async function runAllTests() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 PASSWORD ENCRYPTION TEST SUITE');
  console.log('='.repeat(60));

  let passCount = 0;
  let failCount = 0;

  // Test 1: Encrypt and Decrypt
  console.log('\n\n📝 Test 1: Encrypt & Decrypt Password');
  console.log('─'.repeat(60));
  try {
    const plainPassword = 'MySecurePassword123!@#';
    console.log(`  Input Password: ${plainPassword}`);

    const encrypted = passwordEncryption.encryptPassword(plainPassword);
    console.log(`  ✓ Encrypted: ${encrypted.substring(0, 40)}... (${encrypted.length} chars)`);

    const decrypted = passwordEncryption.decryptPassword(encrypted);
    console.log(`  ✓ Decrypted: ${decrypted}`);

    if (plainPassword === decrypted) {
      console.log('  ✅ PASS: Encryption & Decryption works!');
      passCount++;
    } else {
      console.log('  ❌ FAIL: Decrypted password does not match original');
      failCount++;
    }
  } catch (error) {
    console.log(`  ❌ FAIL: ${error.message}`);
    failCount++;
  }

  // Test 2: Different passwords produce different encrypted values
  console.log('\n\n📝 Test 2: Different Passwords = Different Encrypted');
  console.log('─'.repeat(60));
  try {
    const pwd1 = 'Password123';
    const pwd2 = 'Password124';

    const enc1 = passwordEncryption.encryptPassword(pwd1);
    const enc2 = passwordEncryption.encryptPassword(pwd2);

    console.log(`  Password 1: ${pwd1}`);
    console.log(`  Encrypted 1: ${enc1.substring(0, 40)}...`);
    console.log(`  Password 2: ${pwd2}`);
    console.log(`  Encrypted 2: ${enc2.substring(0, 40)}...`);

    if (enc1 !== enc2) {
      console.log('  ✅ PASS: Different passwords produce different encrypted values');
      passCount++;
    } else {
      console.log('  ❌ FAIL: Different passwords produced same encrypted value');
      failCount++;
    }
  } catch (error) {
    console.log(`  ❌ FAIL: ${error.message}`);
    failCount++;
  }

  // Test 3: Same password encrypts to same value
  console.log('\n\n📝 Test 3: Same Password = Same Encrypted (Deterministic)');
  console.log('─'.repeat(60));
  try {
    const pwd = 'TestPassword456';

    const enc1 = passwordEncryption.encryptPassword(pwd);
    const enc2 = passwordEncryption.encryptPassword(pwd);

    console.log(`  Password: ${pwd}`);
    console.log(`  Encrypted (1st): ${enc1.substring(0, 40)}...`);
    console.log(`  Encrypted (2nd): ${enc2.substring(0, 40)}...`);

    if (enc1 === enc2) {
      console.log('  ✅ PASS: Same password encrypts to same value (deterministic)');
      passCount++;
    } else {
      console.log('  ❌ FAIL: Same password produced different encrypted values');
      failCount++;
    }
  } catch (error) {
    console.log(`  ❌ FAIL: ${error.message}`);
    failCount++;
  }

  // Test 4: Hash Password
  console.log('\n\n📝 Test 4: Hash Password (Bcrypt)');
  console.log('─'.repeat(60));
  try {
    const plainPassword = 'MySecurePassword123!@#';
    console.log(`  Input: ${plainPassword}`);

    const hashed = await passwordEncryption.hashPassword(plainPassword);
    console.log(`  ✓ Hashed: ${hashed.substring(0, 40)}... (${hashed.length} chars)`);
    console.log(`  ✓ Hash starts with: $2b$ (Bcrypt v2b)`);

    if (hashed.startsWith('$2b$')) {
      console.log('  ✅ PASS: Password hashed with bcrypt');
      passCount++;
    } else {
      console.log('  ❌ FAIL: Hash does not have bcrypt format');
      failCount++;
    }
  } catch (error) {
    console.log(`  ❌ FAIL: ${error.message}`);
    failCount++;
  }

  // Test 5: Hash verification (correct password)
  console.log('\n\n📝 Test 5: Hash Verification (Correct Password)');
  console.log('─'.repeat(60));
  try {
    const plainPassword = 'MySecurePassword123!@#';
    console.log(`  Input Password: ${plainPassword}`);

    const hashed = await passwordEncryption.hashPassword(plainPassword);
    console.log(`  Hashed: ${hashed.substring(0, 20)}...`);

    const isMatch = await passwordEncryption.comparePassword(plainPassword, hashed);
    console.log(`  Verification Result: ${isMatch}`);

    if (isMatch) {
      console.log('  ✅ PASS: Correct password matches hash');
      passCount++;
    } else {
      console.log('  ❌ FAIL: Correct password does not match hash');
      failCount++;
    }
  } catch (error) {
    console.log(`  ❌ FAIL: ${error.message}`);
    failCount++;
  }

  // Test 6: Hash verification (wrong password)
  console.log('\n\n📝 Test 6: Hash Verification (Wrong Password)');
  console.log('─'.repeat(60));
  try {
    const correctPassword = 'MySecurePassword123!@#';
    const wrongPassword = 'WrongPassword456';
    console.log(`  Correct Password: ${correctPassword}`);
    console.log(`  Wrong Password: ${wrongPassword}`);

    const hashed = await passwordEncryption.hashPassword(correctPassword);

    const isMatch = await passwordEncryption.comparePassword(wrongPassword, hashed);
    console.log(`  Verification Result: ${isMatch}`);

    if (!isMatch) {
      console.log('  ✅ PASS: Wrong password does not match hash');
      passCount++;
    } else {
      console.log('  ❌ FAIL: Wrong password incorrectly matched hash');
      failCount++;
    }
  } catch (error) {
    console.log(`  ❌ FAIL: ${error.message}`);
    failCount++;
  }

  // Test 7: Combined flow - preparePasswordForStorage
  console.log('\n\n📝 Test 7: Combined Flow - Prepare for Storage');
  console.log('─'.repeat(60));
  try {
    const plainPassword = 'MySecurePassword123!@#';
    console.log(`  Input: ${plainPassword}`);

    const prepared = await passwordEncryption.preparePasswordForStorage(plainPassword);
    console.log(`  ✓ Encrypted: ${prepared.encrypted.substring(0, 40)}...`);
    console.log(`  ✓ Hash: ${prepared.hashed.substring(0, 20)}...`);

    // Verify the encrypted can be decrypted
    const decrypted = passwordEncryption.decryptPassword(prepared.encrypted);
    console.log(`  ✓ Encrypted can be decrypted: ${decrypted === plainPassword}`);

    // Verify the hash can be verified
    const canVerify = await passwordEncryption.comparePassword(
      decrypted,
      prepared.hashed
    );
    console.log(`  ✓ Hash can be verified: ${canVerify}`);

    if (decrypted === plainPassword && canVerify) {
      console.log('  ✅ PASS: Combined storage flow works');
      passCount++;
    } else {
      console.log('  ❌ FAIL: Combined storage flow failed');
      failCount++;
    }
  } catch (error) {
    console.log(`  ❌ FAIL: ${error.message}`);
    failCount++;
  }

  // Test 8: Combined flow - verifyLoginPassword
  console.log('\n\n📝 Test 8: Combined Flow - Verify Login (Correct)');
  console.log('─'.repeat(60));
  try {
    const plainPassword = 'MySecurePassword123!@#';
    console.log(`  Original Password: ${plainPassword}`);

    // Simulate what was stored in DB
    const prepared = await passwordEncryption.preparePasswordForStorage(plainPassword);
    console.log(`  ✓ Stored in DB`);

    // Verify at login time
    const providedPassword = 'MySecurePassword123!@#';
    console.log(`  Provided Password: ${providedPassword}`);

    const isValid = await passwordEncryption.verifyLoginPassword(
      providedPassword,
      prepared.hashed
    );
    console.log(`  Verification: ${isValid}`);

    if (isValid) {
      console.log('  ✅ PASS: Login verification works for correct password');
      passCount++;
    } else {
      console.log('  ❌ FAIL: Login verification failed for correct password');
      failCount++;
    }
  } catch (error) {
    console.log(`  ❌ FAIL: ${error.message}`);
    failCount++;
  }

  // Test 9: Combined flow - verifyLoginPassword (Wrong)
  console.log('\n\n📝 Test 9: Combined Flow - Verify Login (Wrong Password)');
  console.log('─'.repeat(60));
  try {
    const correctPassword = 'MySecurePassword123!@#';
    console.log(`  Original Password: ${correctPassword}`);

    // Simulate what was stored in DB
    const prepared = await passwordEncryption.preparePasswordForStorage(correctPassword);
    console.log(`  ✓ Stored in DB`);

    // Try login with wrong password
    const wrongPassword = 'WrongPassword456@#$';
    console.log(`  Provided Password: ${wrongPassword}`);

    const isValid = await passwordEncryption.verifyLoginPassword(
      wrongPassword,
      prepared.hashed
    );
    console.log(`  Verification: ${isValid}`);

    if (!isValid) {
      console.log('  ✅ PASS: Login verification correctly rejects wrong password');
      passCount++;
    } else {
      console.log('  ❌ FAIL: Login verification incorrectly accepted wrong password');
      failCount++;
    }
  } catch (error) {
    console.log(`  ❌ FAIL: ${error.message}`);
    failCount++;
  }

  // Test 10: Password Strength Validation
  console.log('\n\n📝 Test 10: Password Strength Validation');
  console.log('─'.repeat(60));
  try {
    const weakPasswords = [
      { pwd: 'weak', desc: 'Too short' },
      { pwd: 'password', desc: 'No numbers or special chars' },
      { pwd: 'Pass123', desc: 'No special chars' },
    ];

    const strongPassword = 'StrongPass123!@#';

    console.log('  Testing weak passwords:');
    let allWeak = true;
    for (const test of weakPasswords) {
      const result = passwordEncryption.validatePasswordStrength(test.pwd);
      console.log(
        `    "${test.pwd}" (${test.desc}): Strong=${result.isStrong}, Score=${result.score}`
      );
      if (result.isStrong) allWeak = false;
    }

    console.log(`\n  Testing strong password:`);
    const strongResult = passwordEncryption.validatePasswordStrength(strongPassword);
    console.log(
      `    "${strongPassword}": Strong=${strongResult.isStrong}, Score=${strongResult.score}`
    );

    if (allWeak && strongResult.isStrong) {
      console.log('  ✅ PASS: Password strength validation works');
      passCount++;
    } else {
      console.log('  ❌ FAIL: Password strength validation failed');
      failCount++;
    }
  } catch (error) {
    console.log(`  ❌ FAIL: ${error.message}`);
    failCount++;
  }

  // Test 11: Utility functions - isEncryptedPassword
  console.log('\n\n📝 Test 11: Utility - isEncryptedPassword');
  console.log('─'.repeat(60));
  try {
    const encrypted = passwordEncryption.encryptPassword('TestPassword123');
    const notEncrypted = 'NotEncryptedString';

    const isEnc1 = passwordEncryption.isEncryptedPassword(encrypted);
    const isEnc2 = passwordEncryption.isEncryptedPassword(notEncrypted);

    console.log(`  Encrypted string: ${isEnc1}`);
    console.log(`  Plain string: ${isEnc2}`);

    if (isEnc1 && !isEnc2) {
      console.log('  ✅ PASS: isEncryptedPassword utility works');
      passCount++;
    } else {
      console.log('  ❌ FAIL: isEncryptedPassword utility failed');
      failCount++;
    }
  } catch (error) {
    console.log(`  ❌ FAIL: ${error.message}`);
    failCount++;
  }

  // Test 12: Utility functions - isBcryptHash
  console.log('\n\n📝 Test 12: Utility - isBcryptHash');
  console.log('─'.repeat(60));
  try {
    const hashed = await passwordEncryption.hashPassword('TestPassword123');
    const notHashed = 'NotABcryptHash';

    const isHash1 = passwordEncryption.isBcryptHash(hashed);
    const isHash2 = passwordEncryption.isBcryptHash(notHashed);

    console.log(`  Bcrypt hash: ${isHash1}`);
    console.log(`  Plain string: ${isHash2}`);

    if (isHash1 && !isHash2) {
      console.log('  ✅ PASS: isBcryptHash utility works');
      passCount++;
    } else {
      console.log('  ❌ FAIL: isBcryptHash utility failed');
      failCount++;
    }
  } catch (error) {
    console.log(`  ❌ FAIL: ${error.message}`);
    failCount++;
  }

  // Summary
  console.log('\n\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`  ✅ Passed: ${passCount}`);
  console.log(`  ❌ Failed: ${failCount}`);
  console.log(`  📈 Total:  ${passCount + failCount}`);
  console.log(`  ⭐ Success Rate: ${((passCount / (passCount + failCount)) * 100).toFixed(1)}%`);
  console.log('='.repeat(60) + '\n');

  if (failCount === 0) {
    console.log('🎉 ALL TESTS PASSED! Encryption system is working correctly.\n');
  } else {
    console.log('⚠️  Some tests failed. Please check the errors above.\n');
  }
}

// Run tests
runAllTests().catch(console.error);
