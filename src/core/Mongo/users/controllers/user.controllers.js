import jwt from "jsonwebtoken";
import config from "../../../../config.js";
import { compare_password, encrypt_password, User } from "../models/User.js";

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const create = async (req, res) => {
  try {
    const { first_name, last_name, email, password, role, active } = req.body;

    if (!first_name || !last_name || !email || !password)
      return res
        .status(400)
        .json({ status: false, message: "Campos requeridos" });

    const data_user = await User.exists({ email: email.toLowerCase() });
    if (data_user)
      return res.status(203).json({
        status: false,
        message: "El correo electronico ya se encuentra registrado",
      });

    const total_user = await User.countDocuments();
    const user_role = total_user === 0 ? "super admin" : role;

    const pass = await encrypt_password(password);
    const new_user = new User({
      role: user_role,
      password: pass,
      first_name,
      last_name,
      active,
      email,
    });

    const data = await new_user.save();
    res
      .status(201)
      .json({ status: true, message: "Usuario creado correctamente", data });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res
        .status(400)
        .json({ status: false, message: "Campos requeridos" });

    const data_user = await User.findOne({ email: email.toLowerCase() });
    if (!data_user)
      return res
        .status(403)
        .json({ status: false, message: "Email no valido" });

    const password_validated = await compare_password(
      password,
      data_user.password,
    );
    if (!password_validated)
      return res
        .status(203)
        .json({ status: false, message: "Contraseña incorrecta" });

    const token = jwt.sign(
      {
        _id: data_user._id,
        first_name: data_user.first_name,
        last_name: data_user.last_name,
        email: data_user.email,
        role: data_user.role,
        active: data_user.active,
      },
      config.SECRET,
      {
        expiresIn: "365d",
      },
    );

    const new_user = { _id: data_user._id, token };

    await User.updateOne({ _id: data_user._id }, new_user);
    res.status(200).json({
      status: true,
      message: "Iniciando sesion...",
      token,
      user: {
        _id: data_user._id,
        first_name: data_user.first_name,
        last_name: data_user.last_name,
        email: data_user.email,
        role: data_user.email,
        active: data_user.active,
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

export const update_data = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { role, active, permissions } = req.body;

    const data_user = await User.findById(user_id);
    if (!data_user)
      return res
        .status(404)
        .json({ status: false, message: "Usuario no encontrado" });

    const updating = {};

    // permissions -> campo no en uso
    if (role !== undefined) updating.role = role;
    if (active !== undefined) updating.active = active;
    if (permissions !== undefined) updating.permissions = permissions;

    await User.updateOne({ _id: user_id }, { $set: updating });

    res
      .status(200)
      .json({ status: true, message: "Usuario actualizado correctamente" });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const list_users = async (req, res) => {
  try {
    const cant = await User.find().countDocuments();
    const data = await User.find({
      skip: req.body.skippag,
      limit: req.body.limit,
      sort: { _id: -1 },
    });

    res.status(200).json({
      status: true,
      message: "Cargando usuarios",
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
