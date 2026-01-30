const express = require("express");
const app = express();
const fs = require("fs");
let data = JSON.parse(fs.readFileSync("./products.json", "utf-8"));
let products = data.products;
let count = data.count;

app.use(express.json());
app.use(express.urlencoded());

app.get("/products", (req, res) => {
  let result = products;
  if (req.query.category) {
    result = result.filter(
      (product) => product.category === req.query.category,
    );
  }
  if (req.query.subcategory) {
    result = result.filter(
      (product) => product.subcategory === req.query.subcategory,
    );
  }
  if (req.query.search) {
    result = result.filter((product) =>
      product.name.toLowerCase().includes(req.query.search.toLowerCase()),
    );
  }
  res.json(result);
});

app.post("/products", (req, res) => {
  const newProduct = req.body;
  console.log('new products added:', newProduct);
  products.push(newProduct);

  count = products.length;

  const saveData = { count: count, products: products };

  fs.writeFileSync("./products.json", JSON.stringify(saveData, null, 2));
  console.log('products.json updated');
  res.status(201).json({
    message: "Product created successfully",
    product: newProduct,
  })
});

app.listen(9000, () => console.log("Server running on port 9000"));
