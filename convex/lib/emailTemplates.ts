interface InviteEmailArgs {
  inviterName: string;
  namespaceName: string;
  role: "editor" | "viewer";
  acceptUrl: string;
  appUrl: string;
}

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildInviteEmailHtml(args: InviteEmailArgs): string {
  const inviter = escapeHtml(args.inviterName);
  const namespace = escapeHtml(args.namespaceName);
  const role = args.role === "editor" ? "Editor" : "Viewer";
  const url = escapeHtml(args.acceptUrl);
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>You're invited to ${namespace}</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
<style>
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap');
</style>
</head>
<body style="margin:0;padding:0;background-color:#F5F4F1;font-family:'Outfit',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

<!-- Outer wrapper -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F5F4F1;">
<tr><td align="center" style="padding:40px 20px;">

  <!-- Card -->
  <table role="presentation" width="520" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;width:100%;background:#FFFFFF;border-radius:16px;box-shadow:0 2px 12px rgba(26,25,24,0.03);">
  <tr><td style="padding:40px 40px 0 40px;">

    <!-- Logo row -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td align="center" style="padding-bottom:24px;">
      <a href="${escapeHtml(args.appUrl)}" target="_blank" rel="noopener noreferrer" style="font-size:24px;font-weight:700;color:#1A1918;letter-spacing:-0.5px;text-decoration:none;">QRni</a>
    </td></tr>
    </table>

    <!-- Divider -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td style="border-top:1px solid #E5E4E1;padding-bottom:24px;"></td></tr>
    </table>

    <!-- Icon circle -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td align="center" style="padding-bottom:12px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
      <tr><td width="64" height="64" align="center" valign="middle" style="width:64px;height:64px;background-color:#C8F0D8;border-radius:50%;font-size:24px;font-weight:700;color:#3D8A5A;">
        +
      </td></tr>
      </table>
    </td></tr>
    </table>

    <!-- Heading -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td align="center" style="padding-bottom:12px;">
      <h1 style="margin:0;font-size:26px;font-weight:600;color:#1A1918;letter-spacing:-0.5px;">You're invited!</h1>
    </td></tr>
    </table>

    <!-- Subtitle -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td align="center" style="padding-bottom:20px;">
      <p style="margin:0;font-size:15px;color:#6D6C6A;line-height:1.5;">${inviter} invited you to collaborate on</p>
    </td></tr>
    </table>

    <!-- Namespace + role (single row, wraps on small screens) -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td align="center" style="padding-bottom:28px;font-size:0;">
      <span style="display:inline-block;padding:12px 24px;margin:4px;background:#FAFAF8;border:1px solid #E5E4E1;border-radius:12px;font-size:18px;font-weight:600;color:#1A1918;vertical-align:middle;">${namespace}</span><!--
      --><span style="display:inline-block;vertical-align:middle;margin:4px 0 4px 8px;white-space:nowrap;"><span style="font-size:14px;color:#9C9B99;vertical-align:middle;">as</span> <span style="display:inline-block;padding:6px 16px;margin-left:10px;background:#C8F0D8;color:#3D8A5A;font-size:13px;font-weight:600;border-radius:100px;vertical-align:middle;">${role}</span></span>
    </td></tr>
    </table>

    <!-- CTA Button -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td align="center" style="padding-bottom:24px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr><td align="center" bgcolor="#3D8A5A" style="background:#3D8A5A;border-radius:12px;">
        <a href="${url}" target="_blank" style="display:block;padding:14px 24px;font-size:16px;font-weight:600;color:#FFFFFF;text-decoration:none;letter-spacing:-0.2px;">Accept Invitation</a>
      </td></tr>
      </table>
    </td></tr>
    </table>

    <!-- Expiry notice -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td align="center" style="padding-bottom:24px;">
      <p style="margin:0;font-size:12px;color:#9C9B99;">This invitation expires in 7 days.</p>
    </td></tr>
    </table>

    <!-- Divider -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td style="border-top:1px solid #E5E4E1;padding-bottom:24px;"></td></tr>
    </table>

    <!-- Ignore notice -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td align="center" style="padding-bottom:40px;">
      <p style="margin:0;font-size:12px;color:#9C9B99;line-height:1.5;">If you didn't expect this invitation, you can safely ignore this email.</p>
    </td></tr>
    </table>

  </td></tr>
  </table>
  <!-- End card -->

  <!-- Bottom footer (outside card) -->
  <table role="presentation" width="520" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;width:100%;">
  <tr><td align="center" style="padding:16px 0 0 0;">
    <p style="margin:0 0 10px 0;font-size:12px;color:#9C9B99;">&copy; <a href="${escapeHtml(args.appUrl)}" target="_blank" rel="noopener noreferrer" style="color:#9C9B99;text-decoration:none;">QRni</a> ${year}. All rights reserved.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;"><tr><td style="font-size:11px;color:#9C9B99;vertical-align:middle;padding-right:6px;">Powered by</td><td style="vertical-align:middle;"><a href="https://imbensantos.com" target="_blank" rel="noopener noreferrer" style="text-decoration:none;"><img src="${escapeHtml(args.appUrl)}/imbento-logo-email.png" alt="Imbento" height="36" style="height:36px;width:auto;display:block;" /></a></td></tr></table>
  </td></tr>
  </table>

</td></tr>
</table>

</body>
</html>`;
}
