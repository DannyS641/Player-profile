import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const resendApiKey = Deno.env.get("RESEND_API_KEY");
const hookSecret = Deno.env.get("SEND_EMAIL_HOOK_SECRET");
const senderEmail = Deno.env.get("SENDER_EMAIL") ?? "onboarding@resend.dev";
const senderName = Deno.env.get("SENDER_NAME") ?? "Adrenale Player Profile";

type EmailData = {
  token: string;
  token_hash: string;
  redirect_to: string;
  email_action_type: string;
  site_url: string;
  token_new: string;
  token_hash_new: string;
};

type WebhookPayload = {
  user: { email: string };
  email_data: EmailData;
};

type Template = {
  subject: string;
  heading: string;
  intro: string;
  buttonLabel: string;
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

const hookError = (message: string, status = 500) =>
  jsonResponse({ error: { http_code: status, message } }, status);

const buildVerifyUrl = (data: EmailData) => {
  const params = new URLSearchParams({
    token: data.token_hash,
    type: data.email_action_type,
    redirect_to: data.redirect_to,
  });
  return `${supabaseUrl}/auth/v1/verify?${params.toString()}`;
};

const templateFor = (actionType: string): Template => {
  switch (actionType) {
    case "signup":
      return {
        subject: "Confirm your Adrenale account",
        heading: "Confirm your email",
        intro:
          "Welcome to Adrenale Player Profile. Confirm your email address to activate your account and start your player profile.",
        buttonLabel: "Confirm email",
      };
    case "recovery":
      return {
        subject: "Reset your Adrenale password",
        heading: "Reset your password",
        intro:
          "We received a request to reset your password. Click the button below to choose a new one. If you did not request this, you can ignore this email.",
        buttonLabel: "Reset password",
      };
    case "magiclink":
      return {
        subject: "Your Adrenale sign-in link",
        heading: "Sign in to Adrenale",
        intro: "Click the button below to sign in to your account.",
        buttonLabel: "Sign in",
      };
    case "invite":
      return {
        subject: "You have been invited to Adrenale",
        heading: "Accept your invite",
        intro:
          "You have been invited to join Adrenale Player Profile. Click the button below to set up your account.",
        buttonLabel: "Accept invite",
      };
    case "email_change":
    case "email_change_new":
      return {
        subject: "Confirm your new Adrenale email",
        heading: "Confirm your email change",
        intro:
          "Click the button below to confirm this address as your new account email.",
        buttonLabel: "Confirm new email",
      };
    default:
      return {
        subject: "Action required for your Adrenale account",
        heading: "Confirm this request",
        intro: "Click the button below to continue.",
        buttonLabel: "Continue",
      };
  }
};

const renderEmail = (template: Template, verifyUrl: string) => `
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f4f1ea;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1ea;padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #e7e1d6;">
            <tr>
              <td style="background:#0b1b2b;padding:24px 32px;">
                <span style="color:#ffffff;font-size:18px;font-weight:bold;">Adrenale Player Profile</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 12px;color:#0b1b2b;font-size:22px;">${template.heading}</h1>
                <p style="margin:0 0 24px;color:#52606d;font-size:14px;line-height:1.6;">${template.intro}</p>
                <a href="${verifyUrl}" style="display:inline-block;background:#f05d23;color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;padding:12px 28px;border-radius:14px;">${template.buttonLabel}</a>
                <p style="margin:24px 0 0;color:#8a94a0;font-size:12px;line-height:1.6;">If the button does not work, copy and paste this link into your browser:<br /><a href="${verifyUrl}" style="color:#f05d23;word-break:break-all;">${verifyUrl}</a></p>
              </td>
            </tr>
          </table>
          <p style="margin:16px 0 0;color:#8a94a0;font-size:11px;">This link expires shortly for your security.</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("OK", { status: 200 });
  }

  if (!resendApiKey || !hookSecret || !supabaseUrl) {
    return hookError(
      "Missing RESEND_API_KEY, SEND_EMAIL_HOOK_SECRET, or SUPABASE_URL.",
    );
  }

  const rawBody = await req.text();
  const headers = Object.fromEntries(req.headers);

  let payload: WebhookPayload;
  try {
    const secret = hookSecret.startsWith("v1,")
      ? hookSecret.slice(3)
      : hookSecret;
    const wh = new Webhook(secret);
    payload = wh.verify(rawBody, headers) as WebhookPayload;
  } catch {
    return hookError("Invalid webhook signature.", 401);
  }

  const { user, email_data } = payload;
  const template = templateFor(email_data.email_action_type);
  const verifyUrl = buildVerifyUrl(email_data);

  const res = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: `${senderName} <${senderEmail}>`,
      to: [user.email],
      subject: template.subject,
      html: renderEmail(template, verifyUrl),
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    return hookError(`Resend failed (${res.status}): ${detail}`);
  }

  return jsonResponse({});
});
