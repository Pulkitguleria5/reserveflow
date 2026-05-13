import pool from "./db";

export async function cleanupExpiredReservations() {

  const client = await pool.connect();

  try {

    await client.query("BEGIN");

    const expiredReservations =
      await client.query(
        `
        SELECT *
        FROM reservations
        WHERE status = 'pending'
        AND expires_at < NOW()
        FOR UPDATE
        `
      );

    for (const reservation of expiredReservations.rows) {

      const inventoryResult =
        await client.query(
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
        SET reserved_stock =
          reserved_stock - $1
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
        [reservation.id]
      );
    }

    await client.query("COMMIT");

  } catch (error) {

    await client.query("ROLLBACK");

    console.log(error);

  } finally {

    client.release();

  }
}