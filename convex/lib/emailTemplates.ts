interface InviteEmailArgs {
  inviterName: string;
  namespaceName: string;
  role: "editor" | "viewer";
  acceptUrl: string;
}

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function capitalizeRole(role: "editor" | "viewer"): string {
  return role === "editor" ? "Editor" : "Viewer";
}

export function buildInviteEmailHtml(args: InviteEmailArgs): string {
  const { inviterName, namespaceName, role, acceptUrl } = args;

  const safeInviterName = escapeHtml(inviterName);
  const safeNamespaceName = escapeHtml(namespaceName);
  const safeAcceptUrl = escapeHtml(acceptUrl);
  const safeRole = capitalizeRole(role);
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You've been invited to ${safeNamespaceName} on QRni</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap');

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: #F5F4F1;
      font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #2C2C2C;
      padding: 40px 20px;
    }

    .wrapper {
      max-width: 560px;
      margin: 0 auto;
    }

    .logo {
      text-align: center;
      margin-bottom: 24px;
      font-size: 22px;
      font-weight: 700;
      color: #3D8A5A;
      letter-spacing: -0.5px;
    }

    .card {
      background: #FFFFFF;
      border-radius: 16px;
      padding: 40px 36px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
    }

    .icon-wrap {
      width: 56px;
      height: 56px;
      background: #C8F0D8;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
    }

    .heading {
      font-size: 22px;
      font-weight: 700;
      color: #1A1A1A;
      text-align: center;
      margin-bottom: 12px;
    }

    .subtext {
      font-size: 15px;
      color: #555555;
      text-align: center;
      line-height: 1.6;
      margin-bottom: 28px;
    }

    .namespace-badge {
      display: flex;
      align-items: center;
      gap: 10px;
      background: #F5F4F1;
      border-radius: 10px;
      padding: 14px 16px;
      margin-bottom: 28px;
    }

    .namespace-badge .folder-icon {
      flex-shrink: 0;
    }

    .namespace-badge .details {
      flex: 1;
    }

    .namespace-badge .ns-name {
      font-size: 15px;
      font-weight: 600;
      color: #1A1A1A;
    }

    .namespace-badge .role-badge {
      display: inline-block;
      margin-top: 4px;
      padding: 2px 10px;
      background: #C8F0D8;
      color: #3D8A5A;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }

    .cta-btn {
      display: block;
      width: 100%;
      padding: 14px;
      background: #3D8A5A;
      color: #FFFFFF !important;
      text-decoration: none;
      text-align: center;
      border-radius: 10px;
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 24px;
    }

    .expiry-notice {
      font-size: 13px;
      color: #888888;
      text-align: center;
      margin-bottom: 20px;
    }

    .ignore-notice {
      font-size: 13px;
      color: #AAAAAA;
      text-align: center;
      line-height: 1.5;
    }

    .footer {
      text-align: center;
      margin-top: 28px;
      font-size: 12px;
      color: #AAAAAA;
      line-height: 1.8;
    }

    .footer a {
      color: #888888;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="logo">QRni</div>

    <div class="card">
      <!-- User-plus icon in green circle -->
      <div class="icon-wrap">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 11C17.66 11 18.99 9.66 18.99 8C18.99 6.34 17.66 5 16 5C14.34 5 13 6.34 13 8C13 9.66 14.34 11 16 11ZM8 11C9.66 11 10.99 9.66 10.99 8C10.99 6.34 9.66 5 8 5C6.34 5 5 6.34 5 8C5 9.66 6.34 11 8 11ZM8 13C5.67 13 1 14.17 1 16.5V19H15V16.5C15 14.17 10.33 13 8 13ZM16 13C15.71 13 15.38 13.02 15.03 13.05C16.19 13.89 17 15.02 17 16.5V19H23V16.5C23 14.17 18.33 13 16 13Z" fill="#3D8A5A"/>
        </svg>
      </div>

      <h1 class="heading">You&rsquo;ve been invited!</h1>

      <p class="subtext">
        <strong>${safeInviterName}</strong> has invited you to collaborate on a namespace in QRni.
      </p>

      <!-- Namespace badge with folder icon -->
      <div class="namespace-badge">
        <div class="folder-icon">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="8" fill="#FAE8DC"/>
            <path d="M7 11C7 9.895 7.895 9 9 9H13.586C13.851 9 14.105 9.105 14.293 9.293L15.707 10.707C15.895 10.895 16.149 11 16.414 11H23C24.105 11 25 11.895 25 13V22C25 23.105 24.105 24 23 24H9C7.895 24 7 23.105 7 22V11Z" fill="#D89575"/>
          </svg>
        </div>
        <div class="details">
          <div class="ns-name">${safeNamespaceName}</div>
          <span class="role-badge">${safeRole}</span>
        </div>
      </div>

      <a href="${safeAcceptUrl}" class="cta-btn">Accept Invitation</a>

      <p class="expiry-notice">This invitation expires in 7 days.</p>

      <p class="ignore-notice">If you didn&rsquo;t expect this invitation, you can safely ignore this email.</p>
    </div>

    <div class="footer">
      <p>&copy; QRni ${year}. All rights reserved.</p>
      <p>Powered by <a href="https://imbensantos.com" target="_blank" rel="noopener noreferrer">Imbento</a></p>
    </div>
  </div>
</body>
</html>`;
}
