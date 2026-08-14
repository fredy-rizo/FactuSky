import { Module } from "../../moduls/models/Modules.js";
import { Plan } from "../../plans/models/Plan.js";
import { Company } from "../models/Company.js";

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const create_company = async (req, res) => {
  try {
    const {
      name,
      trade_name,
      document_type,
      document_number,
      email,
      phone,
      address,
      city,
      country,
      business_type,
      plan,
      subscription_start,
      subscription_end,
    } = req.body;
    const exist = await Company.exists({ document_number });
    if (exist)
      return res.status(409).json({
        status: false,
        message: "La empresa ya se encuentra registrada",
      });

    // Buscar plan
    let plan_data = null;

    if (plan) {
      plan_data = await Plan.findById(plan);

      if (!plan_data) {
        return res.status(404).json({
          status: false,
          message: "El plan no existe",
        });
      }

      if (!plan_data.active) {
        return res.status(400).json({
          status: false,
          message: "El plan seleccionado no esta activo",
        });
      }
    }

    // Buscar modulos del plan
    // Buscar modulos del plan
    let modules = [];

    if (plan_data?.modules?.length) {
      const module_codes = [...new Set(plan_data.modules)];

      const modules_data = await Module.find({
        code: {
          $in: module_codes,
        },
        active: true,
      });

      modules = modules_data.map((module) => ({
        module: module._id,
        code: module.code,
        name: module.name,
        active: true,
        activated_at: new Date(),
      }));
    }

    const new_company = new Company({
      name,
      trade_name,
      document_type,
      document_number,
      email,
      phone,
      address,
      city,
      country,
      business_type,
      plan: plan || null,
      modules,
      active: true,
      subscription_start: subscription_start || new Date(),
      subscription_end: subscription_end || null,
    });

    const data = await new_company.save();

    res
      .status(201)
      .json({ status: true, message: "Empresa creada correctamente", data });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const list_companys = async (req, res) => {
  try {
    const cant = await Company.countDocuments();
    const data = await Company.find()
      .populate("plan", "code name price")
      .populate("modules.module", "code name active")
      .skip(req.body.skippag)
      .limit(req.body.limit)
      .sort({ _id: -1 });

    res.status(200).json({
      status: true,
      message: "Cargandos empresas",
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

export const list_company = async (req, res) => {
  try {
    const { company_id } = req.params;

    const data = await Company.findById(company_id)
      .populate("plan", "code name price billing_cycle")
      .populate("modules.module", "code name description icon active");
    if (!data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    res.status(200).json({ status: false, message: "Cargando empresa", data });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const list_company_inactives = async (req, res) => {
  try {
    const cant = await Company.find({ active: false }).countDocuments();
    const data = await Company.find({ active: false })
      .skip(req.body.skippag)
      .limit(req.body.limit)
      .sort({ _id: -1 });

    res.status(200).json({
      status: true,
      message: "Cargando empresas inactivas",
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

export const list_company_actives = async (req, res) => {
  try {
    const cant = await Company.find({ active: true }).countDocuments();
    const data = await Company.find({ active: true })
      .skip(req.body.skippag)
      .limit(req.body.limit)
      .sort({ _id: -1 });

    res.status(200).json({
      status: true,
      message: "Cargando empresas activas",
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

export const update_company = async (req, res) => {
  try {
    const { company_id } = req.params;

    const company = await Company.findById(company_id);
    if (!company)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    await Company.updateOne(
      { _id: company_id },
      {
        $set: req.body,
      },
    );

    res
      .status(200)
      .json({ status: true, message: "Empresa actualizada correctamente" });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const change_company_status = async (req, res) => {
  try {
    const { company_id } = req.params;

    const company = await Company.findById(company_id);
    if (!company)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    await Company.updateOne(
      { _id: company_id },
      {
        $set: {
          active: !company.active,
        },
      },
    );

    res.status(200).json({
      status: true,
      message: `Empresa ${company.active ? "desactivada" : "activada"} correctamente`,
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

export const change_module_company_status = async (req, res) => {
  try {
    const { company_id, module_id } = req.params;

    const company = await Company.findById(company_id);
    if (!company)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const module_index = company.modules.findIndex(
      (item) => item.module.toString() === module_id,
    );
    if (module_index === -1)
      return res.status(404).json({
        status: false,
        message: "El modulo no esta asignado a esta empresa",
      });

    company.modules[module_index].active =
      !company.modules[module_index].active;

    await company.save();

    res.status(200).json({
      status: false,
      message: `Modulo ${company.modules[module_index].active ? "activad" : "desactivado"} correctamente`,
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

export const add_module_company = async (req, res) => {
  try {
    const { company_id, module_id } = req.params;

    const company = await Company.findById(company_id);
    if (!company)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const module = await Module.findById(module_id);
    if (!module)
      return res
        .status(404)
        .json({ status: false, message: "Modulo no encontrado" });

    const exists = company.modules.some(
      (item) => item.module.toString() === module_id,
    );
    if (exists)
      return res.status(409).json({
        status: false,
        message: "El modulo ya esta asignado a la empresa",
      });

    company.modules.push({
      module: module._id,
      code: module.code,
      name: module.name,
      active: true,
      activated_at: new Date(),
    });

    const data = await company.save();
    res
      .status(201)
      .json({ status: true, message: "Modulo agregado correctamente", data });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};
