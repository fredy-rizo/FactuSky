import { Company } from "../../../../Mongo/companies/models/Company.js";
import { CashOpening } from "../models/CashOpening.js";

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const open_cash = async (req, res) => {
  try {
    const { company_id, cash_register_id, user_id, opening_amount, notes } =
      req.body;

    if (!company_id || !cash_register_id || opening_amount === undefined)
      return res.status(400).json({
        status: false,
        message: "Empresa, caja y monto inicial son requeridos",
      });

    if (Number(opening_amount) < 0)
      return res.status(400).json({
        status: false,
        message: "El monto inicial no puede ser negativo",
      });

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const new_opening = new CashOpening({
      company_id,
      cash_register_id,
      user_id,
      opening_amount: Number(opening_amount),
      notes,
    });

    const data = await new_opening.save();
    res
      .status(201)
      .json({ status: false, message: "Caja abierta correctamente", data });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const current_cash = async (req, res) => {
  try {
    const { company_id, cash_register_id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const data = await CashOpening.current(cash_register_id, company_id);
    if (!data)
      return res.status(404).json({
        status: false,
        message: "La caja no tiene una apertura activa",
      });

    res
      .status(200)
      .json({ status: true, message: "Apertura activa encontrada", data });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const lists_cash_openings = async (req, res) => {
  try {
    const { company_id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const cant = await CashOpening.count(company_id);
    const data = await CashOpening.findAll(
      company_id,
      req.body.skippag,
      req.body.limit,
    );

    res.status(200).json({
      status: true,
      message: "Cargando aperturas",
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
