from cryptography.fernet import Fernet
from app.core.settings import settings

# Initialize cipher suite using the server's encryption key
cipher_suite = Fernet(settings.ENCRYPTION_KEY.encode())

def encrypt_secret(secret: str) -> str:
    """Encrypt a secret string using AES-256 Fernet."""
    if not secret:
        return ""
    return cipher_suite.encrypt(secret.encode()).decode()

def decrypt_secret(encrypted_secret: str) -> str:
    """Decrypt an encrypted secret string using AES-256 Fernet."""
    if not encrypted_secret:
        return ""
    return cipher_suite.decrypt(encrypted_secret.encode()).decode()
