import { RestaurantOrder } from "../models/RestaurantOrder.js";
import { RestaurantTable } from "../../tables/models/RestaurantTable.js";
import { Company } from "../../../../../Mongo/companies/models/Company.js";
import { RestaurantTableSession } from "../../sessions/models/RestaurantTableSession.js";

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const create_restaurant_order = async (req, res) => {
  try {
    const {
      company_id,
      session_id,
      table_id,
      customer_id,
      waiter_id,
      order_number,
      notes,
    } = req.body;

    if (!company_id || !session_id || !table_id)
      return res.status(400).json({
        status: false,
        message: "Empresa, sesion y mesa son requeridas",
      });

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

    if (table.status !== "occupied")
      return res.status(400).json({
        status: false,
        message: "La mesa debe estar ocupada para crear una orden",
      });

    const session = await RestaurantTableSession.findById(
      session_id,
      company_id,
    );
    if (!session)
      return res
        .status(404)
        .json({ status: false, message: "Sesion no encontrada" });

    if (session.status !== "open")
      return res
        .status(400)
        .json({ status: false, message: "La sesion debe estar abierta" });

    if (session.table_id !== Number(table_id))
      return res
        .status(400)
        .json({ status: false, message: "La sesion debe estar abierta" });

    if (!order_number)
      return res
        .status(400)
        .json({ status: false, message: "El numero de orden es requerido" });

    const new_order = new RestaurantOrder({
      company_id,
      session_id,
      table_id,
      customer_id,
      waiter_id,
      order_number,
      notes,
    });

    const data = await new_order.save();
    res
      .status(201)
      .json({ status: true, message: "Orden creada correctamente", data });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const list_restaurant_order = async (req, res) => {
  try {
    const { company_id, id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const data = await RestaurantOrder.findById(id, company_id);
    if (!data)
      return res
        .status(404)
        .json({ status: false, message: "Orden no encontrada" });

    res.status(200).json({ status: true, message: "Cargando orden..", data });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const lists_restaurant_orders = async (req, res) => {
  try {
    const { company_id } = req.params;
    const { status } = req.body;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const cant = await RestaurantOrder.count(company_id, status);
    const data = await RestaurantOrder.findAll(
      company_id,
      req.body.skippag,
      req.body.limit,
      status,
    );

    res.status(200).json({
      status: false,
      message: "Cargando ordenes...",
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

export const list_restaurant_orders_by_table = async (req, res) => {
  try {
    const { company_id, table_id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const data = await RestaurantOrder.findByTable(table_id, company_id);
    if (!data)
      return res
        .status(404)
        .json({ status: false, message: "Orden de mesa no encontrada" });

    res
      .status(200)
      .json({ status: true, message: "Cargando ordenes de la mesa...", data });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const list_restaurant_orders_by_session = async (req, res) => {
  try {
    const { company_id, session_id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const data = await RestaurantOrder.findBySession(session_id, company_id);
    if (!data)
      return res
        .status(404)
        .json({ status: false, message: "Orden de la sesion no encontrada" });

    res.status(200).json({
      status: true,
      message: "Cargando ordenes de la sesion...",
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

export const add_restaurant_order_item = async (req, res) => {
  try {
    const { company_id, order_id } = req.params;
    const { product_id, quantity, unit_price, discount, tax, notes } = req.body;

    if (!product_id || !quantity)
      return res
        .status(400)
        .json({ status: false, message: "Producto y cantidad son requeridos" });

    const item_id = await RestaurantOrder.addItem(order_id, company_id, {
      product_id,
      quantity,
      unit_price,
      discount,
      tax,
      notes,
    });

    const data = await RestaurantOrder.findById(order_id, company_id);
    res.status(200).json({
      status: true,
      message: "Producto agregado correctamente",
      data,
      item_id,
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

export const update_restaurant_order_item = async (req, res) => {
  try {
    const { company_id, order_id, item_id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const data = await RestaurantOrder.updateItem(
      order_id,
      item_id,
      company_id,
      req.body,
    );

    res.status(200).json({
      status: true,
      message: "Producto actualizado correctamente",
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

export const remove_restaurant_order_item = async (req, res) => {
  try {
    const { company_id, order_id, item_id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const data = await RestaurantOrder.removeItem(
      order_id,
      item_id,
      company_id,
    );
    if (!data)
      return res
        .status(404)
        .json({ status: false, message: "Orden no encontrada" });

    res.status(200).json({
      status: true,
      message: "Producto eliminado correctamente",
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

export const confirm_restaurant_order = async (req, res) => {
  try {
    const { company_id, id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const order = await RestaurantOrder.findById(id, company_id);
    if (!order)
      return res
        .status(404)
        .json({ status: false, message: "Orden no encontrada" });

    if (order.status !== "pending")
      return res.status(400).json({
        status: false,
        message: "Solo se pueden confirmar ordenes pendientes",
      });

    if (!order.items.length)
      return res.status(400).json({
        status: false,
        message: "No se puede confirmar una orden sin productos",
      });

    await RestaurantOrder.confirm(id, company_id);
    const data = await RestaurantOrder.findById(id, company_id);

    res
      .status(200)
      .json({ status: true, message: "Orden confirmada correctamente", data });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const cancel_restaurant_order = async (req, res) => {
  try {
    const { company_id, id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const data = await RestaurantOrder.cancel(id, company_id);
    if (!data)
      return res
        .status(404)
        .json({ status: false, message: "Orden no encontrada" });

    res
      .status(200)
      .json({ status: true, message: "Orden cancelada correctamente", data });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const change_restaurant_order_status = async (req, res) => {
  try {
    const { company_id, id } = req.params;
    const { status } = req.body;

    if (!status)
      return res
        .status(400)
        .json({ status: false, message: "El estado es requerido" });

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    await RestaurantOrder.changeStatus(id, company_id, status);

    const data = await RestaurantOrder.findById(id, company_id);
    if (!data)
      return res
        .status(404)
        .json({ status: false, message: "Orden no encontrada" });

    res
      .status(200)
      .json({
        status: true,
        message: "Estado de orden actualizado correctamente",
        data,
      });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};
