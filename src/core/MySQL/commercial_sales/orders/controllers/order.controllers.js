import { Order } from "../models/Order.js";
import { Company } from "../../../../Mongo/companies/models/Company.js";

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const create_order = async (req, res) => {
  try {
    const {
      company_id,
      customer_id,
      warehose_id,
      order_number,
      delivery_date,
      notes,
      user_id,
      items,
    } = req.body;

    if (!company_id || !items?.length)
      return res
        .status(400)
        .json({ status: false, message: "Empresa y productos son requeridos" });

    let subtotal = 0;
    let tax = 0;
    let discount = 0;

    const processedItems = items.map((item) => {
      const quantity = Number(item.quantity);
      const unit_price = Number(item.unit_price);
      const itemDiscount = Number(item.discount || 0);
      const itemTax = Number(item.tax || 0);

      const itemSubtotal = quantity * unit_price;

      const itemTotal = itemSubtotal - itemDiscount + itemTax;

      subtotal += itemSubtotal;
      discount += itemDiscount;
      tax += itemTax;

      return {
        ...item,
        quantity,
        unit_price,
        discount: itemDiscount,
        tax: itemTax,
        subtotal: itemSubtotal,
        total: itemTotal,
      };
    });

    const total = subtotal - discount + tax;

    const new_order = new Order({
      company_id,
      customer_id,
      warehose_id,
      order_number: order_number || `PED-${Date.now()}`,
      delivery_date,
      subtotal,
      tax,
      discount,
      total,
      status: "draft",
      notes,
      user_id,
      items: processedItems,
    });

    const data = await new_order.save();
    res
      .status(201)
      .json({ status: true, message: "Pedido creado correctamente", data });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const confirm_order = async (req, res) => {
  try {
    const { company_id, id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const order = await Order.findById(id, company_id);
    if (!order)
      return res
        .status(404)
        .json({ status: false, message: "Pedido no encontrado" });

    if (order.status !== "draft")
      return res.status(400).json({
        status: false,
        message: "Solo se pueden confirmar pedidos en draft",
      });

    await Order.updateStatus(id, company_id, "confirmed");
    res
      .status(200)
      .json({ status: true, message: "Pedido confirmado correctamente" });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const process_order = async (req, res) => {
  try {
    const { company_id, id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const order = await Order.findById(id, company_id);
    if (!order)
      return res
        .status(404)
        .json({ status: false, message: "Pedido no encontrado" });

    if (order.status !== "confirmed")
      return res
        .status(400)
        .json({ status: false, message: "El pedido debe estar confirmado" });

    await Order.updateStatus(id, company_id, "processing");
    res.status(200).json({ status: true, message: "Pedido en proceso" });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const ready_order = async (req, res) => {
  try {
    const { company_id, id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const order = await Order.findById(id, company_id);
    if (!order)
      return res
        .status(404)
        .json({ status: false, message: "Pedido no encontrado" });

    if (order.status !== "processing")
      return res.status(400).json({
        status: false,
        message: "El pedido debe estar en procesamiento",
      });

    await Order.updateStatus(id, company_id, "ready");
    res.status(200).json({ status: true, message: "Pedido listo" });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const deliver_order = async (req, res) => {
  try {
    const { company_id, id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const order = await Order.findById(id, company_id);
    if (!order)
      return res
        .status(404)
        .json({ status: false, message: "Pedido no encontrado" });

    if (order.status !== "ready")
      return res
        .status(400)
        .json({ status: false, message: "El pedido debe estar listo" });

    await Order.updateStatus(id, company_id, "delivered");
    res
      .status(200)
      .json({ status: true, message: "Pedido entregado correctamente" });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};
