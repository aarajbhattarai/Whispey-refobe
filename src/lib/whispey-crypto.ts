// src/lib/whispey-crypto.ts
import crypto from 'crypto'

// Get encryption key from environment variable
const WHISPEY_MASTER_KEY = process.env.WHISPEY_MASTER_KEY

if (!WHISPEY_MASTER_KEY) {
  throw new Error('WHISPEY_MASTER_KEY environment variable is required')
}

// Generate the encryption key using scrypt (same approach as existing crypto.ts)
const key = crypto.scryptSync(WHISPEY_MASTER_KEY, 'whispey_salt', 32)

/**
 * Encrypts a string using AES-256-GCM with WHISPEY_MASTER_KEY
 * @param text - The text to encrypt
 * @returns The encrypted text with IV and auth tag (format: iv:authTag:encryptedData)
 */
export function encryptWithRefobeKey(text: string): string {
  try {
    // Generate a random initialization vector
    const iv = crypto.randomBytes(16)
    
    // Create cipher
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
    
    // Encrypt the text
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    // Get the authentication tag
    const authTag = cipher.getAuthTag()
    
    // Combine IV, auth tag, and encrypted data
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
  } catch (error) {
    console.error('❌ Refobe encryption error:', error)
    throw new Error('Failed to encrypt data with Refobe master key')
  }
}

/**
 * Decrypts a string that was encrypted with encryptWithRefobeKey
 * @param encryptedText - The encrypted text (format: iv:authTag:encryptedData)
 * @returns The decrypted plain text
 */
export function decryptWithRefobeKey(encryptedText: string): string {
  try {
    // Split the encrypted text into its components
    const parts = encryptedText.split(':')
    
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted text format')
    }
    
    const [ivHex, authTagHex, encrypted] = parts
    
    // Convert hex strings back to buffers
    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')
    
    // Create decipher
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
    decipher.setAuthTag(authTag)
    
    // Decrypt the text
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  } catch (error) {
    console.error('❌ Refobe decryption error:', error)
    throw new Error('Failed to decrypt data with Refobe master key - invalid key or corrupted data')
  }
}
