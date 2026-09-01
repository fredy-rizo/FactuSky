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
