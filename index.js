const express = require("express");
const app = express();
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_TEST);
const { json } = require("body-parser");
const cors = require("cors");
const AdminBro = require("admin-bro");
const AdminBroExpress = require("@admin-bro/express");
const AdminBroMongoose = require("@admin-bro/mongoose");
const mongoose = require("mongoose");
const expressFormidable = require("express-formidable");

app.use(cors())
app.use(json())



// Connect to MongoDB
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error" , console.error.bind(console , "Mongodbga ulanishda xatolik:") )
db.once("open" , function (){
  console.log("Mongodbga ulanildi...")
})

// Define product schema
const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
});

const Product = mongoose.model("Product", productSchema);

// Register mongoose adapter with AdminBro
AdminBro.registerAdapter(AdminBroMongoose);

// Create instance of AdminBro
const adminBro = new AdminBro({
  databases: [mongoose],
  resources: [
    {
      resource: Product,
      options: {
        properties: {
          name: { isVisible: { list: true, filter: true, show: true, edit: true } },
          price: { isVisible: { list: true, filter: true, show: true, edit: true } },
        },
      },
    },
  ],
  rootPath: "/admin",
});

// login password admin panel
const ADMIN = {
  email: process.env.ADMIN_EMAIL || "dinara@mail.ru",
  password: process.env.ADMIN_PASSWORD || "lolittoOffical",
};

// Create an authenticated router for AdminBro
const adminRouter = AdminBroExpress.buildAuthenticatedRouter(adminBro, {
  authenticate: async (email, password) => {
    if (email === ADMIN.email && password === ADMIN.password) {
      return ADMIN;
    }
    return null;
  },
  cookiePassword: process.env.ADMIN_COOKIE_PASSWORD || "admincookiepassword",
});

// Use the admin router
app.use(adminBro.options.rootPath, adminRouter);
app.use(expressFormidable());
 
// Use bodyParser middleware
app.use(bodyParser.json());


// Define routes for products and payment
app.get("/products", async (req, res) => {
  try {
    const products = await Product.find({});
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "Error retrieving products" });
  }
});
app.post("/create-checkout-session", async (req, res) => {
  const { cart } = req.body;

  const lineItems = cart.map((product) => ({
    price_data: {
      currency: "usd",
      product_data: {
        name: product.name,
      },
      unit_amount: product.price * 100,
    },
    quantity: 1,
  }));

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: lineItems,
    mode: "payment",
    success_url: "http://localhost:3000/success",
    cancel_url: "http://localhost:3000/cancel",
  });

  res.json({ sessionId: session.id });
});

app.post("/payment", async (req, res) => {
  const { amount, currency, token, product } = req.body;

  try {
    const charge = await stripe.charges.create({
      amount: amount * 100,
      currency: currency,
      source: token,
      description: `Payment for ${product.name}`,
    });

    res.json({ message: "Payment successful" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Payment failed" });
  }
});

// Start the server
app.listen(4000, () => {
  console.log("Server is listening on port 4000");
});