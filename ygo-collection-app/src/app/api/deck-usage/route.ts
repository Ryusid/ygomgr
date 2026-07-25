import { NextResponse } from "next/server";
import { fetchFromBackend } from "@/lib/api";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const response = await fetchFromBackend(`/api/deck-usage?${searchParams.toString()}`);
  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
