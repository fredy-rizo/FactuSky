import { Report } from "../models/Reports.js";
import { Company } from "../../../Mongo/companies/models/Company.js";

const validateCompany = async (company_id) => {
  const company = await Company.findById(company_id);
  if (!company_id) throw new Error("Empresa no encontrada");

  return company;
};

const getDates = (req) => {
  const { start_date, end_date } = req.query;

  if (!start_date || !end_date)
    throw new Error("start_date y end_date son requeridos");

  return {
    start_date,
    end_date,
  };
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const dashboard_report = async (req, res) => {
  try {
    const { company_id } = req.params;

    await validateCompany(company_id);

    const { start_date, end_date } = getDates(req);

    const data = await Report.dashboard(company_id, start_date, end_date);

    res
      .status(200)
      .json({ status: true, message: "Dashboard cargado correctamente", data });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const sales_summary = async (req, res) => {
  try {
    const { company_id } = req.params;

    await validateCompany(company_id);

    const { start_date, end_date } = getDates(req);

    const data = await Report.salesSummary(company_id, start_date, end_date);
    res
      .status(200)
      .json({ status: true, message: "Resumen de ventas cargado", data });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};
