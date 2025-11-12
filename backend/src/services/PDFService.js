const puppeteer = require('puppeteer');
const DataStandardizationService = require('./DataStandardizationService');

class PDFService {
  static async generateInvoicePDF(invoice, settings, verifactuRecord = null) {
    const html = this.generateHTML(invoice, settings, verifactuRecord);

    const browser = await puppeteer.launch({
      headless: 'new',
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdf = await page.pdf({
      format: 'A4',
      margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' }
    });

    await browser.close();

    return pdf;
  }

  static generateHTML(invoice, settings, verifactuRecord = null) {
    const formatPrice = (price) => DataStandardizationService.formatPrice(price);
    const formatDate = (date) => new Date(date).toLocaleDateString('es-ES');
    
    // Obtener datos cliente (desde relación o campos manuales)
    const customerName = invoice.customer?.name || invoice.customerName || 'Cliente';
    const customerNif = invoice.customer?.nif || invoice.customerNif || '';
    const customerEmail = invoice.customer?.email || '';
    const customerPhone = invoice.customer?.phone || '';
    const customerAddress = invoice.customer?.address || invoice.customerAddress || '';
    const customerCity = invoice.customer?.city || '';
    const customerPostalCode = invoice.customer?.postalCode || '';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: Arial, sans-serif; 
      font-size: 12px;
      line-height: 1.6;
    }
    .container { padding: 20px; }
    .header { 
      display: flex; 
      justify-content: space-between;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid #0066cc;
    }
    .company-info { flex: 1; }
    .company-name { 
      font-size: 24px; 
      font-weight: bold;
      color: #0066cc;
      margin-bottom: 10px;
    }
    .invoice-info { text-align: right; }
    .invoice-number { 
      font-size: 20px;
      font-weight: bold;
      color: #333;
    }
    .parties {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
    }
    .party {
      width: 48%;
      padding: 15px;
      background: #f5f5f5;
      border-radius: 5px;
    }
    .party-title {
      font-weight: bold;
      font-size: 14px;
      margin-bottom: 10px;
      color: #0066cc;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th {
      background: #0066cc;
      color: white;
      padding: 10px;
      text-align: left;
      font-weight: bold;
    }
    td {
      padding: 10px;
      border-bottom: 1px solid #ddd;
    }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .totals {
      margin-left: auto;
      width: 300px;
      margin-top: 20px;
    }
    .totals table {
      margin-bottom: 0;
    }
    .totals td {
      border: none;
      padding: 5px 10px;
    }
    .total-row {
      font-weight: bold;
      font-size: 16px;
      background: #f0f0f0;
    }
    .notes {
      margin-top: 30px;
      padding: 15px;
      background: #fffbf0;
      border-left: 4px solid #ffc107;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      text-align: center;
      color: #666;
      font-size: 10px;
    }
    .verifactu-section {
      margin-top: 30px;
      padding: 20px;
      background: #f8f9fa;
      border: 2px solid #28a745;
      border-radius: 8px;
    }
    .verifactu-header {
      display: flex;
      align-items: center;
      margin-bottom: 15px;
    }
    .verifactu-status {
      background: #28a745;
      color: white;
      padding: 5px 15px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: bold;
      margin-right: 15px;
    }
    .verifactu-title {
      font-size: 16px;
      font-weight: bold;
      color: #28a745;
    }
    .verifactu-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 20px;
    }
    .verifactu-item {
      background: white;
      padding: 10px;
      border-radius: 5px;
      border-left: 4px solid #28a745;
    }
    .verifactu-label {
      font-size: 10px;
      color: #666;
      text-transform: uppercase;
      margin-bottom: 5px;
    }
    .verifactu-value {
      font-size: 12px;
      font-weight: bold;
      word-break: break-all;
    }
    .qr-container {
      text-align: center;
      margin-top: 20px;
    }
    .qr-code {
      max-width: 150px;
      border: 2px solid #28a745;
      border-radius: 8px;
    }
    .qr-label {
      font-size: 10px;
      color: #666;
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="company-info">
        <div class="company-name">${settings?.companyName || 'Mi Empresa'}</div>
        ${settings?.companyNif ? `<div>NIF: ${settings.companyNif}</div>` : ''}
        ${settings?.companyAddress ? `<div>${settings.companyAddress}</div>` : ''}
      </div>
      <div class="invoice-info">
        <div class="invoice-number">FACTURA</div>
        <div><strong>${invoice.fullNumber}</strong></div>
        <div>Fecha: ${formatDate(invoice.date)}</div>
      </div>
    </div>

    <div class="parties">
      <div class="party">
        <div class="party-title">CLIENTE</div>
        <div><strong>${customerName}</strong></div>
        ${customerNif ? `<div>NIF: ${customerNif}</div>` : ''}
        ${customerAddress ? `<div>${customerAddress}</div>` : ''}
        ${customerCity ? `<div>${customerCity} ${customerPostalCode}</div>` : ''}
        ${customerEmail ? `<div>${customerEmail}</div>` : ''}
        ${customerPhone ? `<div>${customerPhone}</div>` : ''}
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Descripción</th>
          <th class="text-center" width="80">Cantidad</th>
          <th class="text-right" width="100">Precio</th>
          <th class="text-center" width="60">IVA</th>
          <th class="text-right" width="120">Total</th>
        </tr>
      </thead>
      <tbody>
        ${invoice.lines.map(line => `
          <tr>
            <td>${line.description}</td>
            <td class="text-center">${parseFloat(line.quantity)}</td>
            <td class="text-right">${formatPrice(line.price)}</td>
            <td class="text-center">${line.ivaRate}%</td>
            <td class="text-right">${formatPrice(line.total)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="totals">
      <table>
        <tr>
          <td><strong>Subtotal:</strong></td>
          <td class="text-right">${formatPrice(invoice.subtotal)}</td>
        </tr>
        <tr>
          <td><strong>IVA:</strong></td>
          <td class="text-right">${formatPrice(invoice.totalIva)}</td>
        </tr>
        <tr class="total-row">
          <td><strong>TOTAL:</strong></td>
          <td class="text-right">${formatPrice(invoice.total)}</td>
        </tr>
      </table>
    </div>

    ${invoice.notes ? `
      <div class="notes">
        <strong>Notas:</strong><br>
        ${invoice.notes}
      </div>
    ` : ''}

    ${verifactuRecord && verifactuRecord.status === 'accepted' ? `
      <div class="verifactu-section">
        <div class="verifactu-header">
          <div class="verifactu-status">✓ VERIFICADA</div>
          <div class="verifactu-title">Verifactu - AEAT</div>
        </div>
        
        <div class="verifactu-info">
          <div class="verifactu-item">
            <div class="verifactu-label">CSV Verificación</div>
            <div class="verifactu-value">${verifactuRecord.aeatCsv || 'N/A'}</div>
          </div>
          <div class="verifactu-item">
            <div class="verifactu-label">Hash Factura</div>
            <div class="verifactu-value">${verifactuRecord.hash ? verifactuRecord.hash.substring(0, 16) + '...' : 'N/A'}</div>
          </div>
          <div class="verifactu-item">
            <div class="verifactu-label">Fecha Envío</div>
            <div class="verifactu-value">${verifactuRecord.sentAt ? formatDate(verifactuRecord.sentAt) : 'N/A'}</div>
          </div>
          <div class="verifactu-item">
            <div class="verifactu-label">Estado AEAT</div>
            <div class="verifactu-value">Aceptada</div>
          </div>
        </div>
        
        ${verifactuRecord.qrCode ? `
          <div class="qr-container">
            <img src="${verifactuRecord.qrCode}" alt="QR Verifactu" class="qr-code" />
            <div class="qr-label">Escanea para verificar en AEAT</div>
          </div>
        ` : ''}
      </div>
    ` : ''}

    <div class="footer">
      Generado el ${new Date().toLocaleDateString('es-ES')}
      ${verifactuRecord && verifactuRecord.status === 'accepted' ? ' • Verificada por AEAT' : ''}
    </div>
  </div>
</body>
</html>
    `;
  }
}

module.exports = PDFService;

