const express = require("express");
const app = express();
const fs = require("fs");
const { count, products } = JSON.parse(
  fs.readFileSync("./products.json", "utf-8"),
);

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

app.listen(9000, () => console.log("Server running on port 9000"));
