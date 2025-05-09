import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const result = await pool.query(`SELECT MAX(sample_id) AS max_sample_id FROM email`);
    const maxSampleId = result.rows[0].max_sample_id;
    return NextResponse.json({ maxSampleId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });  
  }
}
