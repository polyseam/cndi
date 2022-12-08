import CryptoJS from 'npm:crypto-js@4.1.1';

export default function decrypt(encryptedText: string, secret: string) {
    const decryptedString = CryptoJS.AES.decrypt(encryptedText, secret).toString(CryptoJS.enc.Utf8)
    return decryptedString
}