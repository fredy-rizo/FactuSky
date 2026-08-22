import { AccountReceivable } from "../models/AccountReceivable.js";
import { Company } from "../../../../Mongo/companies/models/Company.js";
import { CursorTimeoutMode } from "mongodb";

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const create_account_receivable = async (req, res) => {
  try {
    const {
      company_id,
      customer_id,
      reference_type,
      reference_id,
      issue_date,
      due_date,
      original_amount,
      notes,
    } = req.body;

    if (
      !company_id ||
      !customer_id ||
      !reference_type ||
      !reference_id ||
      original_amount === undefined
    )
      return res.status(400).json({
        status: false,
        message: "Empresa, cliente, referencia y valor son requeridos",
      });

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const new_account = new AccountReceivable({
      company_id,
      customer_id,
      reference_type,
      reference_id,
      issue_date,
      due_date,
      original_amount,
      notes,
    });

    const data = await new_account.save();
    res.status(201).json({
      status: true,
      message: "Cuenta por cobrar creada correctamente",
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

export const lists_accounts_receivable = async (req, res) => {
  try {
    const { company_id } = req.params;

    await AccountReceivable.updateOverdue(company_id);

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const cant = await AccountReceivable.count(company_id);
    const data = await AccountReceivable.findAll(
      company_id,
      req.body.skippag,
      req.body.limit,
    );

    res.status(200).json({
      status: true,
      message: "Cargando cuentas por cobrar..",
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

export const list_account_receivable = async (req, res) => {
  try {
    const { company_id, id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const data = await AccountReceivable.findById(id, company_id);
    if (!data)
      return res
        .status(404)
        .json({ status: false, message: "Cuenta por cobrar no encontrada" });

    res
      .status(200)
      .json({ status: true, message: "Cargando cuenta por cobrar...", data });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const accounts_receivable_by_customer = async (req, res) => {
  try {
    const { company_id, customer_id } = req.params;

    await AccountReceivable.updateOverdue(company_id);

    const cant = await AccountReceivable.count(company_id);
    const data = await AccountReceivable.findByCustomer(
      customer_id,
      company_id,
      req.body.skippag,
      req.body.limit,
    );

    res.status(200).json({
      status: true,
      message: "Cargando cuentas del cliente",
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

export const cancel_account_receivable = async (req, res) => {
  try {
    const { company_id, id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const account = await AccountReceivable.findById(id, company_id);
    if (!account)
      return res
        .status(404)
        .json({ status: false, message: "Cuenta por cobrar no encontrada" });

    if (Number(account.paid_amount) > 0)
      return res.status(400).json({
        status: false,
        message: "No se puede cancelar una cuenta que ya tiene pagos",
      });

    const result = await AccountReceivable.cancel(id, company_id);
    if (!result.affectedRows)
      return res
        .status(400)
        .json({ status: false, message: "Esta cuenta no puede ser cancelada" });

    res.status(200).json({
      status: true,
      message: "Cuenta por cobrar cancelada correctamente",
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

export const accounts_receivable_summary = async (req, res) => {
  try {
    const { company_id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    await AccountReceivable.updateOverdue(company_id);

    const cant = await AccountReceivable.count(company_id);
    const data = await AccountReceivable.sumary(
      company_id,
      req.body.skippag,
      req.body.limit,
    );

    res.status(200).json({
      status: true,
      message: "Resumen generado correctamente",
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
