const crypto = require('crypto');
const forge = require('node-forge');
const axios = require('axios');
const QRCode = require('qrcode');

/**
 * Servicio Verifactu - Firma digital y envío AEAT
 */

class VerifactuService {
  constructor() {
    this.endpoint = process.env.VERIFACTU_ENDPOINT || 'https://prewww1.aeat.es/wlpl/TIKE-CONT-WS/SuministroFacturas';
    this.environment = process.env.VERIFACTU_ENVIRONMENT || 'test';
  }

  /**
   * Genera hash HMAC-SHA256 para cadena facturas
   */
  generateInvoiceHash(invoiceData, previousHash = '') {
    const data = [
      invoiceData.fullNumber,
      invoiceData.date,
      invoiceData.total.toFixed(2),
      invoiceData.customerNif || '',
      previousHash
    ].join('|');

    const secret = process.env.VERIFACTU_HASH_SECRET || 'default-secret-change-in-production';
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
  }

  /**
   * Genera XML Verifactu según esquema AEAT
   */
  generateVerifactuXML(invoice, tenant, hash, previousHash) {
    const customerName = invoice.customer?.name || invoice.customerName || 'Cliente';
    const customerNif = invoice.customer?.nif || invoice.customerNif || '';

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<FacturaVerifactu xmlns="https://www2.agenciatributaria.gob.es/static_files/common/internet/dep/aplicaciones/es/aeat/tike/cont/ws/FacturaVerifactu.xsd">
  <Cabecera>
    <ObligadoEmision>
      <NIF>${this.escapeXML(tenant.nif)}</NIF>
      <Nombre>${this.escapeXML(tenant.name)}</Nombre>
    </ObligadoEmision>
    <FacturaExpedida>
      <NumeroFactura>${this.escapeXML(invoice.fullNumber)}</NumeroFactura>
      <SerieFactura>${this.escapeXML(invoice.series)}</SerieFactura>
      <FechaExpedicion>${this.formatDate(invoice.date)}</FechaExpedicion>
      <Hora>${this.formatTime(new Date())}</Hora>
    </FacturaExpedida>
  </Cabecera>
  <Sujetos>
    <Destinatario>
      <NIF>${this.escapeXML(customerNif)}</NIF>
      <Nombre>${this.escapeXML(customerName)}</Nombre>
    </Destinatario>
  </Sujetos>
  <Desglose>
    ${this.generateIVABreakdownXML(invoice.lines)}
  </Desglose>
  <ImporteTotal>${parseFloat(invoice.total).toFixed(2)}</ImporteTotal>
  <Huella>
    <Hash>${hash}</Hash>
    <HashAnterior>${previousHash || ''}</HashAnterior>
  </Huella>
</FacturaVerifactu>`;

    return xml;
  }

  /**
   * Genera desglose IVA en XML
   */
  generateIVABreakdownXML(lines) {
    // Agrupar por tasa IVA
    const ivaGroups = {};
    
    lines.forEach(line => {
      const rate = parseFloat(line.ivaRate);
      const base = parseFloat(line.quantity) * parseFloat(line.price);
      const iva = base * (rate / 100);
      
      if (!ivaGroups[rate]) {
        ivaGroups[rate] = { base: 0, iva: 0 };
      }
      ivaGroups[rate].base += base;
      ivaGroups[rate].iva += iva;
    });

    return Object.entries(ivaGroups)
      .map(([rate, data]) => `
    <DetalleIVA>
      <TipoImpositivo>${rate}</TipoImpositivo>
      <BaseImponible>${data.base.toFixed(2)}</BaseImponible>
      <CuotaIVA>${data.iva.toFixed(2)}</CuotaIVA>
    </DetalleIVA>`)
      .join('');
  }

  /**
   * Firma XML con certificado digital (XAdES-BES simplificado)
   */
  async signXML(xml, certificateEncrypted, certificatePassword, CertificateService) {
    try {
      // Descifrar certificado
      const certBuffer = CertificateService.decryptCertificate(certificateEncrypted);
      const password = CertificateService.decryptPassword(certificatePassword);

      // Decodificar PKCS#12
      const p12Der = certBuffer.toString('binary');
      const p12Asn1 = forge.asn1.fromDer(p12Der);
      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);

      // Extraer certificado y clave privada
      const certBag = p12.getBags({ bagType: forge.pki.oids.certBag })[forge.pki.oids.certBag][0];
      const cert = certBag.cert;

      const keyBag = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })[forge.pki.oids.pkcs8ShroudedKeyBag][0];
      const privateKey = keyBag.key;

      // Generar firma
      const md = forge.md.sha256.create();
      md.update(xml, 'utf8');
      const signature = privateKey.sign(md);
      const signatureB64 = forge.util.encode64(signature);

      // XML firmado (XAdES-BES básico)
      const signedXML = xml.replace('</FacturaVerifactu>', `
  <Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
    <SignedInfo>
      <CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
      <SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"/>
      <Reference URI="">
        <Transforms>
          <Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/>
        </Transforms>
        <DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
        <DigestValue>${forge.util.encode64(md.digest().bytes())}</DigestValue>
      </Reference>
    </SignedInfo>
    <SignatureValue>${signatureB64}</SignatureValue>
    <KeyInfo>
      <X509Data>
        <X509Certificate>${forge.util.encode64(forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes())}</X509Certificate>
      </X509Data>
    </KeyInfo>
  </Signature>
</FacturaVerifactu>`);

      return signedXML;
    } catch (error) {
      console.error('Error firmando XML:', error);
      throw new Error('Error al firmar factura digitalmente');
    }
  }

  /**
   * Envía factura firmada a AEAT
   */
  async sendToAEAT(signedXML) {
    try {
      if (this.environment === 'test') {
        // Mock para desarrollo
        console.log('🧪 MODO TEST: Simulando envío AEAT');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return {
          success: true,
          code: 'TEST_ACCEPTED',
          message: 'Factura aceptada (modo test)',
          csv: `TEST${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          timestamp: new Date().toISOString()
        };
      }

