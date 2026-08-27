import { SupplierPayment } from "../models/SupplierPayment.js";
import { Company } from "../../../../Mongo/companies/models/Company.js";
import { AccountPayable } from "../../accountPayable/models/AccountPayable.js";

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const create_supplier_payment = async (req, res) => {
  try {
    const {
      company_id,
      account_payable_id,
      payment_method_id,
      cash_opening_id,
      user_id,
      amount,
      payment_date,
      reference,
      supplier_id,
      notes,
    } = req.body;

    // console.log("body", req.body);

    if (
      !company_id ||
      !account_payable_id ||
      !supplier_id ||
      !payment_method_id ||
      amount === undefined
    )
      return res.status(400).json({
        status: false,
        message:
          "Empresa, cuenta, proveedor ,metodo de pago y valor son requeridos",
      });

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const account = await AccountPayable.findById(
      account_payable_id,
      company_id,
    );
    if (!account)
      return res
        .status(404)
        .json({ status: false, message: "Cuenta por pagar no encontrada" });

    const new_payment = new SupplierPayment({
      company_id,
      account_payable_id,
      payment_method_id,
      cash_opening_id,
      user_id,
      supplier_id,
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
