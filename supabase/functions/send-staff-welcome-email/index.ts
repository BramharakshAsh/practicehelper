import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import nodemailer from "npm:nodemailer@6.9.16";

const GMAIL_USER = Deno.env.get('GMAIL_USER')
const GMAIL_APP_PASSWORD = Deno.env.get('GMAIL_APP_PASSWORD')

interface WelcomeEmailRequest {
  email: string
  name: string
  password: string
  firmName: string
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    })
  }

  try {
    const { email, name, password, firmName }: WelcomeEmailRequest = await req.json()

    console.log(`[WelcomeEmail] Sending to ${email} via Gmail SMTP`)

    if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
      throw new Error("Missing GMAIL_USER or GMAIL_APP_PASSWORD environment variables");
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: GMAIL_USER,
        pass: GMAIL_APP_PASSWORD,
      },
    });

    const mailOptions = {
      from: `"Firm Flow" <${GMAIL_USER}>`,
      to: email,
      subject: `Welcome to ${firmName} - Your Firm Flow Account`,
      html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .credentials { background: white; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; }
              .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #6b7280; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Welcome to Firm Flow!</h1>
              </div>
              <div class="content">
                <p>Hi ${name},</p>
                <p>Welcome to <strong>${firmName}</strong>! Your Firm Flow account has been created.</p>
                
                <div class="credentials">
                  <h3>Your Login Credentials:</h3>
                  <p><strong>Email:</strong> ${email}</p>
                  <p><strong>Temporary Password:</strong> ${password}</p>
                </div>

                <p><strong>⚠️ Important:</strong> Please change your password after your first login for security.</p>

                <a href="https://firmflow.app/login" class="button">Login to Your Account</a>

                <p>If you have any questions or need assistance, please don't hesitate to reach out to your team lead.</p>

                <p>Best regards,<br><strong>The Firm Flow Team</strong></p>
              </div>
              <div class="footer">
                <p>This is an automated message. Please do not reply to this email.</p>
              </div>
            </div>
          </body>
          </html>
        `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('[WelcomeEmail] Email sent successfully:', info.messageId);
    transporter.close();

    return new Response(
      JSON.stringify({ success: true, messageId: info.messageId }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  } catch (error) {
    console.error('[WelcomeEmail] Error:', error)
    return new Response(
      JSON.stringify({ error: error.message || error.toString() }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }
})
