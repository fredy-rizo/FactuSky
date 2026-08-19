import { response } from "express";
import { Company } from "../../../../Mongo/companies/models/Company.js";
import { CashRegister } from "../models/CashRegister.js";

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const create_cash_register = async (req, res) => {
  try {
    const { company_id, name, description } = req.body;

    if (!company_id || !name)
      return res.status(400).json({
        status: false,
        message: "Empresa y nombre de caja son requeridos",
      });

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const new_cash_register = new CashRegister({
      company_id,
      name,
      description,
    });

    const data = await new_cash_register.save();
    res
      .status(201)
      .json({ status: 201, message: "Caja creada correctamente", data });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const lists_cash_registers = async (req, res) => {
  try {
    const { company_id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const cant = await CashRegister.count(company_id);
    const data = await CashRegister.findAll(
      company_id,
      req.body.skippag,
      req.body.limit,
    );

    res.status(200).json({
      status: true,
      message: "Cargando cajas...",
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

export const list_cash_register = async (req, res) => {
  try {
    const { company_id, id } = req.params;

    const company_data = await CashRegister.findById(id, company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const data = await CashRegister.findById(id, company_id);
    if (!data)
      return res
        .status(404)
        .json({ status: false, message: "Caja no encontrada" });

    res.status(200).json({ status: true, message: "Cargando caja..", data });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const update_cash_register = async (req, res) => {
  try {
    const { company_id, id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const cash_register = await CashRegister.findById(id, company_id);
    if (!cash_register)
      return res
        .status(404)
        .json({ status: false, message: "Caja no encontrada" });

    await CashRegister.update(id, company_id, req.body);
    const data = await CashRegister.findById(id, company_id);

    res
      .status(200)
      .json({ status: true, message: "Caja actualizada correctamente", data });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};
