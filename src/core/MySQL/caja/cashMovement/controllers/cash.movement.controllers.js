import { CashMovement } from "../models/CashMovement.js";
import { CashOpening } from "../../cashOpening/models/CashOpening.js";
import { Company } from "../../../../Mongo/companies/models/Company.js";

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const create_cash_movement = async (req, res) => {
  try {
    const {
      company_id,
      cash_opening_id,
      user_id,
      movement_type,
      category,
      amount,
      description,
      reference_type,
      reference_id,
      movement_date,
    } = req.body;

    if (
      !company_id ||
      !cash_opening_id ||
      !movement_date ||
      amount === undefined
    )
      return res.status(400).json({
        status: false,
        message: "Empresa, apertura, tipo y monto son requeridos",
      });

    if (!["income", "expense"].includes)
      return res
        .status(400)
        .json({ status: false, message: "Tipo de movimiento invalido" });

    if (Number(amount) <= 0)
      return res
        .status(400)
        .json({ status: false, message: "El monto debe ser mayor que cero" });

    const new_movement = new CashMovement({
      company_id,
      cash_opening_id,
      user_id,
      movement_type,
      category: category || "other",
      amount: Number(amount),
      description,
      reference_type,
      reference_id,
      movement_date,
    });

    const data = await new_movement.save();
    res.status(201).json({
      status: true,
      message: "Movimiento registrado correctamente",
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

export const lists_cash_movements = async (req, res) => {
  try {
    const { company_id, cash_opening_id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const cant = await CashMovement.count(company_id);
    const data = await CashMovement.findAllByOpening(
      cash_opening_id,
      company_id,
      req.body.skippag,
      req.body.limit,
    );

    res.status(200).json({
      status: false,
      message: "Cargando movimientos",
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

export const cash_summary = async (req, res) => {
  try {
    const { company_id, cash_opening_id } = req.params;

    const opening = await CashOpening.findById(cash_opening_id, company_id);
    if (!opening)
      return res
        .status(404)
        .json({ status: false, message: "Apertura no encontrada" });

    const sumary = await CashMovement.sumary(cash_opening_id, company_id);
    const expected =
      Number(opening.opening_amount) +
      sumary.total_income -
      sumary.total_expense;

    res.status(200).json({
      status: true,
      message: "Resumen de caja generado correctamente",
      data: {
        opening_amount: Number(opening.opening_amount),
        total_income: sumary.total_income,
        total_expense: sumary.total_expense,
        expected_amount: expected,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};
