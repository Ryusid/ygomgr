import { NextResponse } from "next/server";
import { fetchFromBackend } from "@/lib/api";

export async function POST(
  request: Request,
  context: { params: Promise<{ deckId: string }> }
) {
  const { deckId } = await context.params;
  const body = await request.json();
  const response = await fetchFromBackend(`/api/decks/${deckId}/cards`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
