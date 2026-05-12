async function getProducts() {
  const response = await fetch(
    "http://localhost:3000/api/products",
    {
      cache: "no-store",     // Ensure we always get fresh data
    }
  );

  return response.json();
}

export default async function HomePage() {

  const products = await getProducts();

  return (
    <div className="p-10">

      <h1 className="text-3xl font-bold mb-6">
        Products
      </h1>

      <div className="space-y-4">

        {products.map((product: any, index: number) => (       // any is used here for simplicity, ideally you should define a proper type/interface for your products
          <div
            key={index}
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
          </div>
        ))}

      </div>
    </div>
  );
}