import { RestaurantBilling } from "../models/RestaurantBilling.js";
import { Company } from "../../../../../Mongo/companies/models/Company.js";
import { Sale } from "../../../../sale/models/Sale.js";

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const get_restaurant_order_bill = async (req, res) => {
  try {
    const { company_id, order_id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const data = await RestaurantBilling.getOrderBill(order_id, company_id);
    if (!data)
      return res
        .status(404)
        .json({ status: false, message: "Orden no encontrada" });

    res
      .status(200)
      .json({ status: true, message: "Cuenta cargada correctamente", data });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const validate_restaurant_checkout = async (req, res) => {
  try {
    const { company_id, order_id } = req.params;

    const company_data = await RestaurantBilling.validateCheckout(
      order_id,
      company_id,
    );
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const data = await RestaurantBilling.validateCheckout(order_id, company_id);
    res
      .status(200)
      .json({ status: true, message: "La orden puede pasar a cobro", data });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const get_restaurant_payment_status = async (req, res) => {
  try {
    const { company_id, order_id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const data = await RestaurantBilling.getPaymentSummary(
      order_id,
      company_id,
    );
    res.status(200).json({
      status: true,
      message: "Estado de pago cargado correctamente",
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

export const create_restaurant_sale = async (req, res) => {
  try {
    const { company_id, order_id } = req.params;
    const { customer_id, user_id } = req.body;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Emmpresa no encontrada" });

    const data = await Sale.createFromRestaurantOrder(
      order_id,
      company_id,
      customer_id,
      user_id,
    );
    res
      .status(201)
      .json({ status: true, message: "Venta generada correctamente", data });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const pay_restaurant_sale = async (req, res) => {
  try {
    const { company_id, sale_id } = req.params;
    const { cash_opening_id, amount, payment_method_id, user_id } = req.body;

    if (!cash_opening_id || !amount)
      return res
        .status(400)
        .json({ status: false, message: "Caja y monto son requeridos" });

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Emmpresa no encontrada" });

    const data = await Sale.payRestaurantSale(
      sale_id,
      company_id,
      cash_opening_id,
      amount,
      payment_method_id,
      user_id,
    );
    res
      .status(200)
      .json({ status: true, message: "Pago registrado correctamente", data });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};
