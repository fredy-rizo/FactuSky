import { Payment } from "../models/Payment.js";
import { Company } from "../../../Mongo/companies/models/Company.js";

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const create_payment = async (req, res) => {
  try {
    const { company_id, name, code, description, active } = req.body;

    if (!company_id || !name || !code)
      return res
        .status(400)
        .json({ status: false, message: "Campos requeridos" });

    const new_payment = new Payment({
      company_id,
      name,
      code,
      description,
      active,
    });

    const data = await new_payment.save();
    res.status(201).json({
      status: true,
      message: "Metodo de pago creado correctamente",
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

export const list_payments = async (req, res) => {
  try {
    const { company_id } = req.params;
    const cant = await Payment.count(company_id);
    const data = await Payment.findAll(
      company_id,
      req.body.skippag,
      req.body.limit,
    );

    res.status(200).json({
      status: true,
      message: "Cargando metodos de pago",
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

export const list_payment = async (req, res) => {
  try {
    const { company_id, id } = req.params;

    const data = await Payment.findById(id, company_id);
    if (!data)
      return res
        .status(404)
        .json({ status: false, message: "Metodo de pago no encontrado" });

    res
      .status(200)
      .json({ status: true, message: "Cargando metodo de pago...", data });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const update_payment = async (req, res) => {
  try {
    const { company_id, id } = req.params;

    const payment = await Payment.findById(id, company_id);
    if (!payment)
      return res
        .status(404)
        .json({ status: false, message: "Metodo de pago no encontrado" });

    await Payment.update(id, company_id, req.body);
    const data = await Payment.findById(id, company_id);

    res.status(200).json({
      status: false,
      message: "Metodo de pago actualizado correctamente",
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

export const remove_payment = async (req, res) => {
  try {
    const { company_id, id } = req.params;

    const payment = await Payment.findById(id, company_id);
    if (!payment)
      return res
        .status(404)
        .json({ status: false, message: "Metodo de pago no encontrado" });

    await Payment.delete(id, company_id);
    res
      .status(200)
      .json({
        status: true,
        message: "Metodo de pago eliminado correctamente",
      });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};
