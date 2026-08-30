import { Expense } from "../models/Expense.js";
import { Company } from "../../../../Mongo/companies/models/Company.js";
import { ExpenseCategory } from "../../expenseCategory/models/ExpenseCategory.js";

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const create_expense = async (req, res) => {
  try {
    const {
      company_id,
      category_id,
      supplier_id,
      payment_method_id,
      cash_register_id,
      expense_number,
      description,
      expense_date,
      subtotal,
      tax,
      discount,
      notes,
      user_id,
    } = req.body;

    if (!company_id || !category_id || !description)
      return res.status(400).json({
        status: false,
        message: "Empresa, categoria y descripcion son requeridos",
      });

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const category = await ExpenseCategory.findById(category_id, company_id);
    if (!category)
      return res
        .status(404)
        .json({ status: false, message: "Categoria de gasto no encontrada" });

    if (category.status !== "active")
      return res.status(400).json({
        status: false,
        message: "La categoria de gasto esta inactiva",
      });

    const expenseSubtotal = Number(subtotal || 0);
    const expenseTax = Number(tax || 0);
    const expenseDiscount = Number(discount || 0);
    const total = expenseSubtotal + expenseTax - expenseDiscount;

    if (total <= 0)
      return res.status(400).json({
        status: false,
        message: "El total del gasto debe ser mayor que cero",
      });

    const new_expense = new Expense({
      company_id,
      category_id,
      supplier_id,
      payment_method_id,
      cash_register_id,
      expense_number: expense_number || `GAS-${Date.now()}`,
      description,
      expense_date: expense_date || new Date(),
      subtotal: expenseSubtotal,
      tax: expenseTax,
      discount: expenseDiscount,
      total,
      notes,
      user_id,
      status: "draft",
      payment_status: "pending",
    });

    const data = await new_expense.save();
    res
      .status(201)
      .json({ status: true, message: "Gasto creado correctamente", data });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const lists_expenses = async (req, res) => {
  try {
    const { company_id } = req.params;
    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const cant = await Expense.count(company_id);
    const data = await Expense.findAll(
      company_id,
      req.body.skippag,
      req.body.limit,
    );

    res.status(200).json({
      status: true,
      message: "Cargando gastos...",
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

export const list_expense = async (req, res) => {
  try {
    const { company_id, id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const data = await Expense.findById(id, company_id);
    if (!data)
      return res
        .status(404)
        .json({ status: false, message: "Gasto no encontrado" });

    res.status(200).json({ status: true, message: "Cargando gasto...", data });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const update_expense = async (req, res) => {
  try {
    const { company_id, id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const expense = await Expense.findById(id, company_id);
    if (!expense)
      return res
        .status(404)
        .json({ status: false, message: "Gasto no encontrado" });

    if (expense.status !== "draft")
      return res.status(400).json({
        status: false,
        message: "Solo se pueden modificar gastos en estado draft",
      });

    const subtotal = Number(req.body.subtotal || 0);
    const tax = Number(req.body.tax || 0);
    const discount = Number(req.body.discount || 0);
    const total = subtotal + tax - discount;

    await Expense.update(id, company_id, {
      ...req.body,
      subtotal,
      tax,
      discount,
      total,
    });

    const data = await Expense.findById(id, company_id);
    res.status(200).json({
      status: true,
      message: " Gasto actualizado correctamente",
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

export const approve_expense = async (req, res) => {
  try {
    const { company_id, id } = req.params;

    const { approved_by } = req.body;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const expense = await Expense.findById(id, company_id);
    if (!expense)
      return res
        .status(404)
        .json({ status: false, message: "Gasto no encontrado" });

    if (expense.status !== "draft")
      return res.status(400).json({
        status: false,
        message: "Solo se pueden aprobar gastos en draft",
      });

    await Expense.approve(id, company_id, approved_by);

    const data = await Expense.findById(id, company_id);
    res
      .status(200)
      .json({ status: true, message: "Gasto aprobado correctamente", data });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const cancel_expense = async (req, res) => {
  try {
    const { company_id, id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const expense = await Expense.findById(id, company_id);
    if (!expense)
      return res
        .status(404)
        .json({ status: false, message: "Gasto no encontrado" });

    if (!["draft", "approved"].includes(expense.status))
      return res
        .status(400)
        .json({ status: false, message: "Este gasto no puede ser cancelado" });

    if (expense.payment_status === "paid")
      return res.status(400).json({
        status: false,
        message: "No se puede cancelar un gasto que ya fue pagado",
      });

    await Expense.cancel(id, company_id);
    res
      .status(200)
      .json({ status: true, message: "Gasto cancelado correctamente" });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const pending_expenses = async (req, res) => {
  try {
    const { company_id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const cant = await Expense.count(company_id);
    const data = await Expense.findPendingPayments(
      company_id,
      req.body.skippag,
      req.body.limit,
    );

    res.status(200).json({
      status: true,
      message: "Cargando gastos pendiente de pago",
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
