const crypto = require('crypto');
const forge = require('node-forge');

/**
 * Servicio gestión certificados digitales
 * 
 * ⚠️ PRODUCCIÓN: Usar HSM (AWS CloudHSM, Google KMS)
 */

class CertificateService {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.encryptionKey = this.getEncryptionKey();
  }

  getEncryptionKey() {
    const key = process.env.ENCRYPTION_KEY || 'default-key-change-in-production-32b';
    const buffer = Buffer.from(key.padEnd(32, '0').substring(0, 32));
    return buffer;
  }

  /**
   * Cifra certificado PKCS#12
   */
  encryptCertificate(certificateBuffer, password) {
    try {
      // Validar certificado
      this.validateCertificate(certificateBuffer, password);

      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);
      
      const encrypted = Buffer.concat([
        cipher.update(certificateBuffer),
        cipher.final()
      ]);

      const authTag = cipher.getAuthTag();
      const combined = Buffer.concat([iv, authTag, encrypted]);

      return combined.toString('base64');
    } catch (error) {
      console.error('Error cifrando certificado:', error);
      throw error;
    }
  }

  /**
   * Descifra certificado
   */
  decryptCertificate(encryptedBase64) {
    try {
      const combined = Buffer.from(encryptedBase64, 'base64');
      const iv = combined.slice(0, 16);
      const authTag = combined.slice(16, 32);
      const encrypted = combined.slice(32);

      const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv);
      decipher.setAuthTag(authTag);

      return Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
      ]);
    } catch (error) {
      console.error('Error descifrando certificado:', error);
      throw new Error('Error al descifrar certificado');
    }
  }

  /**
   * Cifra contraseña
   */
  encryptPassword(password) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);
    
    const encrypted = Buffer.concat([
      cipher.update(password, 'utf8'),
      cipher.final()
    ]);

    const authTag = cipher.getAuthTag();
    return Buffer.concat([iv, authTag, encrypted]).toString('base64');
  }

  /**
   * Descifra contraseña
   */
  decryptPassword(encryptedBase64) {
    const combined = Buffer.from(encryptedBase64, 'base64');
    const iv = combined.slice(0, 16);
    const authTag = combined.slice(16, 32);
    const encrypted = combined.slice(32);

    const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv);
    decipher.setAuthTag(authTag);

    return decipher.update(encrypted, null, 'utf8') + decipher.final('utf8');
  }

  /**
   * Valida certificado PKCS#12
   */
  validateCertificate(certificateBuffer, password) {
    try {
      const p12Der = certificateBuffer.toString('binary');
      const p12Asn1 = forge.asn1.fromDer(p12Der);
      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);

      const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
      const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });

      if (!certBags[forge.pki.oids.certBag] || !certBags[forge.pki.oids.certBag].length) {
        throw new Error('No se encontró certificado');
      }

      if (!keyBags[forge.pki.oids.pkcs8ShroudedKeyBag] || !keyBags[forge.pki.oids.pkcs8ShroudedKeyBag].length) {
        throw new Error('No se encontró clave privada');
      }

      const cert = certBags[forge.pki.oids.certBag][0].cert;
      const now = new Date();

      if (now < cert.validity.notBefore) {
        throw new Error('Certificado aún no válido');
      }
      if (now > cert.validity.notAfter) {
        throw new Error('Certificado expirado');
      }

      return {
        validFrom: cert.validity.notBefore,
        validTo: cert.validity.notAfter,
        subject: cert.subject.attributes.reduce((acc, attr) => {
          acc[attr.name] = attr.value;
          return acc;
        }, {})
      };
    } catch (error) {
      if (error.message.includes('Invalid password')) {
        throw new Error('Contraseña incorrecta');
      }
      throw error;
    }
  }

  /**
   * Verifica si certificado próximo a expirar (30 días)
   */
  isExpiringSoon(expirationDate) {
    const days = Math.ceil((new Date(expirationDate) - new Date()) / (1000 * 60 * 60 * 24));
    return days <= 30 && days > 0;
  }

  /**
   * Verifica si expirado
   */
  isExpired(expirationDate) {
    return new Date(expirationDate) < new Date();
  }
}

module.exports = new CertificateService();
