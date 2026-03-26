import type { Express } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { api } from "@shared/routes";
import { isAuthenticated, isAdmin } from "../auth";

export function registerShippingRoutes(app: Express) {
  app.get(api.shipping.rates.path, async (req, res) => {
    const rates = await storage.getShippingRates();
    res.json(rates);
  });

  app.post(api.shipping.calculate.path, async (req, res) => {
    try {
      const input = api.shipping.calculate.input.parse(req.body);
      
      const rates = await storage.getShippingRates();
      const rate = rates.find(r => r.method === input.method);
      const shippingCost = rate ? Number(rate.rate) : (input.method === 'air' ? 50 : 20);
      
      const rules = await storage.getCustomsRules('ZA');
      let customsDuty = 0;
      
      if (rules.length > 0) {
        const rule = rules.find(r => r.category === input.category) || rules.find(r => r.category === 'general');
        if (rule && input.subtotal > Number(rule.threshold || 0)) {
          customsDuty = input.subtotal * (Number(rule.dutyPercentage) / 100);
        }
      } else {
        customsDuty = input.subtotal * 0.45;
      }
      
      const total = input.subtotal + shippingCost + customsDuty;
      
      const exchangeRateData = await storage.getExchangeRate('GBP', 'ZAR');
      const exchangeRate = exchangeRateData ? Number(exchangeRateData.rate) : 23.50;
      
      res.json({ 
        shippingCost, 
        customsDuty, 
        total,
        subtotalZAR: input.subtotal * exchangeRate,
        shippingCostZAR: shippingCost * exchangeRate,
        customsDutyZAR: customsDuty * exchangeRate,
        totalZAR: total * exchangeRate,
        exchangeRate
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.get(api.exchangeRate.get.path, async (req, res) => {
    try {
      const from = (req.query.from as string) || 'GBP';
      const to = (req.query.to as string) || 'ZAR';
      
      const exchangeRate = await storage.getExchangeRate(from, to);
      
      if (!exchangeRate) {
        const defaultRate = to === 'ZAR' ? 23.50 : (to === 'USD' ? 1.27 : 1);
        return res.json({ from, to, rate: defaultRate, updatedAt: new Date().toISOString() });
      }
      
      res.json({
        from: exchangeRate.fromCurrency,
        to: exchangeRate.toCurrency,
        rate: exchangeRate.rate,
        updatedAt: exchangeRate.updatedAt
      });
    } catch (err) {
      console.error("Error fetching exchange rate:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.put(api.exchangeRate.update.path, isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { from, to, rate } = req.body;
      
      if (!from || !to || typeof rate !== 'number' || rate <= 0) {
        return res.status(400).json({ message: "Invalid input" });
      }
      
      const updated = await storage.updateExchangeRate(from, to, rate);
      res.json(updated);
    } catch (err) {
      console.error("Error updating exchange rate:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });
}
