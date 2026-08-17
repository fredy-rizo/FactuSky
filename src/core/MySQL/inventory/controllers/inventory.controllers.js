import { Inventory } from "../models/Inventory.js";
import { Product } from "../../../MySQL/products/models/Product.js";
import { Company } from "../../../Mongo/companies/models/Company.js";
import { Warehouses } from "../../../MySQL/warehouses/models/Warehouses.js";

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const create_inventory = async (req, res) => {
  try {
    const {
      company_id,
      product_id,
      warehouse_id,
      quantity,
      reserved_quantity,
      minimum_stock,
      maximum_stock,
    } = req.body;

    if (!company_id || !product_id || !warehouse_id)
      return res
        .status(400)
        .json({ status: false, message: "Campos requeridos" });

    const exists = await Inventory.findByProductWarehouse(
      company_id,
      product_id,
      warehouse_id,
    );
    if (exists)
      return res.status(409).json({
        status: false,
        message: "El producto ya tiene inventario en esta bodega",
      });

    const new_inventory = new Inventory({
      company_id,
      product_id,
      warehouse_id,
      quantity,
      reserved_quantity,
      minimum_stock,
      maximum_stock,
    });

    const data = await new_inventory.save();
    res
      .status(201)
      .json({ status: true, message: "Inventario creado correctamente", data });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const lists_inventorys = async (req, res) => {
  try {
    const { company_id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const cant = await Inventory.count(company_id);
    const data = await Inventory.findAll(
      company_id,
      req.body.skippag,
      req.body.limit,
    );

    res.status(200).json({
      status: true,
      message: "Cargando inventario....",
      data,
      pagination: {
        pag: req.params.pag,
        perpage: req.body.limit,
        pags: Math.ceil(cant / req.body.limit),
      },
    });
  } catch (err) {
    console.llog(err);
    res.status(500).json(err);
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const list_inventory = async (req, res) => {
  try {
    const { company_id, id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const data = await Inventory.findById(id, company_id);
    if (!data)
      return res.status(404).json({
        status: false,
        message: "Registro de inventario no encontrado",
      });

    res.status(200).json({ status: true, message: "Cargando...", data });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const update_inventory = async (req, res) => {
  try {
    const { company_id, id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const inventory = await Inventory.findById(id, company_id);
    if (!inventory)
      return res.status(404).json({
        status: false,
        message: "Registro de inventario no encontrado",
      });

    await Inventory.update(id, company_id, req.body);

    const data = await Inventory.findById(id, company_id);
    res.status(200).json({
      status: true,
      message: "Inventario actualizado correctamente",
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

export const remove_inventory = async (req, res) => {
  try {
    const { company_id, id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const inventory = await Inventory.findById(id, company_id);
    if (!inventory)
      return res
        .status(404)
        .json({
          status: false,
          message: "Registro de inventario no encontrado",
        });

    await Inventory.delete(id, company_id);
    res
      .status(200)
      .json({ status: true, message: "Inventario eliminado correctamente" });
  } catch (err) {
    res.status(500).json(err);
  }
};
