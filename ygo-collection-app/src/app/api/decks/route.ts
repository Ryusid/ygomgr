import { NextResponse } from "next/server";
import { fetchFromBackend } from "@/lib/api";

export async function GET() {
  const response = await fetchFromBackend("/api/decks");
  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}

export async function POST(request: Request) {
  const body = await request.json();
  const response = await fetchFromBackend("/api/decks", {
    method: "POST",
    body: JSON.stringify(body),
  });
  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
