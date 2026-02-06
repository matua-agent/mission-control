import { NextResponse } from "next/server";
import { searchRecords } from "@/data/search-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") ?? "").trim().toLowerCase();

  if (!query) {
    return NextResponse.json([]);
  }

  const results = searchRecords.filter((record) => {
    return (
      record.title.toLowerCase().includes(query) ||
      record.content.toLowerCase().includes(query)
    );
  });

  return NextResponse.json(results);
}
