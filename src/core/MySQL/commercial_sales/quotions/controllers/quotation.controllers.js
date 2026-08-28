import { Quotation } from "../models/Quotation.js";
import { Order } from "../../orders/models/Order.js";
import { Company } from "../../../../Mongo/companies/models/Company.js";

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const create_quotation = async (req, res) => {
  try {
    const {
      company_id,
      customer_id,
      warehouse_id,
      quotation_number,
      quotation_date,
      expiration_date,
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
    const new_quotation = new Quotation({
      company_id,
      customer_id,
      warehouse_id,
      quotation_number,
      quotation_date,
      expiration_date,
      subtotal,
      tax,
      discount,
      total,
      notes,
      user_id,
      items: processedItems,
    });

    const data = await new_quotation.save();
    return res
      .status(201)
      .json({ status: 201, message: "Cotizacion creada correctamente", data });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const lists_quotations = async (req, res) => {
  try {
    const { company_id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const cant = await Quotation.count(company_id);
    const data = await Quotation.findAll(
      company_id,
      req.body.skippag,
      req.body.limit,
    );

    res.status(200).json({
      status: true,
      message: "Cargando cotizaciones...",
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

export const list_quotation = async (req, res) => {
  try {
    const { company_id, id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const data = await Quotation.findById(id, company_id);
    if (!data)
      return res
        .status(404)
        .json({ status: false, message: "Cotizacion no encontrada" });

    res
      .status(200)
      .json({ status: true, message: "Cargando cotizacion...", data });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const send_quotation = async (req, res) => {
  try {
    const { company_id, id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const quotation = await Quotation.findById(id, company_id);
    if (!quotation)
      return res
        .status(404)
        .json({ status: false, message: "Cotizacion no encontrada" });

    if (quotation.status !== "draft")
      return res.status(400).json({
        status: false,
        message: "Solo se pueden enviar cotizaciones en estado draft",
      });

    await Quotation.updateStatus(id, company_id, "sent");

    res.status(200).json({
      status: true,
      message: "Cotizacion enviada correctamente",
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

export const accept_quotation = async (req, res) => {
  try {
    const { company_id, id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const quotation = await Quotation.findById(id, company_id);
    if (!quotation)
      return res
        .status(404)
        .json({ status: false, message: "Cotizacion no encontrada" });

    if (quotation.status !== "sent")
      return res.status(400).json({
        status: false,
        message: "Solo se pueden aceptar cotizaciones enviadas",
      });

    await Quotation.updateStatus(id, company_id, "accepted");

    res
      .status(200)
      .json({ status: true, message: "Cotizacion aceptada correctamente" });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const reject_quotation = async (req, res) => {
  try {
    const { company_id, id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const quotation = await Quotation.findById(id, company_id);
    if (!quotation)
      return res
        .status(404)
        .json({ status: false, message: "Cotizacion no encontrada" });

    await Quotation.updateStatus(id, company_id, "rejected");

    res.status(200).json({ status: true, message: "Cotizacion rechazada" });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const convert_quotation_to_order = async (req, res) => {
  try {
    const { company_id, id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const quotation = await Quotation.findById(id, company_id);
    if (!quotation)
      return res
        .status(404)
        .json({ status: false, message: "Cotizacion no encontrada" });

    if (!["accepted"].includes(quotation.status))
      return res
        .status(400)
        .json({
          status: false,
          message:
            "La cotizacion debe estar aceptada para convertirse en pedido",
        });

    const new_order = new Order({
      company_id,
      customer_id: quotation.customer_id,
      warehouse_id: quotation.warehouse_id,
      quotation: quotation.id,
      order_number: req.body.order_number || `PED-${Date.now()}`,
      order_date: new Date(),
      delivery_date: req.body.delivery_date || null,
      subtotal: quotation.subtotal,
      tax: quotation.tax,
      discount: quotation.discount,
      total: quotation.total,
      status: "draft",
      notes: quotation.notes,
      user_id: req.body.user_id,
      items: quotation.items.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount: item.discount,
        tax: item.tax,
        subtotal: item.subtotal,
        total: item.total,
      })),
    });

    const data = await new_order.save();
    await Quotation.updateStatus(id, company_id, "converted");

    res
      .status(201)
      .json({
        status: true,
        message: "Cotizacion convertida en pedido correctamente",
        data,
      });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};
