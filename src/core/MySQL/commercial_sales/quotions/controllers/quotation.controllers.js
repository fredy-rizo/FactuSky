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
