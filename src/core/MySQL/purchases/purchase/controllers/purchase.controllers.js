import { Purchase } from "../models/Purchase.js";
import { Company } from "../../../../Mongo/companies/models/Company.js";

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const create_purchase = async (req, res) => {
  try {
    const {
      company_id,
      supplier_id,
      warehouse_id,
      invoice_number,
      purchase_date,
      subtotal,
      tax,
      discount,
      total,
      status,
      payment_status,
      notes,
      user_id,
      items,
    } = req.body;

    if (
      !company_id ||
      !supplier_id ||
      !warehouse_id ||
      !items ||
      !Array.isArray(items) ||
      items.length === 0
    )
      return res.status(400).json({
        status: false,
        message: "Empresa, proveedor, bodega y productos son requeridos",
      });

    const calculatedSubtotal = items.reduce(
      (sum, item) => sum + Number(item.quantity) * Number(item.unit_cost),
    );

    const purchaseSubtotal =
      subtotal !== undefined ? Number(subtotal) : calculatedSubtotal;
    const purchaseTax = tax !== undefined ? Number(tax) : 0;
    const purchaseDiscount = discount !== undefined ? Number(discount) : 0;
    const purchaseTotal =
      total !== undefined
        ? Number(total)
        : purchaseSubtotal + purchaseTax - purchaseDiscount;

    const new_purchase = new Purchase({
      company_id,
      supplier_id,
      warehouse_id,
      invoice_number,
      purchase_date,
      subtotal: purchaseSubtotal,
      tax: purchaseTax,
      discount: purchaseDiscount,
      total: purchaseTotal,
      status: status || "draft",
      payment_status: payment_status || "pending",
      notes,
      user_id,
      items,
    });

    const data = await new_purchase.save();
    res
      .status(201)
      .json({ status: true, message: "Compra creada correctamente", data });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const lists_purchases = async (req, res) => {
  try {
    const { company_id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(500)
        .json({ status: false, message: "Empresa no encontrada" });

    const cant = await Purchase.count(company_id);
    const data = await Purchase.findAll(
      company_id,
      req.body.skippag,
      req.body.limit,
    );

    res.status(200).json({
      status: true,
      message: "Cargando compras...",
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

export const list_purchase = async (req, res) => {
  try {
    const { company_id, id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const data = await Purchase.findById(id, company_id);
    if (!data)
      return res
        .status(404)
        .json({ status: false, message: "Compra no encontrada" });

    res.status(200).json({ status: true, message: "Cargando compra...", data });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const update_purchase = async (req, res) => {
  try {
    const { company_id, id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const purchase = await Purchase.findById(id, company_id);
    if (!purchase)
      return res
        .status(404)
        .json({ status: false, message: "Compra no encontrada" });

    if (purchase.status !== "draft")
      return res.status(400).json({
        status: false,
        message: "Solo se pueden modificar compras en estado 'draft'",
      });

    await Purchase.update(id, company_id, req.body);

    const data = await Purchase.findById(id, company_id);

    res.status(200).json({
      status: true,
      message: "Compra actualizada correctamente",
      data,
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

export const cancel_purchase = async (req, res) => {
  try {
    const { company_id, id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const purchase = await Purchase.findById(id, company_id);
    if (!purchase)
      return res
        .status(404)
        .json({ status: false, message: "Compra no encontrada" });

    if (!["draft", "confirmed"].includes(purchase.status))
      return res
        .status(400)
        .json({ status: false, message: "Esta compra no puede ser cancelada" });

    await Purchase.cancel(id, company_id);
    res
      .status(200)
      .json({ status: true, message: "Compra cancelada correctamente" });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};
