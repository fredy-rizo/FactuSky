import { Module } from "../models/Modules.js";

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const create_module = async (req, res) => {
  try {
    const { code, name, description, icon, category, dependencies, active } =
      req.body;

    if (!code || !name)
      return res
        .status(400)
        .json({ status: flase, message: "Campos requeridos" });

    const exist = await Module.exists({ code: code.toLowerCase() });
    if (exist)
      return res
        .status(409)
        .json({ status: false, message: "El modulo ya existe" });

    const new_module = new Module({
      code,
      name,
      description,
      icon,
      category,
      dependencies,
      active,
    });

    const data = await new_module.save();
    res
      .status(201)
      .json({ status: true, message: "Modulo creado correctamente", data });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const update_module = async (req, res) => {
  try {
    const { module_id } = req.params;

    const module = await Module.findById(module_id);
    if (!module)
      return res
        .status(404)
        .json({ status: false, message: "Modulo no encontrado" });

    await Module.updateOne(
      { _id: module_id },
      {
        $set: req.body,
      },
    );

    res
      .status(200)
      .json({ status: true, message: "Modulo actualizado correctamente" });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const list_modules = async (req, res) => {
  try {
    const cant = await Module.countDocuments();
    const data = await Module.find()
      .skip(req.body.skippag)
      .limit(req.body.limit)
      .sort({ _id: -1 });

    res.status(200).json({
      status: true,
      message: "Cargando modulos",
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

export const list_modules_inactive = async (req, res) => {
  try {
    const cant = await Module.find({ active: false }).countDocuments();
    const data = await Module.find({ active: false })
      .skip(req.body.skippag)
      .limit(req.body.limit)
      .sort({ _id: -1 });

    res.status(200).json({
      status: true,
      message: "Cargando modulos inactivos",
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

export const list_modules_active = async (req, res) => {
  try {
    const cant = await Module.find({ active: true }).countDocuments();
    const data = await Module.find({ active: true })
      .skip(req.body.skippag)
      .limit(req.body.limit)
      .sort({ _id: -1 });

    res.status(200).json({
      status: true,
      message: "Cargando modulos activos",
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
