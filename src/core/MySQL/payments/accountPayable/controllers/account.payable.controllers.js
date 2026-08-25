import { AccountPayable } from "../models/AccountPayable.js";
import { Company } from "../../../../Mongo/companies/models/Company.js";

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const create_account_payable = async (req, res) => {
  try {
    const {
      company_id,
      supplier_id,
      reference_type,
      reference_id,
      issue_date,
      due_date,
      original_amount,
      notes,
    } = req.body;

    if (
      !company_id ||
      !supplier_id ||
      !reference_type ||
      !reference_id ||
      original_amount === undefined
    )
      return res.status(400).json({
        status: false,
        message: "Empresa, proveedor, referencia y valor son requeridos",
      });

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const new_account_payable = new AccountPayable({
      company_id,
      supplier_id,
      reference_type,
      reference_id,
      issue_date,
      due_date,
      original_amount,
      notes,
    });

    const data = await new_account_payable.save();
    res.status(201).json({
      status: true,
      message: "Cuenta por pagar creada correctamente",
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

export const lists_accounts_payable = async (req, res) => {
  try {
    const { company_id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const cant = await AccountPayable.count(company_data);
    const data = await AccountPayable.findAll(
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
