import { Company } from "../../../../../Mongo/companies/models/Company.js";
import { HotelRoom } from "../models/HotelRoom.js";

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const create_room = async (req, res) => {
  try {
    const { company_id } = req.params;
    const { room_type_id, room_number, floor, custom_price, notes } = req.body;

    const company = await Company.findById(company_id);
    if (!company)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    if (!room_type_id || !room_number)
      return res
        .status(400)
        .json({
          status: false,
          message: "room_type_id y room_type son requeridos",
        });

    try {
      await HotelRoom.validateRoomType(room_number, company_id);
    } catch (err) {
      return res.status(400).json({ status: false, message: err.message });
    }

    const exists = await HotelRoom.existsRoomNumber(company_id, room_number);
    if (exists)
      return res
        .status(400)
        .json({
          status: false,
          message: `Ya existe una habitacion con el numero ${room_number}`,
        });

    if (custom_price !== undefined && custom_price !== null) {
      if (Number(custom_price) < 0)
        return res
          .status(400)
          .json({
            status: false,
            message: "custom_price no puede ser negativo",
          });
    }

    const new_room = new HotelRoom({
      company_id,
      room_type_id,
      room_number: String(room_number).trim(),
      floor: floor ? String(floor).trim() : null,
      custom_price: custom_price ? Number(custom_price) : null,
      notes,
    });

    const data = await new_room.save();
    res
      .status(201)
      .json({ status: true, message: "Habitacion creada correctamente", data });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};
