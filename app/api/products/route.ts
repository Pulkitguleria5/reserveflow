import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { cleanupExpiredReservations }
from "@/lib/cleanupExpiredReservations";

export async function GET() {
  try {
    await cleanupExpiredReservations();
    
    const result = await pool.query(`
      SELECT
        products.id AS product_id,
        warehouses.id AS warehouse_id,
        products.name AS product_name,
        warehouses.name AS warehouse_name,
        inventory.total_stock,
        inventory.reserved_stock,
        (
          inventory.total_stock - inventory.reserved_stock
        ) AS available_stock
      FROM inventory
      JOIN products
        ON inventory.product_id = products.id
      JOIN warehouses
        ON inventory.warehouse_id = warehouses.id
    `);

    return NextResponse.json(result.rows);

  } catch (error) {
    console.log(error);

    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}