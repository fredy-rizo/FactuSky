import { RestaurantKitchenItem } from "../models/RestaurantKitchenItem.js";
import { Company } from "../../../../../Mongo/companies/models/Company.js";

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const lists_restaurant_kitchen_items = async (req, res) => {
  try {
    const { company_id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const status = req.body.status || null;
    const cant = await RestaurantKitchenItem.count(company_id);
    const data = await RestaurantKitchenItem.findAll(
      company_id,
      status,
      req.body.skippag,
      req.body.limit,
    );

    res.status(200).json({
      status: true,
      message: "Cargando cocina...",
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

export const list_restaurant_kitchen_item = async (req, res) => {
  try {
    const { company_id, id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const data = await RestaurantKitchenItem.findById(id, company_id);
    if (!data)
      return res.status({
        status: false,
        message: "Item de cocina no encontrado",
      });

    res
      .status(200)
      .json({ status: false, message: "Cargando item de cocina...", data });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const list_restaurant_kitchen_order = async (req, res) => {
  try {
    const { company_id, order_id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const order = await RestaurantKitchenItem.findById(order_id, company_id);
    if (!order)
      return res
        .status(404)
        .json({ status: false, message: "Orden no encontrada" });

    const data = await RestaurantKitchenItem.findByOrder(order_id, company_id);

    res.status(200).json({
      status: true,
      message: "Cargando comanda...",
      data: { order, kitchen_items: data },
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

export const list_restaurant_kitchen_by_table = async (req, res) => {
  try {
    const { company_id, table_id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const data = await RestaurantKitchenItem.findByTable(table_id, company_id);
    res.status(200).json({
      status: true,
      message: "Cargando productos de cocina de la mesa",
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

export const start_restaurant_kitchen_item = async (req, res) => {
  try {
    const { company_id, id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const data = await RestaurantKitchenItem.changeStatus(
      id,
      company_id,
      "preparing",
    );
    res
      .status(200)
      .json({ status: true, message: "Producto enviado a preparacion", data });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const ready_restaurant_kitchen_item = async (req, res) => {
  try {
    const { company_id, id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const data = await RestaurantKitchenItem.changeStatus(
      id,
      company_id,
      "ready",
    );
    res
      .status(200)
      .json({ status: true, message: "Producto marcado como listo", data });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const serve_restaurant_kitchen_item = async (req, res) => {
  try {
    const { company_id, id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const data = await RestaurantKitchenItem.changeStatus(
      id,
      company_id,
      "served",
    );
    res
      .status(200)
      .json({ status: true, message: "Producto marcado como servido", data });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const cancel_restaurant_kitchen_item = async (req, res) => {
  try {
    const { company_id, id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const data = await RestaurantKitchenItem.changeStatus(
      id,
      company_id,
      "cancelled",
    );
    res
      .status(200)
      .json({ status: true, message: "Producto cancelado en cocina", data });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const reopen_restaurant_kitchen_item = async (req, res) => {
  try {
    const { company_id, id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const data = await RestaurantKitchenItem.changeStatus(
      id,
      company_id,
      "pending",
    );
    res
      .status(200)
      .json({ status: true, message: "Producto reabierto en cocina", data });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const update_restaurant_kitchen_notes = async (req, res) => {
  try {
    const { company_id, id } = req.params;
    const { notes } = req.body;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(500)
        .json({ status: false, message: "Empresa no encontrada" });

    const result = await RestaurantKitchenItem.updateNotes(
      id,
      company_id,
      notes,
    );
    if (!result.affectedRows)
      return res.status(404).json({
        status: false,
        message: "Item no encontrado o no puede modificarse",
      });

    const data = await RestaurantKitchenItem.findById(id, company_id);
    res.status(200).json({
      status: true,
      message: "Notas actualizadas correctamente",
      data,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};
