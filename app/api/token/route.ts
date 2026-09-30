import { NextRequest, NextResponse } from "next/server";
import { criarToken } from "@/lib/livekit";
import { validarCodigo } from "@/lib/validar-codigo";

export async function POST(req: NextRequest) {
  const { room, username } = await req.json();

  if (!room || !username) {
    return NextResponse.json(
      { error: "Nome e código da sala são obrigatórios" },
      { status: 400 }
    );
  }

  if (!validarCodigo(room)) {
    return NextResponse.json(
      { error: "Código da sala inválido" },
      { status: 400 }
    );
  }

  const name = String(username).trim().slice(0, 30);
  if (!name) {
    return NextResponse.json({ error: "Nome inválido" }, { status: 400 });
  }

  const token = await criarToken(room.toUpperCase(), name);

  return NextResponse.json({ token, url: process.env.LIVEKIT_URL });
}
