import { NextResponse } from "next/server";
import { fetchFromBackend } from "@/lib/api";

export async function GET() {
  const response = await fetchFromBackend("/api/needed-cards");
  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
