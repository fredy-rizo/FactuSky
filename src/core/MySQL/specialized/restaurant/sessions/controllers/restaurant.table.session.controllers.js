import { RestaurantTable } from "../../tables/models/RestaurantTable.js";
import { Company } from "../../../../../Mongo/companies/models/Company.js";
import { RestaurantTableSession } from "../models/RestaurantTableSession.js";

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const open_restaurant_table_session = async (req, res) => {
  try {
    const { company_id, table_id, customer_id, opened_by, guests, notes } =
      req.body;

    if (!company_id || !table_id)
      return res
        .status(400)
        .json({ status: false, message: "Empresa y mesa son requeridas" });

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const table = await RestaurantTable.findById(table_id, company_id);
    if (!table)
      return res
        .status(404)
        .json({ status: false, message: "Mesa no encontrada" });

    if (table.status !== "available")
      return res.status(400).json({
        status: false,
        message: `La mesa no esta disponible. Estado actual: ${table.status}`,
      });

    const session = await RestaurantTableSession.findActiveByTable(
      table_id,
      company_id,
    );
    if (session)
      return res.status(409).json({
        status: false,
        message: "La mesa ya tiene una sesion abierta",
        data: session,
      });

    const guest_count = Number(guests || 1);
    if (guest_count <= 0)
      return res.status(400).json({
        status: false,
        message: "La cantidad de personas debe ser mayor a 0",
      });

    if (guest_count > table.capacity)
      return res.status(400).json({
        status: false,
        message: `La mesa tiene capacidad maxima para ${table.capacity} personas`,
      });

    const new_session = new RestaurantTableSession({
      company_id,
      table_id,
      customer_id,
      opened_by,
      guests: guest_count,
      notes,
    });

    const data = await new_session.save();
    res.status(201).json({
      status: true,
      message: "Sesion de mesa abierta correctamente",
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

export const list_restaurant_table_session = async (req, res) => {
  try {
    const { company_id, id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const data = await RestaurantTableSession.findById(id, company_id);
    if (!data)
      return res
        .status(404)
        .json({ status: false, message: "Sesion no encontrada" });

    res.status(200).json({ status: true, message: "Cargando sesion...", data });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const lists_restaurant_table_sessions = async (req, res) => {
  try {
    const { company_id } = req.params;
    const { status } = req.body;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const cant = await RestaurantTableSession.count(company_id, status);
    const data = await RestaurantTableSession.findAll(
      company_id,
      req.body.skippag,
      req.body.limit,
      status,
    );

    res.status(200).json({
      status: true,
      message: "Cargando sesiones...",
      data,
      pagination: {
        pagination: {
          pag: req.params.pag,
          perpage: req.body.limit,
          pags: Math.ceil(cant / req.body.limit),
        },
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

export const get_active_restaurant_table_session = async (req, res) => {
  try {
    const { company_id, table_id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const table = await RestaurantTable.findById(table_id, company_id);
    if (!table)
      return res
        .status(404)
        .json({ status: false, message: "Mesa no encontrada" });

    const data = await RestaurantTableSession.findActiveByTable(
      table_id,
      company_id,
    );
    if (!data)
      return res
        .status(404)
        .json({ status: false, message: "La mesa no tiene una sesion activa" });

    res
      .status(200)
      .json({ status: true, message: "Cargando sesion activa", data });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const close_restaurant_table_session = async (req, res) => {
  try {
    const { company_id, id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const session = await RestaurantTableSession.findById(id, company_id);
    if (!session)
      return res
        .status(404)
        .json({ status: false, message: "Sesion no encontrada" });

    if (session.status !== "open")
      return res.status(400).json({
        status: false,
        message: "La sesion ya no se encuentra abierta",
      });

    const data = await RestaurantTableSession.close(id, company_id);
    res
      .status(200)
      .json({ status: true, message: "Sesion cerrada correctamente", data });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const cancel_restaurant_table_session = async (req, res) => {
  try {
    const { company_id, id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const session = await RestaurantTableSession.findById(id, company_id);
    if (!session)
      return res
        .status(404)
        .json({ status: false, message: "Sesion no encontrada" });

    if (session.status !== "open")
      return res
        .status(400)
        .json({
          status: false,
          message: "Solo se pueden cancelar sesiones abiertas",
        });

    const data = await RestaurantTableSession.cancel(id, company_id);
    res
      .status(200)
      .json({ status: true, message: "Sesion cancelada correctamente", data });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};
