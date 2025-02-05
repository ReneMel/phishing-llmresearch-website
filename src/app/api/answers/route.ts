// src/app/api/answers/route.ts
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(request: Request) {
  const { survey_id, email_id, type_explanation, is_phishing } =
    await request.json();

  if (!survey_id || !email_id || !type_explanation) {
    return NextResponse.json(
      { error: "Missing answer data" },
      { status: 400 }
    );
  }

  try {
    const result = await pool.query(
      `INSERT INTO answers (survey_id, email_id, type_explanation, is_phishing)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [survey_id, email_id, type_explanation, is_phishing]
    );
    return NextResponse.json({ answerId: result.rows[0].id });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
