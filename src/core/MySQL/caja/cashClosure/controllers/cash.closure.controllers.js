import { CashClosure } from "../models/CashClosure.js";
import { Company } from "../../../../Mongo/companies/models/Company.js";

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const close_cash = async (req, res) => {
  try {
    const { company_id, cash_opening_id, user_id, counted_amount, notes } =
      req.body;

    if (!company_id || !cash_opening_id || counted_amount === undefined)
      return res.status(400).json({
        status: false,
        message: "Empresa, apertura y dinero contado son requeridos",
      });

    if (Number(counted_amount) < 0)
      return res.status(400).json({
        status: false,
        message: "El dinero contado no puede ser negativo",
      });

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const new_cash_closure = new CashClosure({
      company_id,
      cash_opening_id,
      user_id,
      counted_amount: Number(counted_amount),
      notes,
    });

    const data = await new_cash_closure.save();
    res
      .status(201)
      .json({ status: true, message: "Caja cerrada correctamente", data });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const lists_cash_closures = async (req, res) => {
  try {
    const { company_id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const cant = await CashClosure.count(company_id);
    const data = await CashClosure.findAll(
      company_id,
      req.body.skippag,
      req.body.limit,
    );

    res.status(200).json({
      status: true,
      message: "Cargando cierres",
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

export const list_cash_closure = async (req, res) => {
  try {
    const { company_id, id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const data = await CashClosure.findById(id, company_id);
    if (!data)
      return res
        .status(404)
        .json({ status: false, message: "Cierre de caja no encontrado" });

    res
      .status(200)
      .json({ status: true, message: "Cargando cierre de caja...", data });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};
