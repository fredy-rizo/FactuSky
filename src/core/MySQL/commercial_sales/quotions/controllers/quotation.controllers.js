import { Quotation } from "../models/Quotation.js";
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
