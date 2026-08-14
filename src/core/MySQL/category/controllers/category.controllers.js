import { Category } from "../models/Category.js";
import { Company } from "../../../Mongo/companies/models/Company.js";

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const create_category = async (req, res) => {
  try {
    const { company_id, name, description, active } = req.body;

    if (!company_id || !name)
      return res
        .status(400)
        .json({ status: false, message: "Campos requeridos" });

    const data_company = await Company.findById(company_id);
    if (!data_company)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const exist = await Category.findAll(company_id);
    const duplicate = exist.find(
      (item) => item.name.toLowerCase() === name.toLowerCase(),
    );
    if (duplicate)
      return res.status(409).json({
        status: false,
        message: "La categoria ya existe para esta empresa",
      });

    const new_category = new Category({
      company_id,
      name,
      description,
      active,
    });

    const data = await new_category.save();
    res
      .status(201)
      .json({ status: true, message: "Categoria creada correctamente", data });
  } catch (err) {
    console.log(err);
    res.status(500).json({});
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const list_categorys = async (req, res) => {
  try {
    const { company_id } = req.params;
    const cant = await Category.count(company_id);
    const data = await Category.findAll(
      company_id,
      req.body.skippag,
      req.body.limit,
    );

    res.status(200).json({
      status: true,
      message: "Cargandos categorias",
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

export const list_category = async (req, res) => {
  try {
    const { company_id, id } = req.params;

    const data = await Category.findById(id, company_id);
    if (!data)
      return res
        .status(404)
        .json({ status: false, message: "Categoria no encontrada" });

    res
      .status(200)
      .json({ status: true, message: "Categoria no encontrada", data });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const update_category = async (req, res) => {
  try {
    const { company_id, id } = req.params;

    const category = await Category.findById(id, company_id);
    if (!category)
      return res
        .status(404)
        .json({ status: false, message: "Categoria no encontrada" });

    await Category.update(id, company_id, req.body);

    const data = await Category.findById(id, company_id);

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

export const remove_category = async (req, res) => {
  try {
    const { company_id, id } = req.params;

    const category = await Category.findById(id, company_id);
    if (!category)
      return res
        .status(404)
        .json({ status: false, message: "Categoria no encontrada" });

    await Category.delete(id, company_id);
    res
      .status(200)
      .json({ status: true, message: "Categoria eliminada correctamente" });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};
