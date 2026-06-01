export type KeyDerivationMode = 'passphrase' | 'keyfile' | 'system-keychain'

export interface EncryptionConfig {
  enabled: boolean
  keyDerivation: KeyDerivationMode
  passphrase?: string
  keyfilePath?: string
  kdfIterations?: number
}
