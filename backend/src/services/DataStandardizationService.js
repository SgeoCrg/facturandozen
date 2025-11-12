/**
 * Servicio de estandarización y validación de datos
 */

class DataStandardizationService {
  /**
   * Normaliza NIF/CIF
   */
  static normalizeNIF(nif) {
    if (!nif) throw new Error('NIF/CIF requerido');
    const cleaned = String(nif).toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!/^[A-Z0-9]{9}$/.test(cleaned)) {
      throw new Error('NIF/CIF formato inválido (9 caracteres)');
    }
    return cleaned;
  }

  /**
   * Valida NIF/CIF español (algoritmo oficial)
   */
  static validateNIF(nif) {
    const cleaned = this.normalizeNIF(nif);
    
    // DNI/NIE
    if (/^[0-9]{8}[A-Z]$/.test(cleaned) || /^[XYZ][0-9]{7}[A-Z]$/.test(cleaned)) {
      return this.validateDNI(cleaned);
    }
    
    // CIF
    if (/^[ABCDEFGHJNPQRSUVW][0-9]{7}[0-9A-J]$/.test(cleaned)) {
      return this.validateCIF(cleaned);
    }
    
    return false;
  }

  /**
   * Valida DNI/NIE
   */
  static validateDNI(dni) {
    const letters = 'TRWAGMYFPDXBNJZSQVHLCKE';
    let number = dni.substr(0, 8);
    
    // NIE conversion
    if (/^[XYZ]/.test(dni)) {
      number = dni.replace('X', '0').replace('Y', '1').replace('Z', '2').substr(0, 8);
    }
    
    const letterCalc = letters.charAt(parseInt(number) % 23);
    return letterCalc === dni.charAt(8);
  }

  /**
   * Valida CIF
   */
  static validateCIF(cif) {
    const numbers = cif.substr(1, 7);
    const control = cif.charAt(8);
    
    let sum = 0;
    for (let i = 0; i < 7; i++) {
      const digit = parseInt(numbers.charAt(i));
      if (i % 2 === 0) {
        const doubled = digit * 2;
        sum += doubled > 9 ? doubled - 9 : doubled;
      } else {
        sum += digit;
      }
    }
    
    const unitDigit = (10 - (sum % 10)) % 10;
    const controlLetter = 'JABCDEFGHI'.charAt(unitDigit);
    
    return control === String(unitDigit) || control === controlLetter;
  }

  /**
   * Normaliza precio
   */
  static normalizePrice(price) {
    const num = parseFloat(price);
    if (isNaN(num)) throw new Error('Precio inválido');
    if (num < 0) throw new Error('El precio no puede ser negativo');
    return Math.round(num * 100) / 100;
  }

  /**
   * Valida tasa IVA (0, 4, 10, 21)
   */
  static validateIVARate(rate) {
    const num = parseFloat(rate);
    const validRates = [0, 4, 10, 21];
    if (!validRates.includes(num)) {
      throw new Error('Tasa IVA debe ser 0, 4, 10 o 21');
    }
    return num;
  }

  /**
   * Calcula totales de factura
   */
  static calculateInvoiceTotals(lines) {
    let subtotal = 0;
    let totalIVA = 0;

    lines.forEach(line => {
      const lineTotal = this.normalizePrice(line.quantity * line.price);
      const lineIVA = this.normalizePrice(lineTotal * (line.ivaRate / 100));
      subtotal += lineTotal;
      totalIVA += lineIVA;
    });

    return {
      subtotal: this.normalizePrice(subtotal),
      totalIVA: this.normalizePrice(totalIVA),
      total: this.normalizePrice(subtotal + totalIVA)
    };
  }

  /**
   * Formatea número de factura
   */
  static formatInvoiceNumber(series, number, year) {
    const paddedNumber = String(number).padStart(6, '0');
    return `${series}${year}/${paddedNumber}`;
  }

  /**
   * Formatea precio para mostrar
   */
  static formatPrice(price) {
    const num = this.normalizePrice(price);
    return `${num.toFixed(2)} €`;
  }
}

module.exports = DataStandardizationService;
