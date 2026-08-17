import { response } from "express";
import { Company } from "../../../Mongo/companies/models/Company.js";
import { Warehouses } from "../models/Warehouses.js";

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const create_warehouses = async (req, res) => {
  try {
    const { company_id, name, code, description, address, city, active } =
      req.body;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    if (!name || !code)
      return res
        .status(404)
        .json({ status: false, message: "Campos requeridos" });

    const exists = await Warehouses.findByCode(company_id, code);
    if (exists)
      return res.status(404).json({
        status: false,
        message: "El codigo de la bodega ya existe para esta empresa",
      });

    const new_warehouses = new Warehouses({
      company_id,
      name,
      code,
      description,
      address,
      city,
      active,
    });

    const data = await new_warehouses.save();
    res
      .status(201)
      .json({ status: true, message: "Bodega creada correctamente", data });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const lists_warehouses = async (req, res) => {
  try {
    const { company_id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const cant = await Warehouses.count(company_id);
    const data = await Warehouses.findAll(
      company_id,
      req.body.skippag,
      req.body.limit,
    );

    res.status(200).json({
      status: true,
      message: "Cargando bodegas...",
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

export const list_warehouse = async (req, res) => {
  try {
    const { company_id, id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const data = await Warehouses.findById(id, company_id);
    if (!data)
      return res
        .status(404)
        .json({ status: false, message: "Bodega no encontrada" });

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

export const update_warehouse = async (req, res) => {
  try {
    const { company_id, id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const warehouse = await Warehouses.findById(id, company_id);
    if (!warehouse)
      return res
        .status(404)
        .json({ status: false, message: "Bodega no encontrada" });

    await Warehouses.update(id, company_id, req.body);

    const data = await Warehouses.findById(id, company_id);
    res.status(200).json({
      status: true,
      message: "Bodega actualizada correctamente",
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

export const remove_warehouse = async (req, res) => {
  try {
    const { company_id, id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const warehouse = await Warehouses.findById(id, company_id);
    if (!warehouse)
      return res
        .status(404)
        .json({ status: false, message: "Bodega no encontrada" });

    await Warehouses.delete(id, company_id, req.body);

    return res
      .status(200)
      .json({ status: true, message: "Bodega eliminada correctamente" });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};
