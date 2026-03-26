import express from "express";
import { createServer as createViteServer } from "vite";
import db from "./src/db.ts";
import fs from "fs";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();


function logError(message: string, error: any) {
  const logEntry = `[${new Date().toISOString()}] ${message}: ${error.message}\n${error.stack}\n\n`;
  fs.appendFileSync("server_errors.log", logEntry);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.use('/api', (req, res, next) => {
    if (req.path.startsWith('/auth/') || req.path.startsWith('/admin/')) {
      return next();
    }
    return requireAuth(req, res, next);
  });


  // --- API Routes ---

  // Products (Now fetching SKUs as the primary item for POS)
  app.get("/api/products", (req, res) => {
    const products = db.prepare(`
      SELECT 
        s.id as id,
        p.name as product_name,
        s.sku_code,
        s.barcode,
        s.selling_price,
        s.cost_price,
        p.product_type,
        c.name as category_name,
        m.name as manufacturer_name,
        p.id as product_id,
        (SELECT SUM(quantity) FROM branch_stock WHERE sku_id = s.id) as total_stock
      FROM product_skus s
      JOIN products p ON s.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN manufacturers m ON p.manufacturer_id = m.id
      WHERE p.deleted_at IS NULL
    `).all();
    
    // Map to match the previous frontend structure as much as possible
    const mappedProducts = products.map((p: any) => ({
      ...p,
      name: p.product_name + (p.sku_code ? ` (${p.sku_code})` : '')
    }));
    
    res.json(mappedProducts);
  });

  app.get("/api/products/:id", (req, res) => {
    const product = db.prepare(`
      SELECT 
        s.id as id,
        p.name as product_name,
        s.sku_code,
        s.barcode,
        s.selling_price,
        s.cost_price,
        p.product_type,
        c.name as category_name,
        m.name as manufacturer_name,
        p.id as product_id,
        p.category_id,
        p.manufacturer_id
      FROM product_skus s
      JOIN products p ON s.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN manufacturers m ON p.manufacturer_id = m.id
      WHERE s.id = ?
    `).get(req.params.id);
    
    if (!product) return res.status(404).json({ error: "Product not found" });
    
    const stock = db.prepare(`
      SELECT b.name as branch_name, b.id as branch_id, IFNULL(bs.quantity, 0) as quantity
      FROM branches b
      LEFT JOIN branch_stock bs ON b.id = bs.branch_id AND bs.sku_id = ?
      WHERE b.business_id = 1
    `).all(req.params.id);

    res.json({ ...product, stock });
  });

  app.put("/api/products/:id", (req, res) => {
    const { 
      product_name, category_id, manufacturer_id, sku_code, barcode,
      selling_price, cost_price, product_type
    } = req.body;
    const skuId = req.params.id;

    try {
      const transaction = db.transaction(() => {
        const sku = db.prepare("SELECT * FROM product_skus WHERE id = ?").get(skuId) as any;
        if (!sku) throw new Error("SKU not found");

        // Update product_skus
        db.prepare(`
          UPDATE product_skus SET 
            sku_code = ?, barcode = ?, selling_price = ?, cost_price = ?
          WHERE id = ?
        `).run(sku_code, barcode, selling_price, cost_price, skuId);

        // Update products
        db.prepare(`
          UPDATE products SET 
            name = ?, category_id = ?, manufacturer_id = ?, product_type = ?
          WHERE id = ?
        `).run(product_name, category_id, manufacturer_id, product_type, sku.product_id);

        // Log activity
        db.prepare(`
          INSERT INTO product_activity (sku_id, user_id, activity, details)
          VALUES (?, ?, ?, ?)
        `).run(skuId, 1, 'Product Updated', `Product details updated via edit form`);
      });

      transaction();
      res.json({ success: true });
    } catch (error: any) {
      console.error('Failed to update product:', error);
      res.status(500).json({ error: error.message || "Failed to update product" });
    }
  });

  app.post("/api/products", (req, res) => {
    const { name, category_id, manufacturer_id, selling_price, cost_price, product_type, sku_code, barcode, allow_overselling } = req.body;
    
    const transaction = db.transaction(() => {
      const prodResult = db.prepare(`
        INSERT INTO products (business_id, name, category_id, manufacturer_id, product_type, allow_overselling)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(1, name, category_id, manufacturer_id, product_type, allow_overselling === false ? 0 : 1);
      
      const productId = prodResult.lastInsertRowid;
      
      // Auto-generate SKU if not provided
      let finalSku = sku_code;
      if (!finalSku || finalSku.trim() === '') {
        finalSku = 'SKU-' + Math.random().toString(36).substring(2, 9).toUpperCase();
      }
      
      const skuResult = db.prepare(`
        INSERT INTO product_skus (product_id, sku_code, barcode, cost_price, selling_price)
        VALUES (?, ?, ?, ?, ?)
      `).run(productId, finalSku, barcode || finalSku, cost_price, selling_price);
      
      const skuId = skuResult.lastInsertRowid;

      // Log activity
      db.prepare(`
        INSERT INTO product_activity (sku_id, user_id, activity, details)
        VALUES (?, ?, ?, ?)
      `).run(skuId, 1, 'Product Created', `Product "${name}" created with SKU ${finalSku}`);
      
      return skuId;
    });

    try {
      const skuId = transaction();
      res.json({ id: skuId });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/products/:id/activity", (req, res) => {
    const activities = db.prepare(`
      SELECT a.*, u.name as user_name
      FROM product_activity a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.sku_id = ?
      ORDER BY a.created_at DESC
    `).all(req.params.id);
    res.json(activities);
  });

  // Inventory Management
  app.get("/api/branches", (req, res) => {
    res.json(db.prepare("SELECT * FROM branches WHERE business_id = 1").all());
  });

  app.get("/api/suppliers", (req, res) => {
    res.json(db.prepare("SELECT * FROM suppliers WHERE business_id = 1").all());
  });

  app.post("/api/suppliers", (req, res) => {
    const { name, phone, email, contact_person } = req.body;
    try {
      const result = db.prepare(`
        INSERT INTO suppliers (business_id, name, phone, email, contact_person)
        VALUES (?, ?, ?, ?, ?)
      `).run(1, name, phone, email, contact_person);
      res.json({ id: result.lastInsertRowid, name, phone, email, contact_person });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/inventory/add", (req, res) => {
    const { sku_id, branch_id, quantity, cost_price, selling_price, supplier_id, po_number, items } = req.body;
    
    const transaction = db.transaction(() => {
      // Get product info
      const productInfo = db.prepare(`
        SELECT p.id as product_id, p.name as product_name, p.product_type 
        FROM product_skus s
        JOIN products p ON s.product_id = p.id
        WHERE s.id = ?
      `).get(sku_id);

      if (!productInfo) throw new Error("Product not found");

      // Auto-create or find Purchase Order
      let finalPoNumber = po_number;
      if (!finalPoNumber || finalPoNumber.trim() === '') {
        const lastPo = db.prepare("SELECT id FROM purchase_orders ORDER BY id DESC LIMIT 1").get() as any;
        const nextSerial = (lastPo ? lastPo.id + 1 : 1).toString().padStart(2, '0');
        finalPoNumber = `PO${nextSerial}`;
      }

      let po = db.prepare(`
        SELECT id FROM purchase_orders WHERE po_number = ? AND business_id = 1
      `).get(finalPoNumber);

      let poId;
      const totalAmount = (cost_price || 0) * (quantity || (items ? items.length : 0));

      if (!po) {
        const poResult = db.prepare(`
          INSERT INTO purchase_orders (business_id, branch_id, supplier_id, po_number, status, total, expected_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(1, branch_id || 1, supplier_id || null, finalPoNumber, 'received', totalAmount, new Date().toISOString());
        poId = poResult.lastInsertRowid;
      } else {
        poId = po.id;
        // Update total
        db.prepare(`
          UPDATE purchase_orders SET total = total + ? WHERE id = ?
        `).run(totalAmount, poId);
      }

      // Add to Purchase Order Items
      db.prepare(`
        INSERT INTO purchase_order_items (po_id, product_id, description, ordered_qty, received_qty, unit_cost, total)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        poId, 
        productInfo.product_id, 
        productInfo.product_name, 
        quantity || (items ? items.length : 0), 
        quantity || (items ? items.length : 0), 
        cost_price || 0, 
        totalAmount
      );

      if (productInfo.product_type === 'serialized') {
        // Add individual devices
        for (const item of items) {
          db.prepare(`
            INSERT INTO devices (business_id, branch_id, sku_id, imei, cost_price, selling_price, color, gb, condition, po_number, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(1, branch_id, sku_id, item.imei, cost_price, selling_price, item.color, item.gb, item.condition, finalPoNumber, 'in_stock');
          
          // Update branch stock count
          db.prepare(`
            INSERT INTO branch_stock (branch_id, sku_id, quantity)
            VALUES (?, ?, 1)
            ON CONFLICT(branch_id, sku_id) DO UPDATE SET quantity = quantity + 1
          `).run(branch_id, sku_id);
        }
      } else {
        // Add bulk stock
        db.prepare(`
          INSERT INTO branch_stock (branch_id, sku_id, quantity)
          VALUES (?, ?, ?)
          ON CONFLICT(branch_id, sku_id) DO UPDATE SET quantity = quantity + ?
        `).run(branch_id, sku_id, quantity, quantity);
      }

      // Log movement
      db.prepare(`
        INSERT INTO inventory_movements (business_id, branch_id, sku_id, movement_type, quantity, unit_cost, reference_type, reference_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(1, branch_id, sku_id, 'purchase', quantity || items.length, cost_price, 'purchase_order', finalPoNumber);

      // Log activity
      db.prepare(`
        INSERT INTO product_activity (sku_id, user_id, activity, details)
        VALUES (?, ?, ?, ?)
      `).run(sku_id, 1, 'Inventory Added', `Added ${quantity || items.length} units to branch. PO: ${finalPoNumber}`);

      return true;
    });

    try {
      transaction();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Customers
  app.get("/api/customers", (req, res) => {
    const customers = db.prepare("SELECT * FROM customers WHERE business_id = 1").all();
    res.json(customers);
  });

  app.get("/api/customers/:id", (req, res) => {
    const customer = db.prepare("SELECT * FROM customers WHERE id = ?").get(req.params.id);
    if (!customer) return res.status(404).json({ error: "Customer not found" });
    res.json(customer);
  });

  app.put("/api/customers/:id", (req, res) => {
    const { 
      name, phone, email, address,
      first_name, last_name, secondary_phone, fax, offers_email,
      company, customer_type, address_line1, address_line2,
      city, state, zip_code, country, website, alert_message
    } = req.body;
    const customerId = req.params.id;
    
    const transaction = db.transaction(() => {
      const old = db.prepare("SELECT * FROM customers WHERE id = ?").get(customerId) as any;
      if (!old) throw new Error("Customer not found");

      db.prepare(`
        UPDATE customers SET 
          name = ?, phone = ?, email = ?, address = ?,
          first_name = ?, last_name = ?, secondary_phone = ?, fax = ?, offers_email = ?,
          company = ?, customer_type = ?, address_line1 = ?, address_line2 = ?,
          city = ?, state = ?, zip_code = ?, country = ?, website = ?, alert_message = ?
        WHERE id = ?
      `).run(
        name, phone, email, address,
        first_name, last_name, secondary_phone, fax, offers_email ? 1 : 0,
        company, customer_type, address_line1, address_line2,
        city, state, zip_code, country, website, alert_message,
        customerId
      );

      // Detect changes for logging
      const changes = [];
      if (old.name !== name) changes.push(`Name: ${old.name} -> ${name}`);
      if (old.phone !== phone) changes.push(`Phone: ${old.phone} -> ${phone}`);
      if (old.email !== email) changes.push(`Email: ${old.email} -> ${email}`);

      if (changes.length > 0) {
        db.prepare(`
          INSERT INTO customer_activity (customer_id, user_id, activity, details)
          VALUES (?, ?, ?, ?)
        `).run(customerId, 1, 'Profile Updated', changes.join(', '));
      }

      return true;
    });

    try {
      transaction();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/customers/:id/invoices", (req, res) => {
    const invoices = db.prepare(`
      SELECT * FROM invoices 
      WHERE customer_id = ? 
      ORDER BY created_at DESC
    `).all(req.params.id);
    res.json(invoices);
  });

  app.get("/api/customers/:id/payments", (req, res) => {
    const payments = db.prepare(`
      SELECT p.*, i.invoice_number 
      FROM payments p
      LEFT JOIN invoices i ON p.invoice_id = i.id
      WHERE p.customer_id = ?
      ORDER BY p.paid_at DESC
    `).all(req.params.id);
    res.json(payments);
  });

  app.get("/api/customers/:id/ledger", (req, res) => {
    const ledger = db.prepare(`
      SELECT p.*, i.invoice_number 
      FROM payments p
      LEFT JOIN invoices i ON p.invoice_id = i.id
      WHERE p.customer_id = ?
      ORDER BY p.paid_at DESC
    `).all(req.params.id);
    res.json(ledger);
  });

  app.get("/api/customers/:id/activity", (req, res) => {
    const activities = db.prepare(`
      SELECT a.*, u.name as user_name
      FROM customer_activity a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.customer_id = ?
      ORDER BY a.created_at DESC
    `).all(req.params.id);
    res.json(activities);
  });

  app.post("/api/customers/:id/payments", (req, res) => {
    const { amount, method, note } = req.body;
    const customerId = req.params.id;
    const numAmount = Number(amount);

    const transaction = db.transaction(() => {
      // 1. Create a "Deposit" record
      const paymentResult = db.prepare(`
        INSERT INTO payments (customer_id, type, method, amount)
        VALUES (?, ?, ?, ?)
      `).run(customerId, 'deposit', method || 'Cash', numAmount);

      // 2. Update customer wallet balance
      db.prepare(`
        UPDATE customers SET wallet_balance = COALESCE(wallet_balance, 0) + ? WHERE id = ?
      `).run(numAmount, customerId);

      // 3. Log activity
      db.prepare(`
        INSERT INTO customer_activity (customer_id, user_id, activity, details)
        VALUES (?, ?, ?, ?)
      `).run(customerId, 1, 'Deposit Received', `Deposit of €${numAmount.toFixed(2)} received via ${method}. ${note || ''}`);

      return { paymentId: paymentResult.lastInsertRowid };
    });

    try {
      const result = transaction();
      res.json({ success: true, ...result });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/customers/:id", (req, res) => {
    const { id } = req.params;
    try {
      db.prepare("UPDATE customers SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?").run(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/products/:id", (req, res) => {
    const { id } = req.params;
    try {
      db.prepare("UPDATE products SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?").run(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/customers", (req, res) => {
    const { 
      name, phone, email,
      first_name, last_name, secondary_phone, fax, offers_email,
      company, customer_type, address_line1, address_line2,
      city, state, zip_code, country, website, alert_message
    } = req.body;
    const result = db.prepare(`
      INSERT INTO customers (
        business_id, name, phone, email,
        first_name, last_name, secondary_phone, fax, offers_email,
        company, customer_type, address_line1, address_line2,
        city, state, zip_code, country, website, alert_message
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      1, name, phone, email,
      first_name, last_name, secondary_phone, fax, offers_email ? 1 : 0,
      company, customer_type, address_line1, address_line2,
      city, state, zip_code, country, website, alert_message
    );
    res.json({ id: result.lastInsertRowid });
  });

  // Invoices
  app.get("/api/invoices", (req, res) => {
    const invoices = db.prepare(`
      SELECT i.*, c.name as customer_name 
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      WHERE i.business_id = 1
      ORDER BY i.created_at DESC
    `).all();
    res.json(invoices);
  });

  app.get("/api/invoices/:id", (req, res) => {
    const invoice = db.prepare(`
      SELECT i.*, c.name as customer_name, c.phone as customer_phone, c.email as customer_email
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      WHERE i.id = ?
    `).get(req.params.id) as any;

    if (!invoice) return res.status(404).json({ error: "Invoice not found" });

    const items = db.prepare(`
      SELECT ii.*, p.name as product_name, s.sku_code, d.imei
      FROM invoice_items ii
      JOIN product_skus s ON ii.sku_id = s.id
      JOIN products p ON s.product_id = p.id
      LEFT JOIN devices d ON ii.device_id = d.id
      WHERE ii.invoice_id = ?
    `).all(req.params.id);

    const payments = db.prepare("SELECT * FROM payments WHERE invoice_id = ?").all(req.params.id) as any[];
    
    const activities = db.prepare(`
      SELECT a.*, u.name as user_name
      FROM invoice_activity a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.invoice_id = ?
      ORDER BY a.created_at DESC
    `).all(req.params.id);
    
    // Add a summary payment method for the receipt
    const paymentMethod = payments.length > 1 ? 'Split' : (payments[0]?.method || 'Cash');

    res.json({ 
      ...invoice, 
      items, 
      payments,
      activities,
      payment_method: paymentMethod,
      customer: {
        name: invoice.customer_name,
        phone: invoice.customer_phone,
        email: invoice.customer_email
      }
    });
  });

  app.post("/api/invoices", (req, res) => {
    const { customer_id, items, subtotal, tax_total, discount_total, grand_total, payments, activities } = req.body;
    
    const transaction = db.transaction(() => {
      // Customer: Use provided ID or find "Walk-in Customer"
      let finalCustomerId = customer_id;
      if (!finalCustomerId) {
        const walkIn = db.prepare("SELECT id FROM customers WHERE name = 'Walk-in Customer' LIMIT 1").get() as any;
        finalCustomerId = walkIn ? walkIn.id : null;
      }

      // Invoice Number
      const now = new Date();
      const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
      const day = days[now.getDay()];
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
      
      const lastInvoice = db.prepare("SELECT id FROM invoices ORDER BY id DESC LIMIT 1").get() as any;
      const nextSerial = (lastInvoice ? lastInvoice.id + 1 : 1).toString().padStart(2, '0');
      const invoiceNumber = `INV${nextSerial}-${day}-${dateStr}`;

      // Calculate paid and due
      let totalPaid = 0;
      if (payments && Array.isArray(payments)) {
        totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
      }
      const dueAmount = Math.max(0, grand_total - totalPaid);
      
      let status = 'paid';
      if (dueAmount > 0) {
        status = totalPaid > 0 ? 'partial' : 'credit';
      }

      const result = db.prepare(`
        INSERT INTO invoices (business_id, branch_id, customer_id, invoice_number, subtotal, tax_total, discount_total, grand_total, paid_amount, due_amount, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(1, 1, finalCustomerId, invoiceNumber, subtotal, tax_total, discount_total, grand_total, totalPaid, dueAmount, status);
      
      const invoiceId = result.lastInsertRowid;

      // Handle items...
      for (const item of items) {
        const skuId = item.id || item.sku_id;
        const productInfo = db.prepare(`
          SELECT p.product_type, p.allow_overselling, p.name as product_name,
                 (SELECT quantity FROM branch_stock WHERE sku_id = s.id AND branch_id = 1) as current_stock
          FROM product_skus s
          JOIN products p ON s.product_id = p.id
          WHERE s.id = ?
        `).get(skuId) as any;

        if (!productInfo) throw new Error(`Product not found for SKU ID: ${skuId}`);

        db.prepare(`
          INSERT INTO invoice_items (invoice_id, sku_id, device_id, quantity, price, total)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(invoiceId, skuId, item.device_id || null, item.quantity, item.price, item.total);

        // Update stock
        if (productInfo.product_type === 'stock') {
          db.prepare(`
            INSERT INTO branch_stock (branch_id, sku_id, quantity)
            VALUES (1, ?, -?)
            ON CONFLICT(branch_id, sku_id) DO UPDATE SET quantity = quantity - ?
          `).run(skuId, item.quantity, item.quantity);
        } else if (item.device_id) {
          db.prepare("UPDATE devices SET status = 'sold' WHERE id = ?").run(item.device_id);
          db.prepare(`
            INSERT INTO branch_stock (branch_id, sku_id, quantity)
            VALUES (1, ?, -1)
            ON CONFLICT(branch_id, sku_id) DO UPDATE SET quantity = quantity - 1
          `).run(skuId);
        }
      }

      // Handle payments
      if (payments && Array.isArray(payments)) {
        for (const p of payments) {
          const type = p.method === 'Store Credit' || p.method === 'Wallet' ? 'wallet_use' : 'sale_payment';
          
          db.prepare(`
            INSERT INTO payments (customer_id, invoice_id, type, method, amount)
            VALUES (?, ?, ?, ?, ?)
          `).run(finalCustomerId, invoiceId, type, p.method, p.amount);

          if (type === 'wallet_use') {
            db.prepare(`
              UPDATE customers SET wallet_balance = wallet_balance - ? WHERE id = ?
            `).run(p.amount, finalCustomerId);
          }
        }
      }

      // Log activities
      db.prepare(`
        INSERT INTO customer_activity (customer_id, user_id, activity, details)
        VALUES (?, ?, ?, ?)
      `).run(finalCustomerId, 1, 'Invoice Created', `Invoice ${invoiceNumber} created for €${grand_total.toFixed(2)}. Paid: €${totalPaid.toFixed(2)}, Due: €${dueAmount.toFixed(2)}`);

      db.prepare(`
        INSERT INTO invoice_activity (invoice_id, user_id, activity, details)
        VALUES (?, ?, ?, ?)
      `).run(invoiceId, 1, 'Invoice Created', `Invoice ${invoiceNumber} created for €${grand_total.toFixed(2)}`);

      // Save activities from client
      if (activities && Array.isArray(activities)) {
        for (const act of activities) {
          db.prepare(`
            INSERT INTO invoice_activity (invoice_id, user_id, activity, details)
            VALUES (?, ?, ?, ?)
          `).run(invoiceId, 1, act.action || act.activity, act.details);
        }
      }

      return invoiceId;
    });

    try {
      const invoiceId = transaction();
      res.json({ id: invoiceId });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/invoices/:id/refund", (req, res) => {
    const { method } = req.body;
    const invoiceId = req.params.id;

    const transaction = db.transaction(() => {
      const invoice = db.prepare("SELECT * FROM invoices WHERE id = ?").get(invoiceId) as any;
      if (!invoice) throw new Error("Invoice not found");
      if (invoice.status === 'void') throw new Error("Invoice already refunded");

      // Update invoice status
      db.prepare("UPDATE invoices SET status = 'void' WHERE id = ?").run(invoiceId);

      // Add refund payment (negative amount)
      db.prepare(`
        INSERT INTO payments (invoice_id, method, amount)
        VALUES (?, ?, ?)
      `).run(invoiceId, `Refund (${method})`, -invoice.grand_total);

      // Return items to stock
      const items = db.prepare("SELECT * FROM invoice_items WHERE invoice_id = ?").all(invoiceId) as any[];
      for (const item of items) {
        // Increment branch stock
        db.prepare(`
          INSERT INTO branch_stock (branch_id, sku_id, quantity)
          VALUES (1, ?, ?)
          ON CONFLICT(branch_id, sku_id) DO UPDATE SET quantity = quantity + ?
        `).run(item.sku_id, item.quantity, item.quantity);

        // If it was a device, mark it back as in_stock
        if (item.device_id) {
          db.prepare("UPDATE devices SET status = 'in_stock' WHERE id = ?").run(item.device_id);
        }
      }

      // Log activity
      db.prepare(`
        INSERT INTO invoice_activity (invoice_id, user_id, activity, details)
        VALUES (?, ?, ?, ?)
      `).run(invoiceId, 1, 'Refund Created', `Refund issued via ${method} for €${invoice.grand_total.toFixed(2)}`);

      return true;
    });

    try {
      transaction();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/payments/:id", (req, res) => {
    const { method } = req.body;
    try {
      db.prepare("UPDATE payments SET method = ? WHERE id = ?").run(method, req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // End of Day (EOD) Reports
  app.get("/api/reports/eod-data", (req, res) => {
    const date = req.query.date as string || new Date().toISOString().split('T')[0];
    
    // 1. Get all invoice payments for the day
    const invoicePayments = db.prepare(`
      SELECT 
        p.*, 
        u.name as user_name,
        i.invoice_number,
        c.name as customer_name
      FROM payments p
      LEFT JOIN invoices i ON p.invoice_id = i.id
      LEFT JOIN users u ON i.user_id = u.id
      LEFT JOIN customers c ON i.customer_id = c.id
      WHERE date(p.paid_at) = ? AND p.type = 'sale_payment'
    `).all(date);

    // 2. Get other cash movements (deposits, refunds, cash in/out)
    const otherMovements = db.prepare(`
      SELECT 
        p.*,
        c.name as customer_name
      FROM payments p
      LEFT JOIN customers c ON p.customer_id = c.id
      WHERE date(p.paid_at) = ? AND p.type != 'sale_payment'
    `).all(date);

    // 3. Calculate summaries
    const summary = db.prepare(`
      SELECT 
        method,
        type,
        SUM(amount) as total
      FROM payments
      WHERE date(paid_at) = ?
      GROUP BY method, type
    `).all(date);

    res.json({
      invoicePayments,
      otherMovements,
      summary,
      date
    });
  });

  app.post("/api/reports/eod", (req, res) => {
    const { 
      report_date, 
      starting_balance, 
      cash_counted, 
      calculated_cash, 
      difference,
      total_sales,
      total_deposits,
      total_cash_in_drawer,
      comments,
      payment_summaries 
    } = req.body;

    const transaction = db.transaction(() => {
      const reportId = db.prepare(`
        INSERT INTO closing_reports (
          branch_id, user_id, report_date, starting_balance, 
          cash_counted, calculated_cash, difference, 
          total_sales, total_deposits, total_cash_in_drawer, comments
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        1, 1, report_date, starting_balance, 
        cash_counted, calculated_cash, difference, 
        total_sales, total_deposits, total_cash_in_drawer, comments
      ).lastInsertRowid;

      const insertSummary = db.prepare(`
        INSERT INTO closing_report_payments (
          report_id, payment_type, calculated, counted, difference
        ) VALUES (?, ?, ?, ?, ?)
      `);

      for (const s of payment_summaries) {
        insertSummary.run(reportId, s.payment_type, s.calculated, s.counted, s.difference);
      }

      return reportId;
    });

    try {
      const id = transaction();
      res.json({ success: true, id });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/reports/eod-list", (req, res) => {
    const reports = db.prepare(`
      SELECT r.*, u.name as user_name
      FROM closing_reports r
      JOIN users u ON r.user_id = u.id
      ORDER BY r.report_date DESC
    `).all();
    res.json(reports);
  });

  // Categories & Manufacturers
  app.get("/api/categories", (req, res) => {
    res.json(db.prepare("SELECT * FROM categories WHERE business_id = 1").all());
  });

  app.post("/api/categories", (req, res) => {
    const { name } = req.body;
    try {
      const result = db.prepare("INSERT INTO categories (business_id, name) VALUES (?, ?)").run(1, name);
      res.json({ id: result.lastInsertRowid, name });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/manufacturers", (req, res) => {
    res.json(db.prepare("SELECT * FROM manufacturers WHERE business_id = 1").all());
  });

  app.post("/api/manufacturers", (req, res) => {
    const { name } = req.body;
    try {
      const result = db.prepare("INSERT INTO manufacturers (business_id, name) VALUES (?, ?)").run(1, name);
      res.json({ id: result.lastInsertRowid, name });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Enhanced Search for Cash Register
  app.get("/api/settings", (req, res) => {
    try {
      let settings = db.prepare("SELECT * FROM settings WHERE business_id = 1").get();
      if (!settings) {
        // Create default settings if not found
        db.prepare("INSERT INTO settings (business_id) VALUES (?)").run(1);
        settings = db.prepare("SELECT * FROM settings WHERE business_id = 1").get();
      }
      res.json(settings || {});
    } catch (error) {
      console.error('Error fetching settings:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post("/api/settings", (req, res) => {
    try {
      const { timezone, date_format, time_format, language } = req.body;
      db.prepare(`
        UPDATE settings 
        SET timezone = ?, date_format = ?, time_format = ?, language = ?
        WHERE business_id = 1
      `).run(timezone, date_format, time_format, language);
      res.json({ success: true });
    } catch (error) {
      console.error('Error saving settings:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get("/api/company", (req, res) => {
    try {
      let company = db.prepare("SELECT * FROM businesses WHERE id = 1").get();
      if (!company) {
        // Create default business if not found
        db.prepare("INSERT INTO businesses (name, email) VALUES (?, ?)").run('iCover EPOS', 'contact@icover.com');
        company = db.prepare("SELECT * FROM businesses WHERE id = 1").get();
      }
      res.json(company || {});
    } catch (error) {
      console.error('Error fetching company:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post("/api/company", (req, res) => {
    const { name, email, phone, subdomain, address, city, state, zip_code, country } = req.body;
    db.prepare(`
      UPDATE businesses 
      SET name = ?, email = ?, phone = ?, subdomain = ?, address = ?, city = ?, state = ?, zip_code = ?, country = ?
      WHERE id = 1
    `).run(name, email, phone, subdomain, address, city, state, zip_code, country);
    res.json({ success: true });
  });

  app.get("/api/payment-methods", (req, res) => {
    const methods = db.prepare("SELECT * FROM payment_methods WHERE business_id = 1 AND is_active = 1 ORDER BY display_order ASC").all();
    res.json(methods);
  });

  app.post("/api/payment-methods", (req, res) => {
    const { methods } = req.body;
    // Simple approach: delete all and re-insert or update
    // For now, let's just handle the list
    db.transaction(() => {
      // Mark all as inactive first
      db.prepare("UPDATE payment_methods SET is_active = 0 WHERE business_id = 1").run();
      
      methods.forEach((m: any, index: number) => {
        if (m.id) {
          db.prepare(`
            UPDATE payment_methods 
            SET name = ?, display_order = ?, is_active = 1
            WHERE id = ? AND business_id = 1
          `).run(m.name, index + 1, m.id);
        } else {
          db.prepare(`
            INSERT INTO payment_methods (business_id, name, display_order, is_active)
            VALUES (?, ?, ?, 1)
          `).run(1, m.name, index + 1);
        }
      });
    })();
    res.json({ success: true });
  });

  // Printer Settings
  app.get('/api/printer-settings', (req, res) => {
    try {
      const businessId = 1;
    const branchId = req.user ? req.user.branch_id : 1; // Default for now
      let settings = db.prepare('SELECT * FROM printer_settings WHERE business_id = ? AND branch_id = ?').get(businessId, branchId);
      
      if (!settings) {
        // Insert default settings if none exist
        db.prepare('INSERT INTO printer_settings (business_id) VALUES (?)').run(businessId, branchId);
        settings = db.prepare('SELECT * FROM printer_settings WHERE business_id = ? AND branch_id = ?').get(businessId, branchId);
      }
      
      res.json(settings);
    } catch (error) {
      console.error('Error fetching printer settings:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/printer-settings', (req, res) => {
    try {
      const businessId = 1;
    const branchId = req.user ? req.user.branch_id : 1; // Default for now
      const { 
        label_size, barcode_length, margin_top, margin_left, 
        margin_bottom, margin_right, orientation, font_size, font_family 
      } = req.body;
      
      db.prepare(`
        UPDATE printer_settings 
        SET label_size = ?, barcode_length = ?, margin_top = ?, margin_left = ?, 
            margin_bottom = ?, margin_right = ?, orientation = ?, font_size = ?, font_family = ?
        WHERE business_id = ? AND branch_id = ?
      `).run(
        label_size, barcode_length, margin_top, margin_left, 
        margin_bottom, margin_right, orientation, font_size, font_family, businessId
      );
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error saving printer settings:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Thermal Printer Settings
  app.get('/api/thermal-printer-settings', (req, res) => {
    try {
      const businessId = 1;
    const branchId = req.user ? req.user.branch_id : 1; // Default for now
      let settings = db.prepare('SELECT * FROM thermal_printer_settings WHERE business_id = ? AND branch_id = ?').get(businessId, branchId);
      
      if (!settings) {
        // Insert default settings if none exist
        db.prepare('INSERT INTO thermal_printer_settings (business_id) VALUES (?)').run(businessId, branchId);
        settings = db.prepare('SELECT * FROM thermal_printer_settings WHERE business_id = ? AND branch_id = ?').get(businessId, branchId);
      }
      
      res.json(settings);
    } catch (error) {
      console.error('Error fetching thermal printer settings:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/thermal-printer-settings', (req, res) => {
    try {
      console.log('--- Saving Thermal Printer Settings ---');
      console.log('Body:', JSON.stringify(req.body, null, 2));
      const businessId = 1;
    const branchId = req.user ? req.user.branch_id : 1;
      
      const settingsMap = {
        business_id: businessId,
        font_family: req.body.font_family || 'monospace',
        font_size: req.body.font_size || '12px',
        show_logo: req.body.show_logo ? 1 : 0,
        show_business_name: req.body.show_business_name ? 1 : 0,
        show_business_address: req.body.show_business_address ? 1 : 0,
        show_business_phone: req.body.show_business_phone ? 1 : 0,
        show_business_email: req.body.show_business_email ? 1 : 0,
        show_customer_info: req.body.show_customer_info ? 1 : 0,
        show_invoice_number: req.body.show_invoice_number ? 1 : 0,
        show_date: req.body.show_date ? 1 : 0,
        show_items_table: req.body.show_items_table ? 1 : 0,
        show_totals: req.body.show_totals ? 1 : 0,
        show_footer: req.body.show_footer ? 1 : 0,
        footer_text: req.body.footer_text || 'Thank you for your business!'
      };

      const columns = Object.keys(settingsMap);
      const values = Object.values(settingsMap);
      const placeholders = columns.map(() => '?').join(', ');

      const saveTransaction = db.transaction(() => {
        // Delete existing to ensure no conflicts and fresh logic
        db.prepare('DELETE FROM thermal_printer_settings WHERE business_id = ? AND branch_id = ?').run(businessId, branchId);
        // Insert new settings
        db.prepare(`
          INSERT INTO thermal_printer_settings (${columns.join(', ')}) 
          VALUES (${placeholders})
        `).run(...values);
      });

      saveTransaction();
      
      res.json({ success: true });
    } catch (error: any) {
      logError('Error saving thermal printer settings', error);
      console.error('Error saving thermal printer settings:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  app.post("/api/import-products", (req, res) => {
    const { products } = req.body;
    const businessId = 1;
    const branchId = req.user ? req.user.branch_id : 1; // Default for now

    try {
      db.transaction(() => {
        for (const p of products) {
          // 1. Find or create branch
          let branch = db.prepare("SELECT id FROM branches WHERE business_id = ? AND branch_id = ? AND name = ?").get(businessId, branchId, p.branch_name);
          if (!branch) {
            const result = db.prepare("INSERT INTO branches (business_id, name) VALUES (?, ?)").run(businessId, branchId, p.branch_name);
            branch = { id: result.lastInsertRowid };
          }

          // 2. Find or create category
          let categoryId = null;
          if (p.category_name) {
            let category = db.prepare("SELECT id FROM categories WHERE business_id = ? AND branch_id = ? AND name = ?").get(businessId, branchId, p.category_name);
            if (!category) {
              const result = db.prepare("INSERT INTO categories (business_id, name) VALUES (?, ?)").run(businessId, branchId, p.category_name);
              categoryId = result.lastInsertRowid;
            } else {
              categoryId = category.id;
            }
          }

          // 3. Find or create manufacturer
          let manufacturerId = null;
          if (p.manufacturer_name) {
            let manufacturer = db.prepare("SELECT id FROM manufacturers WHERE business_id = ? AND branch_id = ? AND name = ?").get(businessId, branchId, p.manufacturer_name);
            if (!manufacturer) {
              const result = db.prepare("INSERT INTO manufacturers (business_id, name) VALUES (?, ?)").run(businessId, branchId, p.manufacturer_name);
              manufacturerId = result.lastInsertRowid;
            } else {
              manufacturerId = manufacturer.id;
            }
          }

          // 4. Find or create product
          // Map product type
          let productType = 'stock';
          if (p.product_type === 'Mobile Devices') productType = 'serialized';
          else if (p.product_type === 'Labor/Services') productType = 'service';
          
          let product = db.prepare("SELECT id FROM products WHERE business_id = ? AND branch_id = ? AND name = ?").get(businessId, branchId, p.product_name);
          let productId;
          if (!product) {
            const result = db.prepare(`
              INSERT INTO products (business_id, category_id, manufacturer_id, name, product_type, allow_overselling)
              VALUES (?, ?, ?, ?, ?, ?)
            `).run(businessId, branchId, categoryId, manufacturerId, p.product_name, productType, p.allow_overselling === 'Yes' ? 1 : 0);
            productId = result.lastInsertRowid;
          } else {
            productId = product.id;
            // Update existing product if needed
            db.prepare("UPDATE products SET category_id = ?, manufacturer_id = ?, product_type = ?, allow_overselling = ? WHERE id = ?")
              .run(categoryId, manufacturerId, productType, p.allow_overselling === 'Yes' ? 1 : 0, productId);
          }

          // 5. Find or create SKU
          let sku = db.prepare("SELECT id FROM product_skus WHERE product_id = ? AND sku_code = ?").get(productId, p.sku);
          let skuId;
          if (!sku) {
            const result = db.prepare(`
              INSERT INTO product_skus (product_id, sku_code, cost_price, selling_price)
              VALUES (?, ?, ?, ?)
            `).run(productId, p.sku, parseFloat(p.cost_price) || 0, parseFloat(p.selling_price) || 0);
            skuId = result.lastInsertRowid;
          } else {
            skuId = sku.id;
            db.prepare("UPDATE product_skus SET cost_price = ?, selling_price = ? WHERE id = ?")
              .run(parseFloat(p.cost_price) || 0, parseFloat(p.selling_price) || 0, skuId);
          }

          // 6. Update branch stock
          const quantity = parseInt(p.current_inventory) || 0;
          db.prepare(`
            INSERT INTO branch_stock (sku_id, branch_id, quantity)
            VALUES (?, ?, ?)
            ON CONFLICT(sku_id, branch_id) DO UPDATE SET quantity = ?
          `).run(skuId, branch.id, quantity, quantity);
        }
      })();
      res.json({ success: true });
    } catch (error) {
      console.error('Error importing products:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/search", (req, res) => {
    const query = req.query.q as string;
    const type = req.query.type as string;
    if (!query || query.length < 2) return res.json([]);

    if (type === 'customers') {
      const customers = db.prepare(`
        SELECT * FROM customers 
        WHERE (name LIKE ? OR phone LIKE ? OR email LIKE ?)
        AND business_id = 1
        AND deleted_at IS NULL
        LIMIT 15
      `).all(`%${query}%`, `%${query}%`, `%${query}%`);
      return res.json(customers);
    }

    // Search by Name or SKU in product_skus/products
    const products = db.prepare(`
      SELECT 
        s.id as id,
        p.name as product_name,
        s.sku_code,
        s.barcode,
        s.selling_price,
        p.product_type,
        p.allow_overselling,
        (SELECT SUM(quantity) FROM branch_stock WHERE sku_id = s.id) as total_stock
      FROM product_skus s
      JOIN products p ON s.product_id = p.id
      WHERE (p.name LIKE ? OR s.sku_code LIKE ? OR s.barcode LIKE ?)
      AND p.deleted_at IS NULL
      LIMIT 15
    `).all(`%${query}%`, `%${query}%`, `%${query}%`);

    // Search by IMEI in devices
    const devices = db.prepare(`
      SELECT 
        s.id as id,
        p.name as product_name,
        s.sku_code,
        s.barcode,
        s.selling_price,
        p.product_type,
        p.allow_overselling,
        d.imei,
        d.id as device_id,
        1 as total_stock
      FROM devices d
      JOIN product_skus s ON d.sku_id = s.id
      JOIN products p ON s.product_id = p.id
      WHERE (d.imei LIKE ? OR p.name LIKE ? OR s.sku_code LIKE ?) AND d.status = 'in_stock'
      LIMIT 15
    `).all(`%${query}%`, `%${query}%`, `%${query}%`);

    // Combine results - prioritize devices if searching by IMEI
    const results: any[] = [];
    
    // Add devices first if they match the query well
    devices.forEach((d: any) => {
      results.push(d);
    });

    // Add products, but avoid duplicates if the device already covers it
    // Actually, it's better to show the product SKU separately too if it's not a specific device search
    products.forEach((p: any) => {
      // If we already have devices for this SKU, we still might want to show the generic SKU 
      // but only if it's not a serialized product (because serialized products MUST have an IMEI)
      // Actually, for serialized products, showing the SKU is fine because clicking it now opens the IMEI selector.
      const alreadyAdded = results.find(r => r.id === p.id && !r.device_id);
      if (!alreadyAdded) {
        results.push(p);
      }
    });

    res.json(results);
  });

  // Purchase Orders
  app.get("/api/purchase-orders", (req, res) => {
    const pos = db.prepare(`
      SELECT po.*, s.name as supplier_name
      FROM purchase_orders po
      LEFT JOIN suppliers s ON po.supplier_id = s.id
      WHERE po.business_id = 1
      ORDER BY po.created_at DESC
    `).all();
    res.json(pos);
  });

  app.get("/api/purchase-orders/:id", (req, res) => {
    const po = db.prepare(`
      SELECT po.*, s.name as supplier_name, s.email as supplier_email
      FROM purchase_orders po
      LEFT JOIN suppliers s ON po.supplier_id = s.id
      WHERE po.id = ? AND po.business_id = 1
    `).get(req.params.id);

    if (!po) {
      return res.status(404).json({ error: "Purchase order not found" });
    }

    const items = db.prepare(`
      SELECT * FROM purchase_order_items WHERE po_id = ?
    `).all(req.params.id);

    res.json({ ...po, items });
  });

  app.get("/api/purchase-orders/by-number/:number", (req, res) => {
    const po = db.prepare(`
      SELECT id FROM purchase_orders WHERE po_number = ? AND business_id = 1
    `).get(req.params.number);

    if (!po) {
      return res.status(404).json({ error: "Purchase order not found" });
    }

    res.json(po);
  });

  // Repairs (Jobs in new schema)
  app.get("/api/repairs", (req, res) => {
    const repairs = db.prepare(`
      SELECT j.*, c.name as customer_name 
      FROM jobs j
      LEFT JOIN customers c ON j.customer_id = c.id
      WHERE j.business_id = 1
      ORDER BY j.created_at DESC
    `).all();
    res.json(repairs);
  });

  app.post("/api/repairs", (req, res) => {
    const { customer_id, device_model, issue, status } = req.body;
    const result = db.prepare(`
      INSERT INTO jobs (business_id, branch_id, customer_id, device_model, issue, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(1, 1, customer_id, device_model, issue, status || 'new');

    if (customer_id) {
      db.prepare(`
        INSERT INTO customer_activity (customer_id, user_id, activity, details)
        VALUES (?, ?, ?, ?)
      `).run(customer_id, 1, 'Repair Job Created', `New repair job for ${device_model}: ${issue}`);
    }

    res.json({ id: result.lastInsertRowid });
  });

  // Devices (Serialized)
  app.get("/api/devices", (req, res) => {
    const status = req.query.status || 'in_stock';
    const devices = db.prepare(`
      SELECT 
        d.id,
        d.sku_id,
        d.imei,
        d.color,
        d.gb,
        d.condition,
        d.po_number,
        d.status,
        d.created_at,
        p.name as product_name,
        s.sku_code,
        inv.invoice_number
      FROM devices d
      JOIN product_skus s ON d.sku_id = s.id
      JOIN products p ON s.product_id = p.id
      LEFT JOIN invoice_items ii ON d.id = ii.device_id
      LEFT JOIN invoices inv ON ii.invoice_id = inv.id
      WHERE d.business_id = 1 AND d.status = ?
      ORDER BY d.created_at DESC
    `).all(status);
    res.json(devices);
  });

  app.get("/api/products/:skuId/devices", (req, res) => {
    const { skuId } = req.params;
    try {
      const devices = db.prepare(`
        SELECT 
          d.id,
          d.imei,
          d.color,
          d.gb,
          d.condition,
          d.status,
          d.created_at,
          inv.invoice_number
        FROM devices d
        LEFT JOIN invoice_items ii ON d.id = ii.device_id
        LEFT JOIN invoices inv ON ii.invoice_id = inv.id
        WHERE d.sku_id = ?
        ORDER BY d.created_at DESC
      `).all(skuId);
      res.json(devices);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/products/:skuId/available-devices", (req, res) => {
    const { skuId } = req.params;
    try {
      const devices = db.prepare(`
        SELECT id, imei, cost_price, status, created_at
        FROM devices
        WHERE sku_id = ? AND status = 'in_stock'
      `).all(skuId);
      res.json(devices);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================
  // AUTH ROUTES
  // ============================================================

  // Helper: simple session token (maps token -> user_id in memory)
  const sessions = new Map<string, number>();

  function requireAuth(req: any, res: any, next: any) {
    const token = req.headers['authorization']?.replace('Bearer ', '');
    if (!token || !sessions.has(token)) return res.status(401).json({ error: 'Unauthorized' });
    const userId = sessions.get(token);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.userId = userId;
    req.user = user;
    next();
  }

  function requireAdmin(req: any, res: any, next: any) {
    const token = req.headers['authorization']?.replace('Bearer ', '');
    if (!token || !sessions.has(token)) return res.status(401).json({ error: 'Unauthorized' });
    const userId = sessions.get(token);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
    if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    req.userId = userId;
    req.user = user;
    next();
  }

  // POST /api/auth/signup
  app.post('/api/auth/signup', async (req, res) => {
    const { name, email, password, branch_id } = req.body;
    if (!name || !email || !password || !branch_id) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    try {
      const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
      if (existing) return res.status(409).json({ error: 'An account with this email already exists' });

      const password_hash = await bcrypt.hash(password, 10);
      const result = db.prepare(`
        INSERT INTO users (business_id, branch_id, name, email, password, password_hash, role, status)
        VALUES (1, ?, ?, ?, ?, ?, 'staff', 'pending')
      `).run(branch_id, name, email, password, password_hash);

      // Send pending notification (fire and forget)
      import('./src/services/mailer.ts').then(m => m.sendAccountPending({ name, email })).catch(() => {});

      res.json({ success: true, message: 'Account created. Awaiting admin approval.' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/auth/login
  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    try {
      const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
      if (!user) return res.status(401).json({ error: 'Invalid email or password' });

      if (user.status === 'pending') return res.status(403).json({ error: 'Your account is pending admin approval. You will receive an email once approved.' });
      if (user.status === 'rejected') return res.status(403).json({ error: 'Your account registration was rejected. Please contact your administrator.' });
      if (user.status === 'inactive') return res.status(403).json({ error: 'Your account has been deactivated. Please contact your administrator.' });

      // Check bcrypt hash first, fallback to plain text for legacy accounts
      let valid = false;
      if (user.password_hash) {
        valid = await bcrypt.compare(password, user.password_hash);
      } else {
        valid = user.password === password;
        if (valid) {
          // Upgrade to bcrypt hash
          const hash = await bcrypt.hash(password, 10);
          db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, user.id);
        }
      }

      if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

      const token = crypto.randomUUID();
      sessions.set(token, user.id);
      db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);

      const branch = db.prepare('SELECT * FROM branches WHERE id = ?').get(user.branch_id) as any;
      res.json({
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status, branch_id: user.branch_id, branch_name: branch?.name }
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/auth/logout
  app.post('/api/auth/logout', (req, res) => {
    const token = req.headers['authorization']?.replace('Bearer ', '');
    if (token) sessions.delete(token);
    res.json({ success: true });
  });

  // GET /api/auth/me
  app.get('/api/auth/me', requireAuth, (req: any, res) => {
    const user = db.prepare('SELECT u.*, b.name as branch_name FROM users u LEFT JOIN branches b ON u.branch_id = b.id WHERE u.id = ?').get(req.userId) as any;
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { password, password_hash, reset_token, ...safeUser } = user;
    res.json(safeUser);
  });

  // POST /api/auth/forgot-password
  app.post('/api/auth/forgot-password', async (req, res) => {
    const { email } = req.body;
    // Always respond success to prevent email enumeration
    res.json({ success: true, message: 'If this email exists, a reset link has been sent.' });
    try {
      const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
      if (!user) return;
      const token = crypto.randomUUID();
      const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour
      db.prepare('UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?').run(token, expires, user.id);
      const resetLink = `http://localhost:3000/?reset_token=${token}`;
      import('./src/services/mailer.ts').then(m => m.sendPasswordReset({ name: user.name, email: user.email }, resetLink)).catch(() => {});
    } catch {}
  });

  // POST /api/auth/reset-password
  app.post('/api/auth/reset-password', async (req, res) => {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'Token and new password required' });
    try {
      const user = db.prepare('SELECT * FROM users WHERE reset_token = ?').get(token) as any;
      if (!user) return res.status(400).json({ error: 'Invalid or expired reset link' });
      if (new Date(user.reset_token_expires) < new Date()) {
        return res.status(400).json({ error: 'Reset link has expired. Please request a new one.' });
      }
      const password_hash = await bcrypt.hash(password, 10);
      db.prepare('UPDATE users SET password_hash = ?, password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?')
        .run(password_hash, password, user.id);
      res.json({ success: true, message: 'Password updated. You can now log in.' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================
  // ADMIN ROUTES
  // ============================================================

  // GET /api/admin/users
  app.get('/api/admin/users', requireAdmin, (req, res) => {
    const users = db.prepare(`
      SELECT u.id, u.name, u.email, u.role, u.status, u.last_login, u.created_at,
             b.name as branch_name, b.id as branch_id
      FROM users u
      LEFT JOIN branches b ON u.branch_id = b.id
      WHERE u.business_id = 1
      ORDER BY u.created_at DESC
    `).all();
    res.json(users);
  });

  // PUT /api/admin/users/:id/status
  app.put('/api/admin/users/:id/status', requireAdmin, async (req, res) => {
    const { status } = req.body;
    const userId = req.params.id;
    const validStatuses = ['approved', 'rejected', 'inactive', 'pending'];
    if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });
    try {
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
      if (!user) return res.status(404).json({ error: 'User not found' });
      db.prepare('UPDATE users SET status = ? WHERE id = ?').run(status, userId);

      // Send email notification
      const mailer = await import('./src/services/mailer.ts');
      try {
        if (status === 'approved') await mailer.sendAccountApproved({ name: user.name, email: user.email });
        else if (status === 'rejected') await mailer.sendAccountRejected({ name: user.name, email: user.email });
        else if (status === 'inactive') await mailer.sendAccountDeactivated({ name: user.name, email: user.email });
      } catch (emailErr) {
        console.warn('Email send failed (non-fatal):', emailErr.message);
      }

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // PUT /api/admin/users/:id
  app.put('/api/admin/users/:id', requireAdmin, async (req, res) => {
    const { name, branch_id, role, password } = req.body;
    const userId = req.params.id;
    try {
      if (password) {
        const password_hash = await bcrypt.hash(password, 10);
        db.prepare('UPDATE users SET name = ?, branch_id = ?, role = ?, password = ?, password_hash = ? WHERE id = ?')
          .run(name, branch_id, role, password, password_hash, userId);
      } else {
        db.prepare('UPDATE users SET name = ?, branch_id = ?, role = ? WHERE id = ?').run(name, branch_id, role, userId);
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // DELETE /api/admin/users/:id
  app.delete('/api/admin/users/:id', requireAdmin, (req, res) => {
    try {
      db.prepare('UPDATE users SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?').run(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/admin/branches
  app.get('/api/admin/branches', requireAdmin, (req, res) => {
    res.json(db.prepare('SELECT * FROM branches WHERE business_id = 1 AND deleted_at IS NULL').all());
  });

  // POST /api/admin/branches
  app.post('/api/admin/branches', requireAdmin, (req, res) => {
    const { name, address, phone } = req.body;
    try {
      const result = db.prepare('INSERT INTO branches (business_id, name, address, phone) VALUES (1, ?, ?, ?)').run(name, address, phone);
      res.json({ id: result.lastInsertRowid, name, address, phone });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================
  // SMTP SETTINGS ROUTES
  // ============================================================

  // GET /api/admin/smtp
  app.get('/api/admin/smtp', requireAdmin, (req, res) => {
    const settings = db.prepare('SELECT * FROM smtp_settings WHERE business_id = 1').get() as any;
    if (settings) {
      const { pass, ...safe } = settings; // Never return the password
      res.json({ ...safe, pass: pass ? '••••••••' : '' });
    } else {
      res.json({ host: 'smtp.hostinger.com', port: 465, secure: 1, user: '', pass: '', from_name: 'EPOS System', from_email: '' });
    }
  });

  // PUT /api/admin/smtp
  app.put('/api/admin/smtp', requireAdmin, (req, res) => {
    const { host, port, secure, user, pass, from_name, from_email } = req.body;
    try {
      const existing = db.prepare('SELECT id FROM smtp_settings WHERE business_id = 1').get() as any;
      if (existing) {
        // Only update pass if it's not the placeholder
        if (pass && pass !== '••••••••') {
          db.prepare('UPDATE smtp_settings SET host=?,port=?,secure=?,user=?,pass=?,from_name=?,from_email=? WHERE business_id=1')
            .run(host, port, secure ? 1 : 0, user, pass, from_name, from_email);
        } else {
          db.prepare('UPDATE smtp_settings SET host=?,port=?,secure=?,user=?,from_name=?,from_email=? WHERE business_id=1')
            .run(host, port, secure ? 1 : 0, user, from_name, from_email);
        }
      } else {
        db.prepare('INSERT INTO smtp_settings (business_id,host,port,secure,user,pass,from_name,from_email) VALUES (1,?,?,?,?,?,?,?)')
          .run(host, port, secure ? 1 : 0, user, pass, from_name, from_email);
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/admin/smtp/test
  app.post('/api/admin/smtp/test', requireAdmin, async (req: any, res) => {
    try {
      const admin = db.prepare('SELECT email FROM users WHERE id = ?').get(req.userId) as any;
      const mailer = await import('./src/services/mailer.ts');
      await mailer.sendTestEmail(admin.email);
      res.json({ success: true, message: `Test email sent to ${admin.email}` });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================
  // DEVICE TRANSFER ROUTES
  // ============================================================

  // POST /api/transfers
  app.post('/api/transfers', requireAuth, (req: any, res) => {
    const { device_id, sku_id, quantity, to_branch_id, notes } = req.body;
    if (!to_branch_id) return res.status(400).json({ error: 'Destination branch is required' });
    if (!device_id && !sku_id) return res.status(400).json({ error: 'Device or SKU is required' });
    try {
      const transaction = db.transaction(() => {
        let from_branch_id: any;
        if (device_id) {
          const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(device_id) as any;
          if (!device) throw new Error('Device not found');
          if (device.status !== 'in_stock') throw new Error('Device is not available for transfer (must be in_stock)');
          from_branch_id = device.branch_id;
          // Mark device as in-transit
          db.prepare("UPDATE devices SET status = 'transfer' WHERE id = ?").run(device_id);
        } else {
          const stock = db.prepare('SELECT * FROM branch_stock WHERE sku_id = ? AND quantity >= ?').get(sku_id, quantity || 1) as any;
          if (!stock) throw new Error('Insufficient stock for transfer');
          from_branch_id = stock.branch_id;
        }

        if (String(from_branch_id) === String(to_branch_id)) throw new Error('Source and destination branches must be different');

        const result = db.prepare(`
          INSERT INTO device_transfers (business_id, from_branch_id, to_branch_id, device_id, sku_id, quantity, status, initiated_by, notes)
          VALUES (1, ?, ?, ?, ?, ?, 'in_transit', ?, ?)
        `).run(from_branch_id, to_branch_id, device_id || null, sku_id || null, quantity || 1, req.userId, notes || null);

        return result.lastInsertRowid;
      });

      const id = transaction();
      res.json({ success: true, id });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // GET /api/transfers
  app.get('/api/transfers', requireAuth, (req, res) => {
    try {
      const transfers = db.prepare(`
        SELECT 
          t.*,
          fb.name as from_branch_name,
          tb.name as to_branch_name,
          d.imei,
          d.color,
          d.gb,
          d.condition,
          p.name as product_name,
          s.sku_code,
          u.name as initiated_by_name
        FROM device_transfers t
        LEFT JOIN branches fb ON t.from_branch_id = fb.id
        LEFT JOIN branches tb ON t.to_branch_id = tb.id
        LEFT JOIN devices d ON t.device_id = d.id
        LEFT JOIN product_skus s ON COALESCE(d.sku_id, t.sku_id) = s.id
        LEFT JOIN products p ON s.product_id = p.id
        LEFT JOIN users u ON t.initiated_by = u.id
        WHERE t.business_id = 1
        ORDER BY t.created_at DESC
      `).all();
      res.json(transfers);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // PUT /api/transfers/:id/complete
  app.put('/api/transfers/:id/complete', requireAuth, (req, res) => {
    try {
      const transfer = db.prepare('SELECT * FROM device_transfers WHERE id = ?').get(req.params.id) as any;
      if (!transfer) return res.status(404).json({ error: 'Transfer not found' });
      if (transfer.status === 'completed') return res.status(400).json({ error: 'Transfer already completed' });

      const transaction = db.transaction(() => {
        db.prepare("UPDATE device_transfers SET status='completed', completed_at=CURRENT_TIMESTAMP WHERE id=?").run(transfer.id);
        
        if (transfer.device_id) {
          // Move serialized device to new branch
          db.prepare("UPDATE devices SET branch_id=?, status='in_stock' WHERE id=?").run(transfer.to_branch_id, transfer.device_id);
          // Update branch_stock
          const device = db.prepare('SELECT sku_id FROM devices WHERE id = ?').get(transfer.device_id) as any;
          db.prepare(`
            INSERT INTO branch_stock (branch_id, sku_id, quantity) VALUES (?, ?, -1)
            ON CONFLICT(branch_id, sku_id) DO UPDATE SET quantity = quantity - 1
          `).run(transfer.from_branch_id, device.sku_id);
          db.prepare(`
            INSERT INTO branch_stock (branch_id, sku_id, quantity) VALUES (?, ?, 1)
            ON CONFLICT(branch_id, sku_id) DO UPDATE SET quantity = quantity + 1
          `).run(transfer.to_branch_id, device.sku_id);
        } else if (transfer.sku_id) {
          // Move stock units
          db.prepare(`
            INSERT INTO branch_stock (branch_id, sku_id, quantity) VALUES (?, ?, -?)
            ON CONFLICT(branch_id, sku_id) DO UPDATE SET quantity = quantity - ?
          `).run(transfer.from_branch_id, transfer.sku_id, transfer.quantity, transfer.quantity);
          db.prepare(`
            INSERT INTO branch_stock (branch_id, sku_id, quantity) VALUES (?, ?, ?)
            ON CONFLICT(branch_id, sku_id) DO UPDATE SET quantity = quantity + ?
          `).run(transfer.to_branch_id, transfer.sku_id, transfer.quantity, transfer.quantity);
        }

        // Log inventory movement
        db.prepare(`
          INSERT INTO inventory_movements (business_id, branch_id, sku_id, device_id, movement_type, quantity, reference_type, reference_id)
          VALUES (1, ?, ?, ?, 'transfer_in', ?, 'device_transfer', ?)
        `).run(transfer.to_branch_id, transfer.sku_id, transfer.device_id, transfer.quantity || 1, transfer.id);
      });

      transaction();
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // PUT /api/transfers/:id/cancel
  app.put('/api/transfers/:id/cancel', requireAuth, (req, res) => {
    try {
      const transfer = db.prepare('SELECT * FROM device_transfers WHERE id = ?').get(req.params.id) as any;
      if (!transfer) return res.status(404).json({ error: 'Transfer not found' });
      if (transfer.status === 'completed') return res.status(400).json({ error: 'Cannot cancel a completed transfer' });

      const transaction = db.transaction(() => {
        db.prepare("UPDATE device_transfers SET status='cancelled' WHERE id=?").run(transfer.id);
        if (transfer.device_id) {
          db.prepare("UPDATE devices SET status='in_stock' WHERE id=?").run(transfer.device_id);
        }
      });
      transaction();
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/transfers/device/:imei
  app.get('/api/transfers/device/:imei', requireAuth, (req, res) => {
    try {
      const device = db.prepare('SELECT * FROM devices WHERE imei = ?').get(req.params.imei) as any;
      if (!device) return res.status(404).json({ error: 'No device found with this IMEI' });

      const transfers = db.prepare(`
        SELECT 
          t.*,
          fb.name as from_branch_name,
          tb.name as to_branch_name,
          u.name as initiated_by_name
        FROM device_transfers t
        LEFT JOIN branches fb ON t.from_branch_id = fb.id
        LEFT JOIN branches tb ON t.to_branch_id = tb.id
        LEFT JOIN users u ON t.initiated_by = u.id
        WHERE t.device_id = ?
        ORDER BY t.created_at DESC
      `).all(device.id);

      const currentBranch = db.prepare('SELECT * FROM branches WHERE id = ?').get(device.branch_id);

      res.json({ device, currentBranch, transfers });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/devices/search?imei=...&branch_id=...
  app.get('/api/devices/search', requireAuth, (req, res) => {
    const { imei, branch_id } = req.query as any;
    try {
      let query = `
        SELECT d.*, p.name as product_name, s.sku_code, b.name as branch_name
        FROM devices d
        JOIN product_skus s ON d.sku_id = s.id
        JOIN products p ON s.product_id = p.id
        LEFT JOIN branches b ON d.branch_id = b.id
        WHERE d.status = 'in_stock'
      `;
      const params: any[] = [];
      if (imei) { query += " AND d.imei LIKE ?"; params.push(`%${imei}%`); }
      if (branch_id) { query += " AND d.branch_id = ?"; params.push(branch_id); }
      query += " LIMIT 20";
      res.json(db.prepare(query).all(...params));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {

    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
