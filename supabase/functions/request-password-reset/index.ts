import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import nodemailer from "npm:nodemailer@6.9.16";

const GMAIL_USER = Deno.env.get('GMAIL_USER')
const GMAIL_APP_PASSWORD = Deno.env.get('GMAIL_APP_PASSWORD')
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

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
        const { email } = await req.json()

        if (!email) {
            throw new Error("Email is required");
        }

        console.log(`[PasswordReset] Request for ${email}`)

        if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
            throw new Error("Missing GMAIL_USER or GMAIL_APP_PASSWORD environment variables");
        }

        // Initialize Supabase Admin Client
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // Generate Recovery Link
        // redirectTo should match your app's reset password page
        const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
            type: 'recovery',
            email: email,
            options: {
                redirectTo: 'https://firmflow.app/reset-password' // Fallback to firmflow.app but normally it should be dynamic
            }
        })

        if (linkError) {
            console.error('[PasswordReset] Error generating link:', linkError)
            throw linkError
        }

        const recoveryUrl = linkData.properties.action_link;

        // Create Transporter
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
            subject: `Reset Your Firm Flow Password`,
            html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #6b7280; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Password Reset Request</h1>
              </div>
              <div class="content">
                <p>Hello,</p>
                <p>We received a request to reset your password for your Firm Flow account. Click the button below to proceed:</p>
                
                <div style="text-align: center;">
                  <a href="${recoveryUrl}" class="button">Reset Password</a>
                </div>

                <p>This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.</p>

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
        console.log('[PasswordReset] Email sent successfully:', info.messageId);
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
        console.error('[PasswordReset] Error:', error)
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
