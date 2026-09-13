import { RestaurantKitchenItem } from "./RestaurantKitchenItem.js";
import { RestaurantOrder } from "../../orders/models/RestaurantOrder.js";
import { Company } from "../../../../../Mongo/companies/models/Company.js";

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const lists_restaurant_kitchen_items = async (req, res) => {
  try {
    const { company_id } = req.params;

    const company_data = await Company.findById(company_id);
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const status = req.body.status || null;
    const cant = await RestaurantKitchenItem.count(company_id);
    const data = await RestaurantKitchenItem.findAll(
      company_id,
      status,
      req.body.skippag,
      req.body.limit,
    );

    res.status(200).json({
      status: true,
      message: "Cargando cocina...",
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
