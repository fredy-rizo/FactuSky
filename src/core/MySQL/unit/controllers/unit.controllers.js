import { Unit } from "../models/Unit.js";
import { Company } from "../../../Mongo/companies/models/Company.js";

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const create_unit = async (req, res) => {
  try {
    const { company_id, name, abbreviation, description, active } = req.body;

    if (!company_id || !name || !abbreviation)
      return res
        .status(400)
        .json({ status: false, message: "Campos requeridos" });

    const data_company = await Company.findById(company_id);
    if (!data_company)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const new_unit = new Unit({
      company_id,
      name,
      abbreviation,
      description,
      active,
    });

    const data = await new_unit.save();
    res
      .status(201)
      .json({ status: true, message: "Unidad creada correctamente", data });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const list_units = async (req, res) => {
  try {
    const { company_id } = req.params;
    const cant = await Unit.count(company_id);
    const data = await Unit.findAll(
      company_id,
      req.body.skippag,
      req.body.limit,
    );

    res.status(200).json({
      status: true,
      message: "Cargando unidades...",
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

export const list_unit = async (req, res) => {
  try {
    const { company_id, id } = req.params;

    const data = await Unit.findById(id, company_id);
    if (!data)
      return res
        .status(404)
        .json({ status: false, message: "Unidad no encontrada" });

    res.status(200).json({ status: true, message: "Cargando unidad...", data });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const update_unit = async (req, res) => {
  try {
    const { company_id, id } = req.params;

    const unit = await Unit.findById(id, company_id);
    if (!unit)
      return res
        .status(404)
        .json({ status: false, message: "Unidad no encontrada" });

    await Unit.update(id, company_id, req.body);
    const data = await Unit.findById(id, company_id);

    res.status(200).json({
      status: true,
      message: "Unidad actualizada correctamente",
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

export const remove_unit = async (req, res) => {
  try {
    const { company_id, id } = req.params;

    const unit = await Unit.findById(id, company_id);
    if (!unit)
      return res
        .status(404)
        .json({ status: false, message: "Unidad no encontrada" });

    await Unit.delete(id, company_id);
    res
      .status(200)
      .json({ status: true, message: "Unidad eliminada correctamente" });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};
