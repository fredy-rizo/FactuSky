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

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const update_restaurant_table = async (req, res) => {
  try {
    const { company_id, id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const table = await RestaurantTable.findById(id, company_id);
    if (!table)
      return res
        .status(404)
        .json({ status: false, message: "Mesa no encontrada" });

    if (table.status === "occupied")
      return res.status(400).json({
        status: false,
        message: "No se puede modificar la configuracion de una mesa ocupada",
      });

    const { table_number, capacity } = req.body;

    if (!table_number || !capacity === undefined)
      return res.status(400).json({
        status: false,
        message: "Numero de mesa y capacidad son requeridos",
      });

    if (Number(capacity) <= 0)
      return res
        .status(400)
        .json({ status: false, message: "La capacidad debe ser mayor a 0" });

    const exists = await RestaurantTable.existsTableNumber(
      company_id,
      table_number,
      id,
    );
    if (exists)
      return res
        .status(409)
        .json({ status: false, message: "Ya existe otra mesa con ese numero" });

    await RestaurantTable.update(id, company_data, req.body);

    const data = await RestaurantTable.findById(id, company_id);
    res
      .status(200)
      .json({ status: true, message: "Mesa actualizada correctamente", data });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const change_restaurant_table_status = async (req, res) => {
  try {
    const { company_id, id } = req.params;
    const { status } = req.body;

    const allowed_statuses = ["available", "reserved", "inactive"];

    if (!allowed_statuses.includes(status))
      return res.status(400).json({
        status: false,
        message:
          "Estado invalido. Estados permitidos: available, reserved, inactive",
      });

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const table = await RestaurantTable.findById(id, company_id);
    if (!table)
      return res
        .status(404)
        .json({ status: false, message: "Mesa no encontrada" });

    if (table.status === "occupied")
      return res.status(400).json({
        status: false,
        message: "Una mesa ocupada debe liberarse cerrando su sesion",
      });

    await RestaurantTable.changeStatus(id, company_id, status);

    const data = await RestaurantTable.findById(id, company_id);
    res.status(200).json({
      status: true,
      message: "Estado de mesa actualizado correctamente",
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

export const deactivate_restaurant_table = async (req, res) => {
  try {
    const { company_id, id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const table = await RestaurantTable.findById(id, company_id);
    if (!table)
      return res
        .status(404)
        .json({ status: false, message: "Mesa no encontrada" });

    if (table.status === "occupied")
      return res.status(400).json({
        status: false,
        message: "No se puede desactivar una mesa ocupada",
      });

    await RestaurantTable.deactivate(id, company_id);
    res
      .status(200)
      .json({ status: true, message: "Mesa desactivada correctamentes" });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const check_restaurant_table_availability = async (req, res) => {
  try {
    const { company_id, id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const available = await RestaurantTable.isAvailable(id, company_id);

    res.status(200).json({
      status: true,
      data: {
        table_id: Number(id),
        available,
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

export const restaurant_tables_statistics = async (req, res) => {
  try {
    const { company_id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const data = await RestaurantTable.getStatistics(company_id);
    res
      .status(200)
      .json({ status: true, message: "Estadisticas de mesas", data });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};
