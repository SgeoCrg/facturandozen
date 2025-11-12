const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.transporter = null;
    this.isProduction = process.env.NODE_ENV === 'production';
    this.emailEnabled = process.env.EMAIL_ENABLED === 'true';
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@app.com';
    this.fromName = process.env.EMAIL_FROM_NAME || 'Sistema Facturación';
    
    this.init();
  }

  init() {
    if (!this.emailEnabled) {
      logger.info('Email deshabilitado (EMAIL_ENABLED=false)');
      return;
    }

    // Configuración SMTP
    const emailProvider = process.env.EMAIL_PROVIDER || 'gmail';

    try {
      if (emailProvider === 'gmail') {
        // Gmail SMTP
        this.transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD // App Password
          }
        });
      } else if (emailProvider === 'sendgrid') {
        // SendGrid SMTP
        this.transporter = nodemailer.createTransport({
          host: 'smtp.sendgrid.net',
          port: 587,
          auth: {
            user: 'apikey',
            pass: process.env.SENDGRID_API_KEY
          }
        });
      } else if (emailProvider === 'smtp') {
        // SMTP genérico
        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD
          }
        });
      } else if (emailProvider === 'facturandozen') {
        // SMTP específico para Facturando Zen
        this.transporter = nodemailer.createTransport({
          host: 'mail.facturandozen.com',
          port: 465,
          secure: true, // Puerto 465 requiere SSL
          auth: {
            user: 'info@facturandozen.com',
            pass: process.env.EMAIL_PASSWORD
          },
          tls: {
            rejectUnauthorized: false // Para certificados auto-firmados si es necesario
          }
        });
      } else {
        // Mock para desarrollo
        this.transporter = nodemailer.createTransport({
          host: 'localhost',
          port: 1025,
          ignoreTLS: true
        });
      }

      logger.info(`Email service initialized: ${emailProvider}`);
    } catch (error) {
      logger.error('Error initializing email service', { error: error.message });
    }
  }

  async send(to, subject, html, text) {
    if (!this.emailEnabled) {
      logger.info('Email mock (disabled)', { to, subject });
      return { success: true, mock: true };
    }

    try {
      const mailOptions = {
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to,
        subject,
        html,
        text: text || this.stripHtml(html)
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      logger.info('Email sent', { 
        to, 
        subject, 
        messageId: info.messageId 
      });

      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error('Error sending email', { 
        to, 
        subject, 
        error: error.message 
      });
      return { success: false, error: error.message };
    }
  }

  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '');
  }

  // ========== TEMPLATES ==========

  async sendWelcome(user, tenant, credentials) {
    const subject = '🎉 Bienvenido a tu cuenta de facturación';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #0000FF 0%, #0000CC 100%); 
                    color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; }
          .credentials { background: white; padding: 20px; border-radius: 5px; 
                        border-left: 4px solid #0000FF; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 30px; background: #0000FF; 
                    color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>¡Bienvenido a tu cuenta!</h1>
          </div>
          <div class="content">
            <p>Hola <strong>${user.name}</strong>,</p>
            
            <p>Tu cuenta ha sido creada exitosamente. Aquí están tus credenciales de acceso:</p>
            
            <div class="credentials">
              <p><strong>🏢 Empresa:</strong> ${tenant.name}</p>
              <p><strong>📧 Email:</strong> ${user.email}</p>
              ${credentials?.password ? `<p><strong>🔑 Contraseña:</strong> ${credentials.password}</p>` : ''}
              <p><strong>🔗 URL:</strong> <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}">${process.env.FRONTEND_URL || 'http://localhost:3000'}</a></p>
            </div>

            <p><strong>📘 Primeros pasos:</strong></p>
            <ol>
              <li>Entra con tus credenciales</li>
              <li>Ve a <strong>Configuración → Empresa</strong> para completar tus datos fiscales</li>
              <li>Añade 2-3 clientes habituales (opcional)</li>
              <li>Crea tu primera factura</li>
            </ol>

            <p>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" class="button">
                Acceder ahora
              </a>
            </p>

            <p>Si tienes dudas, responde este email.</p>
            
            <p>¡Gracias por unirte!</p>
          </div>
          <div class="footer">
            <p>Este email fue enviado automáticamente. Por favor no respondas.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.send(user.email, subject, html);
  }

  async sendPasswordReset(user, resetToken) {
    const subject = '🔑 Recuperación de contraseña';
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #0000FF; 
                    color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .warning { background: #fff3cd; padding: 15px; border-radius: 5px; 
                     border-left: 4px solid #ffc107; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="content">
            <h2>Recuperación de contraseña</h2>
            
            <p>Hola <strong>${user.name}</strong>,</p>
            
            <p>Recibimos una solicitud para restablecer tu contraseña.</p>
            
            <p>
              <a href="${resetUrl}" class="button">
                Restablecer contraseña
              </a>
            </p>

            <p>O copia este enlace en tu navegador:</p>
            <p style="word-break: break-all; color: #666;">${resetUrl}</p>

            <div class="warning">
              <strong>⚠️ Este enlace expira en 1 hora.</strong><br>
              Si no solicitaste este cambio, ignora este email.
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.send(user.email, subject, html);
  }

  async sendTrialExpiring(tenant, subscription, daysLeft) {
    const admin = await require('../models').User.findOne({
      where: { tenantId: tenant.id, role: 'admin' }
    });

    if (!admin) return;

    const subject = `⏰ Tu prueba expira en ${daysLeft} días`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #0000FF; 
                    color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .alert { background: #fff3cd; padding: 20px; border-radius: 5px; 
                   border-left: 4px solid #ffc107; margin: 20px 0; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="content">
            <h2>Tu prueba está por terminar</h2>
            
            <p>Hola ${admin.name},</p>
            
            <div class="alert">
              <h3 style="margin: 0;">⏰ ${daysLeft} días restantes</h3>
              <p>Tu periodo de prueba termina el ${new Date(subscription.trialEndsAt).toLocaleDateString('es-ES')}</p>
            </div>

            <p>¿Quieres continuar usando la plataforma?</p>
            
            <p>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/app/settings" class="button">
                Actualizar plan
              </a>
            </p>

            <p><strong>Planes disponibles:</strong></p>
            <ul>
              <li>BASIC: 19€/mes - Hasta 50 facturas/mes</li>
              <li>PRO: 49€/mes - Facturas ilimitadas + Verifactu</li>
            </ul>

            <p>Si tienes dudas, responde este email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.send(admin.email, subject, html);
  }

  async sendInvoiceCreated(invoice, customer, tenant) {
    const admin = await require('../models').User.findOne({
      where: { tenantId: tenant.id, role: 'admin' }
    });

    if (!admin) return;

    const subject = `✅ Factura ${invoice.number} creada`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 10px; }
          .invoice-box { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="content">
            <h2>✅ Nueva factura creada</h2>
            
            <div class="invoice-box">
              <p><strong>Número:</strong> ${invoice.number}</p>
              <p><strong>Cliente:</strong> ${customer?.name || 'Sin cliente'}</p>
              <p><strong>Total:</strong> ${parseFloat(invoice.total).toFixed(2)} €</p>
              <p><strong>Fecha:</strong> ${new Date(invoice.date).toLocaleDateString('es-ES')}</p>
            </div>

            <p>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/app/invoices/${invoice.id}" 
                 style="display: inline-block; padding: 12px 30px; background: #0000FF; 
                        color: white; text-decoration: none; border-radius: 5px;">
                Ver factura
              </a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.send(admin.email, subject, html);
  }

  async sendUserInvitation(user, tenant, tempPassword) {
    const subject = '🎉 Invitación a unirte al equipo';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #0000FF 0%, #0000CC 100%); 
                    color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; }
          .credentials { background: white; padding: 20px; border-radius: 5px; 
                        border-left: 4px solid #0000FF; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 30px; background: #0000FF; 
                    color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .warning { background: #fff3cd; padding: 15px; border-radius: 5px; 
                     border-left: 4px solid #ffc107; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>¡Te han invitado!</h1>
          </div>
          <div class="content">
            <p>Hola <strong>${user.name}</strong>,</p>
            
            <p>Has sido invitado a unirte al equipo de <strong>${tenant.name}</strong> en nuestra plataforma de facturación.</p>
            
            <div class="credentials">
              <p><strong>🏢 Empresa:</strong> ${tenant.name}</p>
              <p><strong>📧 Email:</strong> ${user.email}</p>
              <p><strong>🔑 Contraseña temporal:</strong> ${tempPassword}</p>
              <p><strong>🔗 URL:</strong> <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}">${process.env.FRONTEND_URL || 'http://localhost:3000'}</a></p>
            </div>

            <div class="warning">
              <strong>⚠️ Importante:</strong> Esta es una contraseña temporal. 
              Te recomendamos cambiarla en tu primer acceso por seguridad.
            </div>

            <p><strong>📘 Primeros pasos:</strong></p>
            <ol>
              <li>Entra con tus credenciales</li>
              <li>Cambia tu contraseña temporal</li>
              <li>Explora las funcionalidades disponibles</li>
              <li>Contacta con tu administrador si tienes dudas</li>
            </ol>

            <p>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" class="button">
                Acceder ahora
              </a>
            </p>

            <p>Si tienes dudas, contacta con el administrador de tu empresa.</p>
            
            <p>¡Bienvenido al equipo!</p>
          </div>
          <div class="footer">
            <p>Este email fue enviado automáticamente. Por favor no respondas.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.send(user.email, subject, html);
  }

  async sendPaymentFailed(tenant, subscription) {
    const admin = await require('../models').User.findOne({
      where: { tenantId: tenant.id, role: 'admin' }
    });

    if (!admin) return;

    const subject = '❌ Error en el pago de tu suscripción';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 10px; }
          .alert-danger { background: #f8d7da; padding: 20px; border-radius: 5px; 
                          border-left: 4px solid #dc3545; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 30px; background: #dc3545; 
                    color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="content">
            <h2>Error en el pago</h2>
            
            <div class="alert-danger">
              <strong>❌ No pudimos procesar tu pago</strong><br>
              Tu suscripción será suspendida si no actualizas tu método de pago.
            </div>

            <p>Hola ${admin.name},</p>
            
            <p>Intentamos cobrar tu suscripción pero el pago falló.</p>

            <p><strong>Posibles razones:</strong></p>
            <ul>
              <li>Tarjeta expirada</li>
              <li>Fondos insuficientes</li>
              <li>Tarjeta bloqueada</li>
            </ul>

            <p>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/app/settings" class="button">
                Actualizar método de pago
              </a>
            </p>

            <p>Si tienes dudas, contacta soporte.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.send(admin.email, subject, html);
  }
}

module.exports = new EmailService();



