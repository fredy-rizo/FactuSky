import { ExpenseCategory } from "../models/ExpenseCategory.js";
import { Company } from "../../../../Mongo/companies/models/Company.js";
import { Category } from "../../../category/models/Category.js";

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const create_expense_category = async (req, res) => {
  try {
    const { company_id, name, description } = req.body;

    if (!company_id || !name)
      return res
        .status(400)
        .json({ status: false, message: "Empresa y nombre son requeridos" });

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const new_category = new ExpenseCategory({
      company_id,
      name,
      description,
    });

    const data = await new_category.save();
    res.status(201).json({
      status: true,
      message: "Categoria de gasto creada correctamente",
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

export const lists_expense_categories = async (req, res) => {
  try {
    const { company_id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const cant = await ExpenseCategory.count(company_id);
    const data = await ExpenseCategory.findAll(
      company_id,
      req.body.skippag,
      req.body.limit,
    );

    res.status(200).json({
      status: true,
      message: "Cargando categorias de gastos...",
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

export const list_expense_category = async (req, res) => {
  try {
    const { company_id, id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const data = await ExpenseCategory.findById(id, company_id);
    if (!data)
      return res
        .status(404)
        .json({ status: false, message: "Categoria de gasto no encontrada" });

    res
      .status(200)
      .json({ status: true, message: "Cargando cartegoria de gasto", data });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const update_expense_category = async (req, res) => {
  try {
    const { company_id, id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const category_data = await ExpenseCategory.findById(id, company_id);
    if (!category_data)
      return res
        .status(404)
        .json({ status: false, message: "Categoria de gasto no encontrada" });

    await ExpenseCategory.update(id, company_id, req.body);

    const data = await ExpenseCategory.findById(id, company_id);

    res.status(200).json({
      status: true,
      message: "Categoria actualizada correctamente",
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

export const toggle_expense_category = async (req, res) => {
  try {
    const { company_id, id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const category_data = await ExpenseCategory.findById(id, company_id);
    if (!category_data)
      return res
        .status(404)
        .json({ status: false, message: "Categoria de gasto no encontrada" });

    const new_status =
      category_data.status === "active" ? "inactive" : "active";

    await ExpenseCategory.updateStatus(id, company_id, new_status);

    res.status(200).json({
      status: true,
      message: `Categoria ${new_status === "active" ? "activada" : "desactivada"} correctamente`,
      data: {
        id,
        status: new_status,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};
