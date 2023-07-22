	const express = require("express");
	const app = express();
	require("dotenv").config();
	const stripe = require("stripe")(process.env.STRIPE_SECRET_TEST);
	const bodyParser = require("body-parser");
	const cors = require("cors");

	app.use(bodyParser.urlencoded({ extended: true }));
	app.use(bodyParser.json());

	app.use(cors());

	const products = [
	{
		id: 1,
		name: "Dress",
		price: 10.0,
	},
	{
		id: 2,
		name: "Shoes",
		price: 12.0,
	},
	{
		id: 3,
		name: "T-shirt",
		price: 14.0,
	},
	];

	app.get("/products", (req, res) => {
	res.json(products);
	});

	app.get("/", (req, res) => {
	res.json("Hi. I'm JasurBek");
	});

	// session

	app.post('/create-checkout-session', async (req, res) => {
		const { product } = req.body;
   
		const session = await stripe.checkout.sessions.create({
		  payment_method_types: ['card'],
		  line_items: [
			{
			  price_data: {
				currency: 'usd',
				product_data: {
				  name: product.name,
				},
				unit_amount: product.price * 100,
			  },
			  quantity: 1,
			},
		  ],
		  mode: 'payment',
		  success_url: 'http://localhost:3000/success',
		  cancel_url: 'http://localhost:3000/cancel',
		});
   
		res.json({ sessionId: session.id });
	  });

	  app.post('/payment', async (req, res) => {
		const { amount, currency, token, product } = req.body;
   
		const charge = await stripe.charges.create({
		  amount: amount * 100,
		  currency: currency,
		  source: token,
		  description: `Payment for ${product.name}`,
		});
   
		res.json({ message: 'Payment successful' });
	  })

	app.listen(process.env.PORT || 4000, () => {
	console.log("Server is listening on port 4000");
	});