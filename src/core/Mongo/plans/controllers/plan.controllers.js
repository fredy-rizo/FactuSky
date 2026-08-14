import { Plan } from "../models/Plan.js";

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const create_plan = async (req, res) => {
  try {
    const {
      code,
      name,
      description,
      price,
      currency,
      billing_cycle,
      modules,
      max_users,
      max_companies,
      trial_days,
      active,
      popular,
      order,
    } = req.body;

    if (!code || !name || price === undefined)
      return res
        .status(400)
        .json({ status: false, message: "Campos requeridos" });

    const exist = await Plan.exists({ code: code.toLowerCase() });
    if (exist)
      return res
        .status(409)
        .json({ status: false, message: "El plan ya existe" });

    const new_plan = new Plan({
      code,
      name,
      description,
      price,
      currency,
      billing_cycle,
      modules,
      max_users,
      max_companies,
      trial_days,
      active,
      popular,
      order,
    });

    const data = await new_plan.save();
    res
      .status(201)
      .json({ status: true, message: "Plan creado correctamente", data });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const update_plan = async (req, res) => {
  try {
    const { plan_id } = req.params;

    const plan = await Plan.findById(plan_id);
    if (!plan)
      return res
        .status(404)
        .json({ status: false, message: "Plan no encontrado" });

    const data = await Plan.updateOne(
      { _id: plan_id },
      {
        $set: req.body,
      },
    );

    res
      .status(200)
      .json({ status: true, message: "Plan actualizado correctamente", data });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const list_plans = async (req, res) => {
  try {
    const cant = await Plan.countDocuments();
    const data = await Plan.find()
      .skip(req.body.skippag)
      .limit(req.body.limit)
      .sort({ order: 1, createdAt: -1 });

    res.status(200).json({
      status: true,
      message: "Cargando planes",
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

export const list_plans_inactive = async (req, res) => {
  try {
    const cant = await Plan.find({ active: false }).countDocuments();
    const data = await Plan.find({ active: false })
      .skip(req.body.skippag)
      .limit(req.body.limit)
      .sort({ _id: -1 });

    res.status(200).json({
      status: true,
      message: "Cargando planes inactivos",
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

export const list_plans_active = async (req, res) => {
  try {
    const cant = await Plan.find({ active: true }).countDocuments();
    const data = await Plan.find({ active: true })
      .skip(req.body.skippag)
      .limit(req.body.limit)
      .sort({ _id: -1 });

    res.status(200).json({
      status: true,
      message: "Cargando planes activos",
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
