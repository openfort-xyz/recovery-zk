declare const google: {
  accounts: {
    id: {
      initialize(config: {
        client_id: string;
        callback: (response: { credential: string }) => void;
      }): void;
      renderButton(
        element: HTMLElement,
        config: { theme: string; size: string }
      ): void;
    };
  };
};

function base64UrlDecode(str: string): string {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  return atob(padded);
}

function decodeJwt(token: string) {
  const parts = token.split(".");
  const header = JSON.parse(base64UrlDecode(parts[0]));
  const payload = JSON.parse(base64UrlDecode(parts[1]));
  return { header, payload };
}

function handleCredential(response: { credential: string }) {
  const output = document.getElementById("output")!;
  const jwt = response.credential;
  const { header, payload } = decodeJwt(jwt);

  output.innerHTML = `
    <div class="label">Raw JWT</div>
    <pre>${jwt}</pre>

    <div class="label">Header</div>
    <pre>${JSON.stringify(header, null, 2)}</pre>

    <div class="label">Payload</div>
    <pre>${JSON.stringify(payload, null, 2)}</pre>

    <div class="label">Key Claims</div>
    <pre>email:          ${payload.email}
email_verified: ${payload.email_verified}
sub:            ${payload.sub}
iss:            ${payload.iss}
aud:            ${payload.aud}
iat:            ${new Date(payload.iat * 1000).toISOString()}
exp:            ${new Date(payload.exp * 1000).toISOString()}</pre>
  `;
}

document.getElementById("init-btn")!.addEventListener("click", () => {
  const clientId = (
    document.getElementById("client-id") as HTMLInputElement
  ).value.trim();

  if (!clientId) {
    alert("Enter a Google OAuth Client ID");
    return;
  }

  google.accounts.id.initialize({
    client_id: clientId,
    callback: handleCredential,
  });

  google.accounts.id.renderButton(document.getElementById("signin-btn")!, {
    theme: "outline",
    size: "large",
  });
});
