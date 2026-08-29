import { Promotion } from "../models/Promotion.js";
import { Company } from "../../../../Mongo/companies/models/Company.js";

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const create_promotion = async (req, res) => {
  try {
    const {
      company_id,
      name,
      description,
      type,
      value,
      minimum_amount,
      start_date,
      end_date,
      usage_limit,
      products,
    } = req.body;

    if (!company_id || !name || !type || value === undefined || !start_date)
      return res
        .status(400)
        .json({
          status: false,
          message: "Los datos de la promocion son requeridos",
        });

    if (!["percentaje", "fixed"].includes(type))
      return res
        .status(400)
        .json({ status: false, message: "Tipo de promocion invalido" });

    if (type === "percentaje" && Number(value) > 100)
      return res
        .status(400)
        .json({ status: false, message: "El procentaje no puede superar 100" });

    const new_promotion = new Promotion({
      company_id,
      name,
      description,
      type,
      value: Number(value),
      minimum_amount: Number(minimum_amount || 0),
      start_date,
      end_date,
      usage_limit,
      products: products || [],
    });

    const data = await new_promotion.save();
    res
      .status(201)
      .json({ status: true, message: "Promocion creada correctamente", data });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};
