import { NextResponse } from "next/server";
import { Pool } from "pg";

// Configuración de conexión a la base de datos
const pool = new Pool({
  user: "root",
  host: "localhost",
  database: "phishingllm",
  password: "root",
  port: 5432,
});

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
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}
