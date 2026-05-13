import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(
  request: NextRequest,
  context: any
) {

  const client = await pool.connect();

  try {

   const params = await context.params;
   const reservationId = params.id;

    await client.query("BEGIN");

    const reservationResult = await client.query(
      `
      SELECT *
      FROM reservations
      WHERE id = $1
      FOR UPDATE
      `,
      [reservationId]
    );

    if (reservationResult.rows.length === 0) {

      await client.query("ROLLBACK");

      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 }
      );
    }

    const reservation =
      reservationResult.rows[0];

    if (reservation.status !== "pending") {

      await client.query("ROLLBACK");

      return NextResponse.json(
        { error: "Reservation already processed" },
        { status: 400 }
      );
    }

    const inventoryResult = await client.query(
      `
      SELECT *
      FROM inventory
      WHERE product_id = $1
      AND warehouse_id = $2
      FOR UPDATE
      `,
      [
        reservation.product_id,
        reservation.warehouse_id,
      ]
    );

    const inventory =
      inventoryResult.rows[0];

    await client.query(
      `
      UPDATE inventory
      SET reserved_stock = reserved_stock - $1
      WHERE id = $2
      `,
      [
        reservation.quantity,
        inventory.id,
      ]
    );

    await client.query(
      `
      UPDATE reservations
      SET status = 'released'
      WHERE id = $1
      `,
      [reservationId]
    );

    await client.query("COMMIT");

    return NextResponse.json({
      success: true,
      message: "Reservation released",
    });

  } catch (error) {

    await client.query("ROLLBACK");

    console.log(error);

    return NextResponse.json(
      { error: "Release failed" },
      { status: 500 }
    );

  } finally {

    client.release();

  }
}