import { Company } from "../../../../../Mongo/companies/models/Company.js";
import { RestaurantIntegration } from "../models/RestaurantIntegration.js";

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const create_restaurant_sale = async (req, res) => {
  try {
    const { company_id, order_id } = req.params;
    const { user_id, payment_method_id, cash_opening_id } = req.body;

    const company = await Company.findById(company_id);
    if (!company)
      return res.status(400).json({ message: "Empresa no encontrada" });

    if (!cash_opening_id)
      return res.status(400).json({
        status: false,
        message: "cash_opening_id es requerido",
      });

    const data = await RestaurantIntegration.createSaleFromOrder({
      company_id,
      order_id,
      user_id,
      payment_method_id,
      cash_opening_id,
    });
    res.status(201).json({
      status: true,
      message: "Venta de restaurante creada correctamente",
      data,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};
