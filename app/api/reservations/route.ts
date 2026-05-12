import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(request: NextRequest) {

  const client = await pool.connect();

  try {

    const body = await request.json();

    const {
      productId,
      warehouseId,
      quantity,
    } = body;

    await client.query("BEGIN");

    const inventoryResult = await client.query(
      `
      SELECT *
      FROM inventory
      WHERE product_id = $1
      AND warehouse_id = $2
      FOR UPDATE
      `,
      [productId, warehouseId]
    );

    if (inventoryResult.rows.length === 0) {

      await client.query("ROLLBACK");

      return NextResponse.json(
        { error: "Inventory not found" },
        { status: 404 }
      );
    }

    const inventory = inventoryResult.rows[0];

    const availableStock =
      inventory.total_stock -
      inventory.reserved_stock;

    if (availableStock < quantity) {

      await client.query("ROLLBACK");

      return NextResponse.json(
        { error: "Not enough stock available" },
        { status: 409 }
      );
    }

    await client.query(
      `
      UPDATE inventory
      SET reserved_stock = reserved_stock + $1
      WHERE id = $2
      `,
      [quantity, inventory.id]
    );

    const expiresAt = new Date(
      Date.now() + 10 * 60 * 1000
    );

    const reservationResult = await client.query(
      `
      INSERT INTO reservations (
        product_id,
        warehouse_id,
        quantity,
        status,
        expires_at
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [
        productId,
        warehouseId,
        quantity,
        "pending",
        expiresAt,
      ]
    );

    await client.query("COMMIT");

    return NextResponse.json({
      success: true,
      reservation: reservationResult.rows[0],
    });

  } catch (error) {

    await client.query("ROLLBACK");

    console.log(error);

    return NextResponse.json(
      { error: "Reservation failed" },
      { status: 500 }
    );

  } finally {

    client.release();

  }
}