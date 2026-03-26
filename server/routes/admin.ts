import type { Express } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { api } from "@shared/routes";
import { isAuthenticated, isAdmin } from "../auth";

export function registerAdminRoutes(app: Express) {
  app.get(api.admin.dashboard.path, isAuthenticated, isAdmin, async (req, res) => {
    const stats = await storage.getDashboardStats();
    res.json(stats);
  });

  app.get(api.admin.orders.path, isAuthenticated, isAdmin, async (req, res) => {
    const orders = await storage.getAllOrders();
    res.json(orders);
  });

  app.get("/api/admin/analytics", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const analytics = await storage.getAnalytics();
      res.json(analytics);
    } catch (err) {
      console.error("Analytics error:", err);
      res.status(500).json({ message: "Failed to load analytics" });
    }
  });

  app.get("/api/admin/export/:entity", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const entity = req.params.entity as 'products' | 'orders' | 'users' | 'transactions';
      const format = (req.query.format as string) || 'json';
      
      if (!['products', 'orders', 'users', 'transactions'].includes(entity)) {
        return res.status(400).json({ message: "Invalid entity type" });
      }
      
      const data = await storage.getExportData(entity);
      const filename = `${entity}-export-${new Date().toISOString().slice(0,10)}`;
      
      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
        
        if (data.length === 0) {
          return res.send('No data available\n');
        }
        
        const headers = Object.keys(data[0]);
        const csvRows = [
          headers.join(','),
          ...data.map(row => 
            headers.map(h => {
              const value = row[h];
              if (value === null || value === undefined) return '';
              const stringValue = String(value);
              if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                return `"${stringValue.replace(/"/g, '""')}"`;
              }
              return stringValue;
            }).join(',')
          )
        ];
        
        return res.send(csvRows.join('\n'));
      }
      
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
      return res.send(JSON.stringify(data, null, 2));
    } catch (err) {
      console.error("Export error:", err);
      res.status(500).json({ message: "Failed to export data" });
    }
  });

  app.post("/api/inquiries", async (req, res) => {
    try {
      const { name, email, phone, subject, message } = req.body;
      
      if (!name || !email || !subject || !message) {
        return res.status(400).json({ message: "Please fill in all required fields." });
      }
      
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ message: "Invalid email address" });
      }
      
      const inquiry = await storage.createInquiry({ name, email, phone, subject, message });
      res.status(201).json({ message: "Inquiry submitted successfully", id: inquiry.id });
    } catch (err) {
      console.error("Error creating inquiry:", err);
      res.status(500).json({ message: "We couldn't send your inquiry. Please try again." });
    }
  });

  app.get("/api/admin/inquiries", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const inquiries = await storage.getInquiries();
      res.json(inquiries);
    } catch (err) {
      console.error("Error fetching inquiries:", err);
      res.status(500).json({ message: "Failed to fetch inquiries" });
    }
  });

  app.patch("/api/admin/inquiries/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { status } = req.body;
      
      if (!['new', 'read', 'replied', 'closed'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const updated = await storage.updateInquiryStatus(id, status);
      if (!updated) return res.status(404).json({ message: "Inquiry not found" });
      res.json(updated);
    } catch (err) {
      console.error("Error updating inquiry:", err);
      res.status(500).json({ message: "Failed to update inquiry" });
    }
  });

  app.post("/api/admin/migrate-all-images", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const products = await storage.getProducts();
      const migrated = [];
      
      for (const product of products) {
        if (product.imageUrl) {
          const image = await storage.migrateProductImageUrl(product.id);
          if (image) migrated.push({ productId: product.id, imageId: image.id });
        }
      }
      
      res.json({ migrated, count: migrated.length });
    } catch (err) {
      console.error("Error migrating all images:", err);
      res.status(500).json({ message: "Failed to migrate images" });
    }
  });
}
