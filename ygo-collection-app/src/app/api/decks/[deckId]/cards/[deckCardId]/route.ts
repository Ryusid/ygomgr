import { NextResponse } from "next/server";
import { fetchFromBackend } from "@/lib/api";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ deckCardId: string }> }
) {
  const { deckCardId } = await context.params;
  const body = await request.json();
  const response = await fetchFromBackend(`/api/decks/cards/${deckCardId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ deckCardId: string }> }
) {
  const { deckCardId } = await context.params;
  const response = await fetchFromBackend(`/api/decks/cards/${deckCardId}`, {
    method: "DELETE",
  });
  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
