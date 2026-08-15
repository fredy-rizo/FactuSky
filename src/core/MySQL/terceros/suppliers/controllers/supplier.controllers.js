import { Supplier } from "../models/Supplier.js";
import { Company } from "../../../../../core/Mongo/companies/models/Company.js";

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const create_supplier = async (req, res) => {
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
      return res
        .status(400)
        .json({ status: false, message: "Campos requeridos" });

    if (document_number) {
      const exit = await Supplier.findByDocument(company_id, document_number);

      if (exit)
        return res
          .status(409)
          .json({
            status: false,
            message: "El documento ya esta registrado para esta empresa",
          });
    }

    const new_supplier = new Supplier({
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

    const data = await new_supplier.save();
    res
      .status(201)
      .json({ status: false, message: "Proveedor creado correctamente", data });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};
