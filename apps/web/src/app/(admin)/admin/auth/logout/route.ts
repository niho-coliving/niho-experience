import { NextResponse } from "next/server";
import { adminJson, adminMutationAllowed, clearAdminSessionCookie } from "@/lib/admin/server";

export async function POST(request: Request) {
  if (!adminMutationAllowed(request)) return adminJson({ error: "forbidden" }, 403);
  const response = new NextResponse(null, { status: 303, headers: { location: "/admin", "cache-control": "private, no-store" } });
  clearAdminSessionCookie(response);
  return response;
}

