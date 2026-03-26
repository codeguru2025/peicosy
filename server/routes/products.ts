import type { Express } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { api } from "@shared/routes";
import { isAuthenticated, isAdmin } from "../auth";
import { productCache, cacheKeys, invalidateProductCaches } from "../cache";

export function registerProductRoutes(app: Express) {
  app.get(api.products.list.path, async (req, res) => {
    try {
      const category = req.query.category as string;
      const search = req.query.search as string;
      
      const products = await productCache.get(
        cacheKeys.products,
        { category, search },
        () => storage.getProducts(category, search)
      );
      res.json(products);
    } catch (err) {
      console.error("Error fetching products:", err);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get(api.products.get.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const product = await productCache.get(
        cacheKeys.product,
        { id },
        () => storage.getProduct(id)
      );
      if (!product) return res.status(404).json({ message: "Product not found" });
      res.json(product);
    } catch (err) {
      console.error("Error fetching product:", err);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.post(api.products.create.path, isAuthenticated, isAdmin, async (req, res) => {
    try {
      const input = api.products.create.input.parse(req.body);
      const product = await storage.createProduct(input);
      invalidateProductCaches();
      res.status(201).json(product);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.put(api.products.update.path, isAuthenticated, isAdmin, async (req, res) => {
    try {
      const input = api.products.update.input.parse(req.body);
      const updated = await storage.updateProduct(Number(req.params.id), input);
      if (!updated) return res.status(404).json({ message: "Product not found" });
      invalidateProductCaches();
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.delete(api.products.delete.path, isAuthenticated, isAdmin, async (req, res) => {
    try {
      const productId = Number(req.params.id);
      
      // Check if product exists
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Check if product has been ordered (foreign key constraint)
      const hasOrders = await storage.productHasOrders(productId);
      if (hasOrders) {
        return res.status(400).json({ 
          message: "Cannot delete this product because it has been ordered. You can set its stock to 0 to hide it from the store instead." 
        });
      }
      
      await storage.deleteProduct(productId);
      invalidateProductCaches();
      res.status(204).send();
    } catch (err) {
      console.error("Error deleting product:", err);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  app.get("/api/products/:productId/images", async (req, res) => {
    try {
      const images = await storage.getProductImages(Number(req.params.productId));
      res.json(images);
    } catch (err) {
      console.error("Error fetching product images:", err);
      res.status(500).json({ message: "Failed to fetch images" });
    }
  });

  app.get("/api/products/:productId/with-images", async (req, res) => {
    try {
      const productId = Number(req.params.productId);
      const product = await productCache.get(
        cacheKeys.productWithImages,
        { productId },
        () => storage.getProductWithImages(productId)
      );
      if (!product) return res.status(404).json({ message: "Product not found" });
      res.json(product);
    } catch (err) {
      console.error("Error fetching product with images:", err);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.post("/api/products/:productId/images", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const productId = Number(req.params.productId);
      const product = await storage.getProduct(productId);
      if (!product) return res.status(404).json({ message: "Product not found" });

      const { objectPath, cdnUrl, role, originalFilename, mimeType, fileSize, width, height } = req.body;
      
      if (!objectPath || !cdnUrl || !mimeType) {
        return res.status(400).json({ message: "Missing required fields: objectPath, cdnUrl, mimeType" });
      }

      const image = await storage.addProductImage({
        productId,
        objectPath,
        cdnUrl,
        role: role || 'gallery',
        originalFilename,
        mimeType,
        fileSize,
        width,
        height,
        sortOrder: 0,
        isLegacy: false,
      });

      invalidateProductCaches();
      res.status(201).json(image);
    } catch (err) {
      console.error("Error adding product image:", err);
      res.status(500).json({ message: "Failed to add image" });
    }
  });

  app.patch("/api/product-images/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { role, sortOrder } = req.body;
      const updated = await storage.updateProductImage(Number(req.params.id), { role, sortOrder });
      if (!updated) return res.status(404).json({ message: "Image not found" });
      invalidateProductCaches();
      res.json(updated);
    } catch (err) {
      console.error("Error updating product image:", err);
      res.status(500).json({ message: "Failed to update image" });
    }
  });

  app.delete("/api/product-images/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteProductImage(Number(req.params.id));
      invalidateProductCaches();
      res.status(204).send();
    } catch (err) {
      console.error("Error deleting product image:", err);
      res.status(500).json({ message: "Failed to delete image" });
    }
  });

  app.post("/api/products/:productId/images/reorder", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const productId = Number(req.params.productId);
      const { imageIds } = req.body;
      
      if (!Array.isArray(imageIds)) {
        return res.status(400).json({ message: "imageIds must be an array" });
      }
      
      await storage.reorderProductImages(productId, imageIds);
      invalidateProductCaches();
      res.json({ success: true });
    } catch (err) {
      console.error("Error reordering images:", err);
      res.status(500).json({ message: "Failed to reorder images" });
    }
  });

  app.post("/api/products/:productId/migrate-image", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const productId = Number(req.params.productId);
      const image = await storage.migrateProductImageUrl(productId);
      if (!image) return res.status(404).json({ message: "No image to migrate" });
      invalidateProductCaches();
      res.json(image);
    } catch (err) {
      console.error("Error migrating product image:", err);
      res.status(500).json({ message: "Failed to migrate image" });
    }
  });

  app.get("/api/cache/products/stats", (req, res) => {
    res.json(productCache.getStats());
  });
}
