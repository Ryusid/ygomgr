import { NextResponse } from "next/server";
import { fetchFromBackend } from "@/lib/api";

export async function GET(
  request: Request,
  context: { params: Promise<{ deckId: string }> }
) {
  const { deckId } = await context.params;
  const response = await fetchFromBackend(`/api/decks/${deckId}`);
  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ deckId: string }> }
) {
  const { deckId } = await context.params;
  const body = await request.json();
  const response = await fetchFromBackend(`/api/decks/${deckId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ deckId: string }> }
) {
  const { deckId } = await context.params;
  const response = await fetchFromBackend(`/api/decks/${deckId}`, {
    method: "DELETE",
  });
  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
