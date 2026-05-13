import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(
  request: NextRequest,
  context: any
) {

  try {

    const params = await context.params;
    const reservationId = params.id;
    

    const result = await pool.query(
      `
      SELECT *
      FROM reservations
      WHERE id = $1
      `,
      [reservationId]
    );

    if (result.rows.length === 0) {

      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      result.rows[0]
    );

  } catch (error) {

    console.log(error);

    return NextResponse.json(
      { error: "Failed to fetch reservation" },
      { status: 500 }
    );
  }
}