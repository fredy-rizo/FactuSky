import { Sale } from "../models/Sale.js";
import { Company } from "../../../Mongo/companies/models/Company.js";
import { text } from "express";

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const create_sale = async (req, res) => {
  try {
    const {
      company_id,
      customer_id,
      warehouse_id,
      payment_method_id,
      invoice_number,
      sale_date,
      subtotal,
      tax,
      discount,
      total,
      payment_status,
      notes,
      user_id,
      status,
      items,
    } = req.body;

    if (
      !company_id ||
      !warehouse_id ||
      !items ||
      !Array.isArray(items) ||
      items.length === 0
    )
      return res.status(400).json({
        status: false,
        message: "Empresa, bodega y productos son requeridos",
      });

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const calculatedSubtotal = items.reduce(
      (sum, item) => sum + Number(item.quantity) * Number(item.unit_price ?? item.price ?? 0),
      0,
    );

    const saleSubtotal =
      subtotal !== undefined ? Number(subtotal) : calculatedSubtotal;
    const saleTax = tax !== undefined ? Number(tax) : 0;
    const saleDiscount = discount !== undefined ? Number(discount) : 0;
    const saleTotal =
      total !== undefined
        ? Number(total)
        : saleSubtotal + saleTax * saleDiscount;

    const processedItems = items.map((item) => {
      const unitPrice = Number(item.unit_price ?? item.price ?? 0);
      const itemSubtotal = Number(item.quantity) * unitPrice;

      const itemDiscount = Number(item.discount || 0);
      const itemTax = Number(item.tax || 0);
      const itemTotal = itemSubtotal + itemTax - itemDiscount;

      return {
        product_id: item.product_id,
        quantity: Number(item.quantity),
        unit_price: unitPrice,
        discount: itemDiscount,
        tax: itemTax,
        subtotal: itemSubtotal,
        total: itemTotal,
      };
    });

    const new_sale = new Sale({
      company_id,
      customer_id,
      warehouse_id,
      payment_method_id,
      invoice_number,
      sale_date,
      subtotal: saleSubtotal,
      tax: saleTax,
      discount: saleDiscount,
      total: saleTotal,
      status: status || "draft",
      payment_status: payment_status || "pending",
      notes,
      user_id,
      items: processedItems,
    });

    const data = await new_sale.save();
    res
      .status(201)
      .json({ status: true, message: "Venta creada correctamente", data });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const lists_sales = async (req, res) => {
  try {
    const { company_id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const cant = await Sale.count(company_id);
    const data = await Sale.findAll(
      company_id,
      req.body.skippag,
      req.body.limit,
    );

    res.status(200).json({
      status: true,
      message: "Cargando ventas...",
      data,
      pagination: {
        pag: req.params.pag,
        perpage: req.body.limit,
        pags: Math.ceil(cant / req.body.limit),
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const list_sale = async (req, res) => {
  try {
    const { company_id, id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const data = await Sale.findById(id, company_id);
    if (!data)
      return res
        .status(404)
        .json({ status: false, message: "Venta no encontrada" });

    res.status(200).json({ status: true, message: "Cargando venta...", data });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const update_sale = async (req, res) => {
  try {
    const { company_id, id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const sale = await Sale.findById(id, company_id);
    if (!sale)
      return res
        .status(404)
        .json({ status: false, message: "Venta no encontrada" });

    if (sale.status !== "draft")
      return res.status(400).json({
        status: false,
        message: "Solo se pueden modificar ventas en estado 'draft'",
      });

    await Sale.update(id, company_id, req.body);

    const data = await Sale.findById(id, company_id);
    res
      .status(200)
      .json({ status: true, message: "Venta actualizada correctamente", data });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const cancel_sale = async (req, res) => {
  try {
    const { company_id, id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const sale = await Sale.findById(id, company_id);
    if (!sale)
      return res
        .status(404)
        .json({ status: false, message: "Venta no encontrada" });

    if (!["draft", "confirmed"].includes(sale.status))
      return res
        .status(400)
        .json({ status: false, message: "Esta venta no puede ser cancelada" });

    await Sale.cancel(id, company_id);
    res
      .status(200)
      .json({ status: true, message: "Venta cancelada correctamente" });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const confirm_sale = async (req, res) => {
  try {
    const { company_id, id } = req.params;

    const company_data = await Company.findById(company_id);

    if (!company_data) {
      return res.status(404).json({
        status: false,
        message: "Empresa no encontrada",
      });
    }

    const sale = await Sale.findById(id, company_id);

    if (!sale) {
      return res.status(404).json({
        status: false,
        message: "Venta no encontrada",
      });
    }

    if (sale.status !== "draft") {
      return res.status(400).json({
        status: false,
        message: "Solo se pueden confirmar ventas en estado 'draft'",
      });
    }

    await Sale.confirm(id, company_id);

    const data = await Sale.findById(id, company_id);

    return res.status(200).json({
      status: true,
      message: "Venta confirmada correctamente",
      data,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};
