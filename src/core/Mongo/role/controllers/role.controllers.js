import { Role } from "../models/Role.js";
import { Company } from "../../companies/models/Company.js";

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const create_role = async (req, res) => {
  try {
    const { company, name, code, description, access, active, system } =
      req.body;

    if (!company || !name || !code)
      return res
        .status(400)
        .json({ status: false, message: "Campos requeridos" });

    const data_company = await Company.exists({ _id: company });
    if (!data_company)
      return res
        .status(400)
        .json({ status: false, message: "Empresa no encontrada" });

    const exist = await Role.exists({ company, code: code.toLowerCase() });
    if (exist)
      return res
        .status(409)
        .json({ status: false, message: "El rol ya existe para esta empresa" });

    const new_role = new Role({
      company,
      name,
      code,
      description,
      access,
      active,
      system,
    });

    const data = await new_role.save();
    res
      .status(201)
      .json({ status: true, message: "Rol creado correctamente", data });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const list_role_company = async (req, res) => {
  try {
    const { company_id } = req.params;

    const company = await Company.findById(company_id);
    if (!company)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const cant = await Role.countDocuments({ company: company_id });
    const data = await Role.find({ company: company_id })
      .skip(req.body.skippag)
      .limit(req.body.limit)
      .sort({ _id: -1 });

    res.status(200).json({
      status: true,
      message: "Cargando roles",
      data,
      pagination: {
        pag: req.body.pag,
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

export const list_role_unique = async (req, res) => {
  try {
    const { role_id } = req.params;

    const data = await Role.findById(role_id).populate(
      "company",
      "name document_number",
    );
    if (!data)
      return res
        .status(404)
        .json({ status: false, message: "Rol no encontrado" });

    res.status(200).json({ status: true, message: "Cargando...", data });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const update_role_company = async (req, res) => {
  try {
    const { role_id } = req.params;

    const role = await Role.findById(role_id);
    if (!role)
      return res
        .status(404)
        .json({ status: false, message: "Rol no encontrado" });

    if (role.system)
      return res.status(403).json({
        status: false,
        message: "Los roles del sistema no pueden modificarse",
      });

    await Role.updateOne(
      { _id: role_id },
      {
        $set: req.body,
      },
    );

    res
      .status(200)
      .json({ status: true, message: "Rol actualizado correctamente" });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const change_role_status = async (req, res) => {
  try {
    const { role_id } = req.params;

    const role = await Role.findById(role_id);
    if (!role)
      return res
        .status(404)
        .json({ status: false, message: "Rol no encontrado" });

    if (role.system)
      return res.status(403).json({
        status: false,
        message: "Los roles del sistema no pueden desactivarse",
      });

    await Role.updateOne(
      { _id: role_id },
      {
        $set: {
          active: !role.active,
        },
      },
    );

    res.status(200).json({
      status: true,
      message: `Rol ${role.active ? "desactivado" : "activado"} correctamente`,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};
