const express = require("express");
const app = express();
const fs = require("fs");
const {Sequelize, DataTypes} = require("sequelize");
let data = JSON.parse(fs.readFileSync("./products.json", "utf-8"));
let products = data.products;
let count = data.count;

app.use(express.json());
app.use(express.urlencoded());

//Routers for the file system and database
const fsRouter = express.Router();
const dbRouter = express.Router();

app.use("/fs", fsRouter);
app.use("/db", dbRouter);


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


fsRouter.get("/products", (req, res) => {
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
fsRouter.get("/products/:id", productExists, (req, res) => {
  const id = parseInt(req.params.id);
  const product = req.data.products.find(p => p.id === id);
  res.json(product);
});


fsRouter.post("/products", (req, res) => {
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

fsRouter.put("/products/:id", productExists, validateProduct, (req, res) => {
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

fsRouter.delete("/products/:id", productExists, (req, res) => {
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


//Sequalize Implementation 

const conn = new Sequelize('products', 'root', '', {
  host: 'localhost',
  dialect: 'mysql'
});

const Category = conn.define("Category",{
    name: {
        type: DataTypes.STRING,
        allowNull:false,
        unique:true
    }
},{})
 
 
const SubCategory = conn.define("SubCategory", {
    name:{
        type:DataTypes.STRING,
        allowNull:false,
        unique:true
    },
    category_id:{
        type: DataTypes.INTEGER,
        allowNull:false
    }
})
 
const Product = conn.define("Product", {
    name:{
        type:DataTypes.STRING,
        allowNull:false,
        unique:true
    },
    price:{
        type:DataTypes.DOUBLE.UNSIGNED,
        allowNull:false,
        defaultValue:0
    },
    currency:{
        type:DataTypes.STRING,
        allowNull:false,
        defaultValue:"USD"
    },
    stock:{
        type:DataTypes.INTEGER.UNSIGNED,
        allowNull:false,
        defaultValue:0
    },
    rating:{
        type: DataTypes.FLOAT.UNSIGNED,
        allowNull:false,
        defaultValue:1
    },
    subcategory_id:{
        type: DataTypes.INTEGER,
        allowNull:false
    }
})
 
SubCategory.belongsTo(Category, {
    foreignKey:"category_id"
})
 
 
Product.belongsTo(SubCategory, {
    foreignKey:"subcategory_id"
})


//Routes for the database

dbRouter.get("/products", async (req, res) => {
  let dbProducts = await Product.findAll();
  if (req.query.category) {
    dbProducts = dbProducts.filter(p => p.category === req.query.category);
  }
  if (req.query.subcategory) {
    dbProducts = dbProducts.filter(p => p.subcategory === req.query.subcategory);
  }
  if (req.query.search) {
    const term = req.query.search.toLowerCase();
    dbProducts = dbProducts.filter(p => p.name.toLowerCase().includes(term));
  } 
  res.json(dbProducts);
});

dbRouter.get("/products/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const product = await Product.findByPk(id);
  if (!product) return res.status(404).json({ message: "Product not found" });
  res.json(product);
});

dbRouter.post("/products", async (req, res) => {
  const newProduct = req.body;
  const created = await Product.create(newProduct);
  res.status(201).json({
    message: "Product created successfully",
    product: created,
  });
});

dbRouter.put("/products/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const product = await Product.findByPk(id);
  if (!product) return res.status(404).json({ message: "Product not found" });

  const updatedData = req.body;
  if (updatedData.name) product.name = updatedData.name;
  if (updatedData.category) product.category = updatedData.category;
  if (updatedData.subcategory) product.subcategory = updatedData.subcategory;
  if (updatedData.price) product.price = updatedData.price;

  await product.save();

  res.status(200).json({
    message: "Product updated successfully",
    product
  });
});

dbRouter.delete("/products/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const product = await Product.findByPk(id);
  if (!product) return res.status(404).json({ message: "Product not found" });
  await product.destroy();
  res.status(204).send();
});


//Fill in functions 

async function fillInCategories(){
    /**
     * 1. Retreiving all the categories from products.json
     * 2. Filtering out only the unique categories
     * 3. Sort the categories alphabetically and in ascending order
     * 4. Register the categories in the database
     */
    const {products} = JSON.parse(fs.readFileSync("products.json", {encoding:"utf8"}))
    const categories = [...new Set(products.map(product => product.category))]
    categories.sort()
    for(const category of categories)
    {
        await Category.create({name:category})
    }
 
 
    fillInSubcategories(products)
}
 
async function fillInSubcategories(products){
    if(products === undefined)
        products = JSON.parse(fs.readFileSync("products.json", {encoding:"utf8"})).products
    const subcategories = new Map()
    for(const product of products)
    {
        subcategories.set(product.subcategory, product.category)
    }
    console.log(subcategories)
    for(const subcategory of subcategories)
    {
        await SubCategory.create({
            name:subcategory[0],
            category_id: (await Category.findOne({where: {name: subcategory[1]}}))?.id
        })
    }
}

async function fillInProducts() {
    // make sure the categories/subcategories exist first
    await fillInCategories();

    const { products } = JSON.parse(fs.readFileSync("products.json", "utf8"));

    for (const p of products) {
        const sub = await SubCategory.findOne({ where: { name: p.subcategory } });
        if (!sub) continue;

        await Product.create({
            name:     p.name,
            price:    p.price,
            currency: p.currency,
            stock:    p.stock,
            rating:   p.rating,
            subcategory_id: sub.id
        });
    }
}
 
 
fillInProducts();


app.listen(9000, () => console.log("Server running on port 9000"));