import { Product } from "../models/Product.js";
import { Unit } from "../../unit/models/Unit.js";
import { Category } from "../../category/models/Category.js";
import { Company } from "../../../Mongo/companies/models/Company.js";

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const create_product = async (req, res) => {
  try {
    const {
      company_id,
      category_id,
      unit_id,
      sku,
      barcode,
      name,
      description,
      cost,
      price,
      tax_rate,
      minimum_stock,
      active,
    } = req.body;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const category_data = await Category.findById(category_id, company_id);
    if (!category_data)
      return res
        .status(404)
        .json({ status: false, message: "Categoria no encontrada" });

    const unit_data = await Unit.findById(unit_id, company_id);
    if (!unit_data)
      return res
        .status(404)
        .json({ status: false, message: "Unidad no encontrada" });

    if (!company_id || !name)
      return res
        .status(400)
        .json({ status: false, message: "Campos requeridos" });

    const new_products = new Product({
      company_id,
      category_id,
      unit_id,
      sku,
      barcode,
      name,
      description,
      cost,
      price,
      tax_rate,
      minimum_stock,
      active,
    });

    const data = await new_products.save();
    res
      .status(201)
      .json({ status: true, message: "Producto creado correctamente", data });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const list_products = async (req, res) => {
  try {
    const { company_id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(500)
        .json({ status: false, message: "Empresa no encontrada" });

    const cant = await Product.count(company_id);
    const data = await Product.findAll(
      company_id,
      req.body.skippag,
      req.body.limit,
    );

    res.status(200).json({
      status: true,
      message: "Cargando productos...",
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

export const list_product = async (req, res) => {
  try {
    const { company_id, id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const product_data = await Product.findById(id, company_id);
    if (!product_data)
      return res
        .status(404)
        .json({ status: false, message: "Producto no encontrado" });

    res
      .status(200)
      .json({ status: true, message: "Mostrando producto", product_data });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const update_product = async (req, res) => {
  try {
    const { company_id, id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const product = await Product.findById(id, company_id);
    if (!product)
      return res
        .status(404)
        .json({ status: false, message: "Producto no encontrado" });

    await Product.update(id, company_id, req.body);
    const data = await Product.findById(id, company_id);

    res.status(200).json({
      status: true,
      message: "Producto actualizado correctamente",
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

export const remove_product = async (req, res) => {
  try {
    const { company_id, id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const product = await Product.findById(id, company_id);
    if (!product)
      return res
        .status(404)
        .json({ status: false, message: "Producto no encontrado" });

    await Product.delete(id, company_id);
    res
      .status(200)
      .json({ status: true, message: "Producto eliminado correctamente" });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};
