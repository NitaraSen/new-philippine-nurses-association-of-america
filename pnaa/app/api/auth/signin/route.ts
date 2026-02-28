import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAuthorizationUrl } from "@/lib/wild-apricot/oauth";

export async function GET() {
  const state = crypto.randomUUID();

  const cookieStore = await cookies();
  cookieStore.set("wa_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10, // 10 minutes
    path: "/",
  });

  const authUrl = getAuthorizationUrl(state);
  return NextResponse.redirect(authUrl);
}
