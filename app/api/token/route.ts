import { NextRequest, NextResponse } from "next/server";
import { criarToken } from "@/lib/livekit";
import { tokenRequestSchema } from "@/lib/schemas";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = tokenRequestSchema.safeParse(body);

  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Dados inválidos";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { room, username } = parsed.data;
  const token = await criarToken(room, username);

  return NextResponse.json({ token, url: process.env.LIVEKIT_URL });
}
