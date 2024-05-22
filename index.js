const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();
const jwt = require("jsonwebtoken");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection URL
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function run() {
  try {
    // Connect to MongoDB
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("electronic-gadgets-shop");
    const collection = db.collection("users");
    const products = db.collection("products");
    const brands = db.collection("brands");

    // User Registration
    app.post("/api/v1/register", async (req, res) => {
      const { name, email, password } = req.body;

      // Check if email already exists
      const existingUser = await collection.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User already exists",
        });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert user into the database
      await collection.insertOne({ name, email, password: hashedPassword });

      res.status(201).json({
        success: true,
        message: "User registered successfully",
      });
    });

    // User Login
    app.post("/api/v1/login", async (req, res) => {
      const { email, password } = req.body;

      // Find user by email
      const user = await collection.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Compare hashed password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Generate JWT token
      const token = jwt.sign(
        { email: user.email, name: user.name },
        process.env.JWT_SECRET,
        {
          expiresIn: process.env.EXPIRES_IN,
        }
      );

      res.json({
        success: true,
        message: "Login successful",
        token,
      });
    });

    //create product

    app.post("/api/v1/create-product", async (req, res) => {
      await products.insertOne(req.body);
      res.status(201).json({
        success: true,
        message: "Product Created Successfully",
      });
    });

    app.get("/api/v1/products", async (req, res) => {
      try {
        const data = await products.find({}).toArray();
        res.status(200).json({
          success: true,
          message: "Successfully fetched",
          data,
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({
          success: false,
          message: "Internal server error",
        });
      }
    });

    app.get("/api/v1/products/:productId", async (req, res) => {
      const { productId } = req.params;
      console.log(productId);
      try {
        const product = await products.findOne({ productId: productId });
        if (product) {
          res.status(200).json({
            success: true,
            message: "Product fetched successfully",
            data: product,
          });
        } else {
          res.status(404).json({
            success: false,
            message: "Product not found",
          });
        }
      } catch (error) {
        console.error(error);
        res.status(500).json({
          success: false,
          message: "Internal server error",
        });
      }
    });

    //create brand
    app.post("/api/v1/create-brand", async (req, res) => {
      await brands.insertOne(req.body);
      res.status(201).json({
        success: true,
        message: "Brand Created Succesfully",
      });
    });

    app.get("/api/v1/brands", async (req, res) => {
      const data = await brands.find({}).toArray();
      res.status(200).json({
        success: true,
        message: "Brand fetched Succesfully",
        data,
      });
    });

    //most popular products
    app.get("/api/v1/popular-products", async (req, res) => {
      try {
        const data = await products.find({ ratings: "5" }).toArray();
        res.status(200).json({
          success: true,
          message: "Successfully fetched",
          data,
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({
          success: false,
          message: "Internal server error",
        });
      }
    });

    app.get("/api/v1/flash-sale", async (req, res) => {
      try {
        const data = await products.find({ flashSale: "true" }).toArray();
        res.status(200).json({
          success: true,
          message: "Successfully fetched",
          data,
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({
          success: false,
          message: "Internal server error",
        });
      }
    });

    // Start the server
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } finally {
  }
}

run().catch(console.dir);

// Test route
app.get("/", (req, res) => {
  const serverStatus = {
    message: "Server is running smoothly",
    timestamp: new Date(),
  };
  res.json(serverStatus);
});
