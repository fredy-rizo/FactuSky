import { CustomerPayment } from "../models/CustomerPayment.js";
import { Company } from "../../../../Mongo/companies/models/Company.js";
import { AccountReceivable } from "../../accountReceivable/models/AccountReceivable.js";

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const create_customer_payment = async (req, res) => {
  try {
    const {
      company_id,
      account_receivable_id,
      payment_method_id,
      cash_opening_id,
      user_id,
      amount,
      payment_date,
      reference,
      notes,
    } = req.body;

    if (
      !company_id ||
      !account_receivable_id ||
      !payment_method_id ||
      amount === undefined
    )
      return res.status(400).json({
        status: false,
        message: "Empresa, cuenta, metodo de pago y valor son requeridos",
      });

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const account = await AccountReceivable.findById(
      account_receivable_id,
      company_id,
    );
    if (!account)
      return res
        .status(404)
        .json({ status: false, message: "Cuenta por cobrar no encontrada" });

    const new_payment = new CustomerPayment({
      company_id,
      account_receivable_id,
      payment_method_id,
      cash_opening_id,
      user_id,
      amount,
      payment_date,
      reference,
      notes,
    });

    const data = await new_payment.save();
    res
      .status(201)
      .json({ status: true, message: "Pago registrado correctamente", data });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const customer_payments_by_account = async (req, res) => {
  try {
    const { company_id, account_receivable_id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const cant = await CustomerPayment.count(company_id);
    const data = await CustomerPayment.findByAccount(
      account_receivable_id,
      company_id,
      req.body.skippag,
      req.body.limit,
    );

    res.status(200).json({
      status: true,
      message: "Cargando cuentas por cobrar",
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

export const customer_payments_by_customer = async (req, res) => {
  try {
    const { company_id, customer_id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const cant = await CustomerPayment.count(company_id);
    const data = await CustomerPayment.findByCustomer(
      customer_id,
      company_id,
      req.body.skippag,
      req.body.limit,
    );

    res.status(200).json({
      status: true,
      message: "Cargando historial de pagos...",
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
