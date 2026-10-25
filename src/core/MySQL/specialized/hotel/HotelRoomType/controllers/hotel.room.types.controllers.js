import { Company } from "../../../../../Mongo/companies/models/Company.js";
import { HotelRoomType } from "../models/HotelRoomType.js";

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const create_room_type = async (req, res) => {
  try {
    const { company_id } = req.params;
    const { name, description, base_price, capacity } = req.body;

    const company = await Company.findById(company_id);
    if (!company)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    if (!name || !base_price)
      return res
        .status(400)
        .json({ status: false, message: "name y base_price son requeridos" });

    if (Number(base_price) < 0)
      return res
        .status(400)
        .json({ status: false, message: "base_price no puede ser negativo" });

    const exists = await HotelRoomType.existsByName(company_id, name);
    if (exists)
      return res.status(400).json({
        status: false,
        message: `Ya existe un tipo de habitacion con el nombre ${name}`,
      });

    const newRoomType = new HotelRoomType({
      company_id,
      name,
      description,
      base_price: Number(base_price),
      capacity: capacity || 2,
    });

    const data = await newRoomType.save();
    res.status(201).json({
      status: true,
      message: "Tipo de habitacion creada correctamente",
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

export const get_room_type = async (req, res) => {
  try {
    const { company_id, id } = req.params;

    const company = await Company.findById(company_id);
    if (!company)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    const roomType = await HotelRoomType.findById(id, company_id);
    if (!roomType)
      return res
        .status(404)
        .json({ status: false, message: "Tipo de habitación no encontrado" });

    res.status(200).json({
      status: true,
      message: "Cargando habitacion",
      data: roomType,
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

export const list_room_types = async (req, res) => {
  try {
    const { company_id } = req.params;
    const { skip = 0, limit = 20, active_only = false } = req.query;

    const [roomTypes, total] = await Promise.all([
      HotelRoomType.findAll(
        company_id,
        Number(skip),
        Number(limit),
        active_only === "true",
      ),
      HotelRoomType.count(company_id, active_only === "true"),
    ]);

    res.status(200).json({
      status: true,
      message: "Cargando todas las habitaciones",
      data: roomTypes,
      pagination: {
        total,
        skip: Number(skip),
        limit: Number(limit),
        has_more: Number(skip) + Number(limit) < total,
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

export const update_room_type = async (req, res) => {
  try {
    const { company_id, id } = req.params;
    const { name, description, base_price, capacity } = req.body;

    const existing = await HotelRoomType.findById(id, company_id);
    if (!existing)
      return res
        .status(404)
        .json({ status: false, message: "Tipo de habitacion no encontrada" });

    if (name && name !== existing.name) {
      const exists = await HotelRoomType.existsByName(company_id, name, id);
      if (exists)
        return res.status(400).json({
          status: false,
          message: `Ya existe un tipo de habitacion con el nombre ${name}`,
        });
    }

    await HotelRoomType.update(id, company_id, {
      name: name || existing.name,
      description:
        description !== undefined ? description : existing.description,
      base_price:
        base_price !== undefined ? Number(base_price) : existing.base_price,
      capacity: capacity !== undefined ? Number(capacity) : existing.capacity,
    });

    const updated = await HotelRoomType.findById(id, company_id);
    res.status(200).json({
      status: true,
      message: "Tipo de habitacion actualizada correctamente",
      updated,
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

export const deactivate_room_type = async (req, res) => {
  try {
    const { company_id, id } = req.params;

    const existing = await HotelRoomType.findById(id, company_id);
    if (!existing)
      return res
        .status(404)
        .json({ status: false, message: "Tipo de habitacion no encontrada" });

    if (!existing.active)
      return res.status(400).json({
        status: false,
        message: "El tipo de habitacion ya esta desactivada",
      });

    const data = await HotelRoomType.deactive(id, company_id);
    res.status(200).json({
      status: true,
      message: "Habitacion desactivada correctamente",
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

export const activate_room_type = async (req, res) => {
  try {
    const { company_id, id } = req.params;

    const existing = await HotelRoomType.findById(id, company_id);
    if (!existing)
      return res
        .status(404)
        .json({ status: false, message: "Tipo de habitacion no encontrada" });

    if (existing.active)
      return res
        .status(400)
        .json({ status: false, message: "Habitación ya esta activa" });

    const data = await HotelRoomType.activate(id, company_id);
    res.status(200).json({
      status: true,
      message: "Habitacion reactivada correctamente",
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

export const get_room_type_statistics = async (req, res) => {
  try {
    const { company_id } = req.params;

    const statistics = await HotelRoomType.getStatistics(company_id);
    res.status(200).json({ status: true, statistics });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};