      // Envío real AEAT
      const response = await axios.post(
        this.endpoint,
        signedXML,
        {
          headers: {
            'Content-Type': 'application/xml; charset=UTF-8',
            'SOAPAction': 'SuministroFacturas'
          },
          timeout: 30000
        }
      );

      return this.parseAEATResponse(response.data);
    } catch (error) {
      console.error('Error enviando a AEAT:', error);
      
      return {
        success: false,
        code: error.response?.status || 'ERROR',
        message: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Parsea respuesta AEAT
   */
  parseAEATResponse(xmlResponse) {
    const success = xmlResponse.includes('<Estado>Aceptada</Estado>') || 
                    xmlResponse.includes('<CodigoEstadoRegistro>0</CodigoEstadoRegistro>');
    
    const csvMatch = xmlResponse.match(/<CSV>(.*?)<\/CSV>/);
    const errorMatch = xmlResponse.match(/<DescripcionErrorRegistro>(.*?)<\/DescripcionErrorRegistro>/);

    return {
      success,
      code: success ? 'ACCEPTED' : 'REJECTED',
      message: errorMatch ? errorMatch[1] : (success ? 'Aceptada' : 'Rechazada'),
      csv: csvMatch ? csvMatch[1] : null,
      timestamp: new Date().toISOString(),
      rawResponse: xmlResponse
    };
  }

  /**
   * Genera código QR Verifactu
   */
  async generateQRCode(invoice, tenant, verifactuRecord) {
    const customerNif = invoice.customer?.nif || invoice.customerNif || '';
    
    const qrData = {
      nif: tenant.nif,
      numero: invoice.fullNumber,
      fecha: this.formatDate(invoice.date),
      importe: parseFloat(invoice.total).toFixed(2),
      hash: verifactuRecord.hash.substring(0, 16),
      csv: verifactuRecord.aeatCsv || 'PENDING'
    };

    const qrString = Object.entries(qrData)
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join('&');

    const url = `https://verifactu.agenciatributaria.gob.es/verify?${qrString}`;
    
    return await QRCode.toDataURL(url);
  }

  /**
   * Helpers
   */
  formatDate(date) {
    return new Date(date).toISOString().split('T')[0];
  }

  formatTime(date) {
    return new Date(date).toISOString().split('T')[1].split('.')[0];
  }

  escapeXML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

module.exports = new VerifactuService();
