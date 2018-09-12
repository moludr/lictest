/**
 * encrypt and decryption using crypto
 * Author : Linto thomas
 * Created : 28-Mar-18
 * https://nodejs.org/api/crypto.html#crypto_class_cipher
 */
import * as crypto from 'crypto';

const password = "password";
const alg = 'aes192';

export function encrypt(data) {
    console.log("*** crypto.encrypt");
    let enSMSInfo = JSON.stringify(data);
    let cipher = crypto.createCipher(alg, password);
    let encrypted = cipher.update(enSMSInfo, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}

export function decrypt(data) {
    console.log("*** crypto.decrypt ");
    let decipher = crypto.createDecipher(alg, password);
    let decrypted = decipher.update(data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
}