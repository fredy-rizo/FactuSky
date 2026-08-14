import { Customer } from "../models/Customer.js";
import { Company } from "../../../../Mongo/companies/models/Company.js";

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const create_customers = async (req, res) => {
  try {
    const {
      company_id,
      document_type,
      document_number,
      first_name,
      last_name,
      business_name,
      email,
      phone,
      address,
      city,
      state,
      country,
      notes,
      active,
    } = req.body;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    if (!first_name && !business_name)
      return res.status(400).json({
        status: false,
        message: "Nombre o nombre de empresa requeridos",
      });

    if (document_number) {
      const exist = await Customer.findByDocument(company_id, document_number);

      if (exist)
        return res.status(409).json({
          status: false,
          message: "El documento ya esta registrado para esta empresa",
        });
    }

    const new_customer = new Customer({
      company_id,
      document_type,
      document_number,
      first_name,
      last_name,
      business_name,
      email,
      phone,
      address,
      city,
      state,
      country,
      notes,
      active,
    });

    const data = await new_customer.save();
    res
      .status(201)
      .json({ status: true, message: "Cliente creado correctamente", data });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const list_customers = async (req, res) => {
  try {
    const { company_id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const cant = await Customer.count(company_id);
    const data = await Customer.findAll(
      company_id,
      req.body.skippag,
      req.body.limit,
    );

    res.status(200).json({
      status: true,
      message: "Cargando clientes",
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

export const list_customer = async (req, res) => {
  try {
    const { company_id, id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const data = await Customer.findById(id, company_id);
    if (!data)
      return res
        .status(404)
        .json({ status: false, message: "Cliente no encontrado" });

    res.status(200).json({ status: true, message: "Cargando cliente", data });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const update_customer = async (req, res) => {
  try {
    const { company_id, id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const customer = await Customer.findById(id, company_id);
    if (!customer)
      return res
        .status(404)
        .json({ status: false, message: "Cliente no encontrado" });

    await Customer.update(id, company_id, req.body);

    const data = await Customer.findById(id, company_id);
    res.status(200).json({
      status: true,
      message: "Cliente actualizado correctamente",
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

export const remove_customer = async (req, res) => {
  try {
    const { company_id, id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const customer = await Customer.findById(id, company_id);
    if (!customer)
      return res
        .status(404)
        .json({ status: false, message: "Cliente no encontrado" });

    await Customer.delete(id, company_id);
    res
      .status(200)
      .json({ status: true, message: "Cliente eliminado correctamente" });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};
