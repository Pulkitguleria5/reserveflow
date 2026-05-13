"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {

  const [products, setProducts] = useState([]);

  const router = useRouter();

  async function fetchProducts() {

    const response = await fetch(
      "/api/products"
    );

    const data = await response.json();

    setProducts(data);
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  async function reserveProduct(
    productId: number,
    warehouseId: number
  ) {

    const response = await fetch(
      "/api/reservations",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          warehouseId,
          quantity: 1,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {

      alert(data.error);

      return;
    }

    router.push(
      `/reservation/${data.reservation.id}`
    );
  }

  return (
    <div className="p-10">

      <h1 className="text-3xl font-bold mb-6">
        Products
      </h1>

      <div className="space-y-4">

        {products.map((product: any) => (

          <div
            key={`${product.product_id}-${product.warehouse_name}`}
            className="border p-4 rounded-lg"
          >

            <h2 className="text-xl font-semibold">
              {product.product_name}
            </h2>

            <p>
              Warehouse:
              {" "}
              {product.warehouse_name}
            </p>

            <p>
              Available Stock:
              {" "}
              {product.available_stock}
            </p>

            <button
              onClick={() =>
                reserveProduct(
                  product.product_id,
                  product.warehouse_id
                )
              }
              className="mt-3 bg-black text-white px-4 py-2 rounded"
            >
              Reserve
            </button>

          </div>

        ))}

      </div>
    </div>
  );
}