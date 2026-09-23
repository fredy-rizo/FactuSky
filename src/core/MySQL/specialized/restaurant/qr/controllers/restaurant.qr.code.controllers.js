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

export const lists_restaurant_qrs = async (req, res) => {
  try {
    const { company_id } = req.params;

    await validate_company(company_id);

    const cant = await RestaurantQrCode.count(company_id);
    const data = await RestaurantQrCode.findAll(company_id);

    res.status(200).json({
      status: true,
      message: "QR cargados correctamente",
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

export const list_restaurant_qr = async (req, res) => {
  try {
    const { company_id, id } = req.params;

    await validate_company(company_id);

    const data = await RestaurantQrCode.findById(id, company_id);
    if (!data)
      return res
        .status(404)
        .json({ status: false, message: "QR no encontrado" });

    res
      .status(200)
      .json({ status: true, message: "QR cargado correctamente", data });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const list_restaurant_qrs_by_table = async (req, res) => {
  try {
    const { company_id, table_id } = req.params;

    await validate_company(company_id);

    const data = await RestaurantQrCode.findByTable(company_id, table_id);
    if (!data)
      return res.status(404).json({ status: false, message: "No encontrado" });

    res.status(200).json({
      status: true,
      message: "QR de la mesa cargado correctamente",
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

export const validate_restaurant_qr = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token)
      return res
        .status(400)
        .json({ status: false, message: "Token requerido" });

    const data = await RestaurantQrCode.findByToken(token);
    if (!data)
      return res
        .status(404)
        .json({ status: false, message: "QR invalido o inactivo" });

    res.status(200).json({
      status: true,
      message: "QR valido",
      data: {
        company_id: data.company_id,
        table_id: data.table_id,
        table_number: data.table_number,
        table_name: data.table_name,
        capacity: data.capacity,
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

export const deactivate_restaurant_qr = async (req, res) => {
  try {
    const { company_id, id } = req.params;

    await validate_company(company_id);

    const qr = await RestaurantQrCode.findById(id, company_id);
    if (!qr)
      return res
        .status(404)
        .json({ status: false, message: "QR no encontrado" });

    await RestaurantQrCode.deactive(id, company_id);
    res.status(200).json({ status: true, message: "QR desactivado" });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const activate_restaurant_qr = async (req, res) => {
  try {
    const { company_id, id } = req.params;

    await validate_company(company_id);

    const data = await RestaurantQrCode.activate(id, company_id);
    res
      .status(200)
      .json({ status: true, message: "QR activado correctamente", data });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const regenerate_restaurant_qr = async (req, res) => {
  try {
    const { company_id, id } = req.params;
    const { created_by } = req.body;

    await validate_company(company_id);

    const data = await RestaurantQrCode.regenerate(id, company_id, created_by);
    res
      .status(200)
      .json({ status: true, message: "QR regenerado correctamente" });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};
