import { RestaurantTable } from "../models/RestaurantTable.js";
import { Company } from "../../../../../Mongo/companies/models/Company.js";
import { RestaurantTableSession } from "../../sessions/models/RestaurantTableSession.js";

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const create_restaurant_table = async (req, res) => {
  try {
    const { company_id, table_number, name, capacity, location, notes } =
      req.body;

    if (!company_id || !table_number)
      return res.status(400).json({
        status: false,
        message: "Empresa y numero de mesa son requeridos",
      });

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const exists = await RestaurantTable.existsTableNumber(
      company_id,
      table_number,
    );
    if (exists)
      return res
        .status(409)
        .json({ status: false, message: "Ya existe una mesa con ese numero" });

    const new_table = new RestaurantTable({
      company_id,
      table_number,
      name,
      capacity: capacity || 2,
      location,
      notes,
    });

    const data = await new_table.save();
    res
      .status(201)
      .json({ status: true, message: "Mesa creada correctamente", data });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const lists_restaurant_tables = async (req, res) => {
  try {
    const { company_id } = req.params;
    const status = req.body.status || null;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const cant = await RestaurantTable.count(company_id, status);
    const data = await RestaurantTable.findAll(
      company_id,
      req.body.skippag,
      req.body.limit,
    );

    res.status(200).json({
      status: true,
      message: "Cargando mesas...",
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

export const list_restaurant_table = async (req, res) => {
  try {
    const { company_id, id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const data = await RestaurantTable.findById(id, company_id);
    if (!data)
      return res
        .status(404)
        .json({ status: false, message: "Mesa no encontrada" });

    res.status(200).json({ status: true, message: "Cargando mesa...", data });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};
