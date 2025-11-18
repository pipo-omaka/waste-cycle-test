// src/routes/productRoutes.js
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getProducts,           // Legacy endpoint - returns all products
  getAllProducts,        // Explicit endpoint for all products (Marketplace)
  getMyProducts,         // Endpoint for current user's products only (Profile/Dashboard)
  createProduct,
  updateProduct,
  deleteProduct
} from "../controllers/productController.js";

const router = express.Router();

// Legacy endpoint - kept for backward compatibility
// Returns all products from all users (for Marketplace)
router.get("/", protect, getProducts);

// Explicit endpoint for all products (Marketplace view)
// Shows posts from ALL users combined
router.get("/all", protect, getAllProducts);

// Endpoint for current user's products only (Profile/Dashboard view)
// Filters by userId - shows only posts belonging to the logged-in user
router.get("/my-posts", protect, getMyProducts);

// Create a new product (automatically assigns userId from auth)
router.post("/", protect, createProduct);

// Update product (only owner can update - checks userId)
router.put("/:id", protect, updateProduct);

// Delete product (only owner can delete - checks userId)
router.delete("/:id", protect, deleteProduct);

export default router;
