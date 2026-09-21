import { RestaurantQrCode } from "../models/RestaurantQrCode.js";
import { Company } from "../../../../../Mongo/companies/models/Company.js";

const validate_company = async (company_id) => {
  const company = await Company.findById(company_id);

  if (!company) throw new Error("Empresa no encontrada");

  return company;
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const create_restaurant_qr = async (req, res) => {
  try {
    const { company_id } = req.params;
    const { table_id, created_by } = req.body;

    await validate_company(company_id);

    if (!table_id)
      return res
        .status(400)
        .json({ status: false, message: "La mesa es requerida" });

    const new_qr = new RestaurantQrCode({
      company_id,
      table_id,
      created_by,
    });

    const data = await new_qr.save();
    res
      .status(201)
      .json({ status: true, message: "QR creado correctamente", data });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const list_restaurant_qrs = async (req, res) => {
  try {
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};
