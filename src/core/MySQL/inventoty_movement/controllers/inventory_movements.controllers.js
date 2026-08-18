import { InventoryMovement } from "../models/InventoryMovement.js";
import { Company } from "../../../Mongo/companies/models/Company.js";

const validTypes = [
  "entry",
  "exit",
  "adjustment",
  "transfer_in",
  "transfer_out",
  "return",
];

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const create_inventory_movements = async (req, res) => {
  try {
    const {
      company_id,
      product_id,
      warehouse_id,
      type,
      quantity,
      reference_type,
      reference_id,
      reason,
      user_id,
    } = req.body;

    if (!company_id || !product_id || !warehouse_id)
      return res
        .status(400)
        .json({ status: false, message: "Campos requeridos" });

    if (!validTypes.includes(type))
      return res
        .status(400)
        .json({ status: false, message: "Tipo de movimiento invalido" });

    if (Number(quantity) <= 0)
      return res
        .status(400)
        .json({ status: false, message: "La cantidad debe ser mayor a 0" });

    const new_inventory_movements = new InventoryMovement({
      company_id,
      product_id,
      warehouse_id,
      type,
      quantity,
      reference_type,
      reference_id,
      reason,
      user_id,
    });

    const data = await new_inventory_movements.save();
    res.status(201).json({
      status: true,
      message: "Movimiento de inventario registrado correctamente",
      data,
    });
  } catch (err) {
    console.log(err);

    if (err.nessage === "INVENTORY_NOT_FOUND")
      return res.status(404).json({
        status: false,
        message: "No existe inventario para este producto en bodega",
      });

    if (err.message === "INSUFFICIENT_STOCK")
      return res.status(400).json({
        status: false,
        message: "Stock insuficiente para realizar la operacion",
      });

    res.status(500).json(err);
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const lists_inventorys_movememts = async (req, res) => {
  try {
    const { company_id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const cant = await InventoryMovement.count(company_id);
    const data = await InventoryMovement.findAll(
      company_id,
      req.body.skippag,
      req.body.limit,
    );

    res.status(200).json({
      status: true,
      message: "Cargando movimientos de inventario...",
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

export const list_inventory_movememt = async (req, res) => {
  try {
    const { company_id, id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Emmpresa no encontrada" });

    const data = await InventoryMovement.findById(id, company_id);
    if (!data)
      return res
        .status(404)
        .json({ status: false, message: "Movimiento no encontrado" });

    res
      .status(200)
      .json({ status: true, message: "Cargando movimiento...", data });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};
