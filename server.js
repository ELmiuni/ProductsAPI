const express = require("express");
const app = express();
const fs = require("fs");
let data = JSON.parse(fs.readFileSync("./products.json", "utf-8"));
let products = data.products;
let count = data.count;

app.use(express.json());
app.use(express.urlencoded());


//404 endpoint
app.get('/404', (req, res) => {
  res.status(404).json({ message: "Not Found" });
});

// MIDDLEWARE 1
function productExists(req, res, next) {
    const id = parseInt(req.params.id);
    const data = JSON.parse(fs.readFileSync("./products.json", "utf8"));
    const product = data.products.find(p => p.id === id);

    if (!product) {
        return res.redirect('/404');
    }

    req.data = data;
    next();
}

// MIDDLEWARE 2
function validateProduct(req, res, next) {
    const { name, category, price } = req.body;

    if (!name || !category || price == null) {
        return res.status(400).json({ message: "Invalid product data" });
    }

    next();
}


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

//Single get product by ID
app.get("/products/:id", productExists, (req, res) => {
  const id = parseInt(req.params.id);
  const product = req.data.products.find(p => p.id === id);
  res.json(product);
});


app.post("/products", (req, res) => {
  const newProduct = req.body;

  let lastID = 0;
  if  (products.length > 0) {
    const lastProduct = products[products.length - 1];
    lastID = lastProduct.id;
  }

  const productwithID = {
    name: newProduct.name,
    category: newProduct.category,
    subcategory: newProduct.subcategory,
    price: newProduct.price,
  }

  productwithID.id = lastID + 1;

  products.push(productwithID);

  totalcount = products.length;

  const saveData = { count: totalcount, products: products };
  fs.writeFileSync("./products.json", JSON.stringify(saveData, null, 2));
  res.status(201).json({
    message: "Product created successfully",
    product: productwithID,
  })
});

app.put("/products/:id", productExists, validateProduct, (req, res) => {
  const productId = parseInt(req.params.id);

  let foundProduct = null;
  for (let i = 0; i < products.length; i++) {
    if (products[i].id === productId) {
      foundProduct = products[i];
      break;
    }
  }

  if (!foundProduct) {
    return res.status(404).json({
      message: "Product not found"
    });
  }

  const updatedData = req.body;

  if (updatedData.name) {
    foundProduct.name = updatedData.name;
  }
  if (updatedData.category) {
    foundProduct.category = updatedData.category;
  }
  if (updatedData.subcategory) {
    foundProduct.subcategory = updatedData.subcategory;
  }
  if (updatedData.price) {
    foundProduct.price = updatedData.price;
  }

  const dataToSave = {
    count: count,
    products: products
  };

  fs.writeFileSync("./products.json", JSON.stringify(dataToSave, null, 2));

  res.status(200).json({
    message: "Product updated successfully",
    product: foundProduct
  });
});

app.delete("/products/:id", productExists, (req, res) => {
  const productId = parseInt(req.params.id);

  let foundIndex = -1;
  for (let i = 0; i < products.length; i++) {
    if (products[i].id === productId) {
      foundIndex = i;
      break;
    }
  }

  if (foundIndex === -1) {
    return res.status(404).json({ message: "Product not found" });
  }

  products.splice(foundIndex, 1);

  count = products.length;

  const dataToSave = {
    count: count,
    products: products
  };

  fs.writeFileSync("./products.json", JSON.stringify(dataToSave, null, 2));

  res.status(204).send();
});


app.listen(9000, () => console.log("Server running on port 9000"));