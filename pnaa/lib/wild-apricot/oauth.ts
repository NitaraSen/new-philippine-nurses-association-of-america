const WA_DOMAIN = process.env.WILD_APRICOT_DOMAIN || "";
const WA_CLIENT_ID = process.env.WILD_APRICOT_CLIENT_ID || "";
const WA_CLIENT_SECRET = process.env.WILD_APRICOT_CLIENT_SECRET || "";
const WA_ACCOUNT_ID = process.env.WILD_APRICOT_ACCOUNT_ID || "";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export function getAuthorizationUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: WA_CLIENT_ID,
    redirect_uri: `${APP_URL}/api/auth/callback`,
    scope: "auto",
    response_type: "authorization_code",
    state,
  });
  return `https://${WA_DOMAIN}/sys/login/OAuthLogin?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}> {
  const credentials = Buffer.from(`${WA_CLIENT_ID}:${WA_CLIENT_SECRET}`).toString("base64");

  const response = await fetch("https://oauth.wildapricot.org/auth/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: `${APP_URL}/api/auth/callback`,
      scope: "auto",
    }),
  });

  if (!response.ok) {
    throw new Error(`WA token exchange failed: ${response.statusText}`);
  }

  return response.json();
}

export async function getContactInfo(
  accessToken: string
): Promise<WAContact> {
  const response = await fetch(
    `https://api.wildapricot.org/v2/accounts/${WA_ACCOUNT_ID}/contacts/me`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`WA contact fetch failed: ${response.statusText}`);
  }

  return response.json();
}

export async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const credentials = Buffer.from(`${WA_CLIENT_ID}:${WA_CLIENT_SECRET}`).toString("base64");

  const response = await fetch("https://oauth.wildapricot.org/auth/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error(`WA token refresh failed: ${response.statusText}`);
  }

  return response.json();
}

export async function getClientCredentialsToken(): Promise<string> {
  const credentials = Buffer.from(`${WA_CLIENT_ID}:${WA_CLIENT_SECRET}`).toString("base64");

  const response = await fetch("https://oauth.wildapricot.org/auth/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      scope: "auto",
    }),
  });

  if (!response.ok) {
    throw new Error(`WA client credentials failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}

// Wild Apricot contact type
export interface WAContact {
  Id: number;
  FirstName: string;
  LastName: string;
  Email: string;
  DisplayName: string;
  MembershipLevel?: {
    Id: number;
    Name: string;
  };
  FieldValues: Array<{
    FieldName: string;
    Value: unknown;
    SystemCode?: string;
  }>;
}

export function extractFieldValue(
  contact: WAContact,
  fieldName: string
): string {
  const field = contact.FieldValues.find((f) => f.FieldName === fieldName);
  if (!field || field.Value === null || field.Value === undefined) return "";
  if (typeof field.Value === "object" && "Label" in (field.Value as Record<string, unknown>)) {
    return (field.Value as { Label: string }).Label;
  }
  return String(field.Value);
}
