import { NextResponse } from "next/server";
import  pool  from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { location, it_helped, comment, rating } = body;

    // Inserción en la tabla survey
    const result = await pool.query(
      `INSERT INTO survey (location, it_helped, comment, rating) 
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [location || 'Unknown', it_helped ?? false, comment || '', rating || null]
    );

    // return NextResponse.json({ surveyId: result.rows[0].id });
    return NextResponse.json(result.rows[0]);

  } catch (error) {
    console.error("Error inserting survey:", error);
    return NextResponse.json(
      { error: "Error inserting survey" },
      { status: 500 }
    );
  }
}
