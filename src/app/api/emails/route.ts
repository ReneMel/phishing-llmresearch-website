import { NextResponse } from "next/server";
// import { Pool} from "pg";
import pool from "@/lib/db";


export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sampleId = searchParams.get("sampleId");

  if (!sampleId) {
    return NextResponse.json({ error: "sampleId parameter is required" }, { status: 400 });
  }

  try {
    const query = `
      SELECT id, sample_id, "text", llama_shap_explanation, llama_lime_explanation,
      llama_combined_explanation, llama_raw_explanation
      FROM email
      WHERE sample_id = $1
    `;
    const result = await pool.query(query, [sampleId]);
    return NextResponse.json(result.rows);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });  
  }
}
  