import { Company } from "../../../../../Mongo/companies/models/Company.js";
import { RestaurantReservation } from "../models/RestaurantReservation.js";

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

const validate_company = async (company_id) => {
  const company_data = await Company.findById(company_id);
  if (!company_data) throw new Error("Empresa no encontrada");
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const create_restaurant_reservation = async (req, res) => {
  try {
    const { company_id } = req.params;
    const {
      customer_id,
      table_id,
      reservation_date,
      reservation_time,
      party_size,
      customer_name,
      customer_phone,
      notes,
      status,
      user_id,
    } = req.body;

    await validate_company(company_id);

    if (!reservation_date || !reservation_time || !party_size)
      return res.status(400).json({
        status: false,
        message: "Fecha, hora y cantidad de personas son requeridas",
      });

    const new_reservation = new RestaurantReservation({
      company_id,
      customer_id,
      table_id,
      reservation_date,
      reservation_time,
      party_size,
      customer_name,
      customer_phone,
      notes,
      status,
      user_id,
    });

    const data = await new_reservation.save();
    res
      .status(201)
      .json({ status: false, message: "Reserva creada correctamente", data });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const lists_restaurant_reservations = async (req, res) => {
  try {
    const { company_id } = req.params;
    await validate_company(company_id);

    const cant = await RestaurantReservation.count(company_id);
    const data = await RestaurantReservation.findAll(company_id);

    res.status(200).json({
      status: true,
      message: "Reservas cargadas correctamente",
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

export const list_restaurant_reservations_by_date = async (req, res) => {
  try {
    const { company_id, date } = req.params;
    console.log("params", req.params);

    await validate_company(company_id);

    const cant = await RestaurantReservation.countByDate(company_id, date);
    const data = await RestaurantReservation.findByDate(company_id, date);

    res.status(200).json({
      status: true,
      message: "Reservas del dia cargadas correctamente",
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

export const restaurant_reservation_availability = async (req, res) => {
  try {
    const { company_id } = req.params;
    const { reservation_date, reservation_time, party_size, table_id } =
      req.query;

    await validate_company(company_id);

    if (!reservation_date || !reservation_time || !party_size)
      return res.status(400).json({
        status: false,
        message: "Fecha, hora y cantidad de personas son requeridas",
      });

    const data = await RestaurantReservation.checkAvailability(
      company_id,
      reservation_date,
      reservation_time,
      Number(party_size),
      table_id || null,
    );
    res.status(200).json({
      status: true,
      message: "Disponibilidad consultada correctamente",
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

export const update_restaurant_reservation = async (req, res) => {
  try {
    const { company_id, id } = req.params;

    await validate_company(company_id);

    const reservation = await RestaurantReservation.findById(id, company_id);
    if (!reservation)
      return res
        .status(404)
        .json({ status: false, message: "Reserva no encontrada" });

    await RestaurantReservation.update(id, company_id, req.body);

    const data = await RestaurantReservation.findById(id, company_id);
    res.status(200).json({
      status: true,
      message: "Reserva actualizada correctamente",
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

export const confirm_restaurant_reservation = async (req, res) => {
  try {
    const { company_id, id } = req.params;

    await validate_company(company_id);

    const reservation = await RestaurantReservation.findById(id, company_id);
    if (!reservation)
      return res
        .status(404)
        .json({ status: false, message: "Reserva no encontrada" });

    await RestaurantReservation.confirm(id, company_id);

    const data = await RestaurantReservation.findById(id, company_id);
    res.status(200).json({
      status: true,
      message: "Reserva confirmada correctamente",
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

export const arrive_restaurant_reservation = async (req, res) => {
  try {
    const { company_id, id } = req.params;

    await validate_company(company_id);

    const reservation = await RestaurantReservation.findById(id, company_id);
    if (!reservation)
      return res
        .status(404)
        .json({ status: false, message: "Reserva no encontrada" });

    await RestaurantReservation.arrive(id, company_id);

    const data = await RestaurantReservation.findById(id, company_id);
    res
      .status(200)
      .json({ status: true, message: "Cliente marcado como llegado", data });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const cancel_restaurant_reservation = async (req, res) => {
  try {
    const { company_id, id } = req.params;

    await validate_company(company_id);

    const reservation = await RestaurantReservation.findById(id, company_id);
    if (!reservation)
      return res
        .status(404)
        .json({ status: false, message: "Reserva no encontrada" });

    await RestaurantReservation.cancel(id, company_id);
    res
      .status(200)
      .json({ status: true, message: "Reserva cancelada correctamente" });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const no_show_restaurant_reservation = async (req, res) => {
  try {
    const { company_id, id } = req.params;

    await validate_company(company_id);

    const reservation = await RestaurantReservation.findById(id, company_id);
    if (!reservation)
      return res
        .status(404)
        .json({ status: false, message: "Reserva no encontrada" });

    await RestaurantReservation.noShow(id, company_id);

    const data = await RestaurantReservation.findById(id, company_id);
    res
      .status(200)
      .json({ status: true, message: "Reserva marcada como no-show", data });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};
