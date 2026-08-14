import jwt from "jsonwebtoken";
import { Role } from "../../role/models/Role.js";
import { Company } from "../../companies/models/Company.js";
import {
  encrypt_password,
  compare_password,
  CompanyUser,
} from "../models/CompanyUser.js";
import config from "../../../../config.js";

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const create = async (req, res) => {
  try {
    const {
      company,
      role,
      first_name,
      last_name,
      email,
      phone,
      document_type,
      document_number,
      password,
      active,
    } = req.body;

    if (!company || !role || !first_name || !last_name || !email || !password)
      return res
        .status(400)
        .json({ status: false, message: "Campos requeridos" });

    const company_data = await Company.exists({ _id: company });
    if (!company_data)
      return res
        .status(404)
        .json({ status: false, message: "Empresa no encontrada" });

    if (req.user.type === "company_user") {
      const user_company_id = req.user.Company?._id || req.user.company;

      if (!user_company_id || user_company_id.toString() !== company.toString())
        return res.status(403).json({
          status: false,
          message: "No puedes crear usuarios para otra empresa",
        });
    }

    const role_data = await Role.findOne({
      _id: role,
      company,
    });
    if (!role_data)
      return res
        .status(404)
        .json({ status: false, message: "El rol no existe para esta empresa" });

    if (!role_data.active)
      return res.status(400).json({
        status: false,
        message: "el rol seleccionado esta desactivado",
      });

    const exist_email = await CompanyUser.exists({
      company,
      email: email.toLowerCase(),
    });
    if (exist_email)
      return res.status(409).json({
        status: false,
        message: "El correo ya esta registrado en esta empresa",
      });

    const pass = await encrypt_password(password);
    const new_company_user = new CompanyUser({
      company,
      role,
      first_name,
      last_name,
      email: email.toLowerCase(),
      phone,
      document_type,
      document_number,
      password: pass,
      active: active !== undefined ? active : true,
      password_changed: false,
    });

    const response = new_company_user.toObject();
    delete response.password;
    delete response.token;

    const data = await new_company_user.save();
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

    const data_user = await CompanyUser.findOne({ email: email.toLowerCase() })
      .populate("company", "name active")
      .populate("role", "name code permissions active");
    if (!data_user)
      return res
        .status(403)
        .json({ status: false, message: "Email requerido" });

    if (!data_user.active)
      return res
        .status(403)
        .json({ status: false, message: "Usuario desativado" });

    if (!data_user.company?.active)
      return res
        .status(403)
        .json({ status: false, message: "La empresa esta desactivada" });

    if (!data_user.role?.active)
      return res
        .status(403)
        .json({ status: false, message: "El rol esta desactivado" });

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
        company: data_user.company,
        role: data_user.role,
        first_name: data_user.first_name,
        last_name: data_user.last_name,
        email: data_user.email,
      },
      config.SECRET,
      {
        expiresIn: "365d",
      },
    );

    await CompanyUser.updateOne(
      {
        _id: data_user._id,
      },
      {
        $set: {
          token,
          last_login: new Date(),
        },
      },
    );

    res.status(200).json({
      status: true,
      message: "Iniciando sesion...",
      token,
      user: {
        _id: data_user._id,
        company: data_user.company,
        role: data_user.role,
        first_name: data_user.first_name,
        last_name: data_user.last_name,
        email: data_user.email,
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

export const list_users_company = async (req, res) => {
  try {
    const { company_id } = req.params;

    if (req.user.tpye === "company_user") {
      const user_company_id = req.user.company?._id || req.user.company;

      if (
        !user_company_id ||
        user_company_id.toString() !== company_id.toString()
      )
        return res.status(403).json({
          status: false,
          message: "No puedes consultar usuarios de otra empresa",
        });
    }

    const cant = await CompanyUser.countDocuments({ company: company_id });
    const data = await CompanyUser.find({ company: company_id })
      .populate("role", "name code permissions active")
      .select("-password -token")
      .skip(req.body.skippag)
      .limit(req.body.limit)
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: true,
      message: "Cargando usuarios...",
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

export const list_user_company = async (req, res) => {
  try {
    const { user_id } = req.params;

    const data = await CompanyUser.findById(user_id)
      .populate("company", "name document_number active")
      .populate("role", "name code permissions active")
      .select("-password -token");
    if (!data)
      return res
        .status(404)
        .json({ status: false, message: "Usuario no encontrado" });

    res.status(200).json({ status: true, message: "Cargando...", data });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const list_users_inactives_companies = async (req, res) => {
  try {
    const { company_id } = req.params;

    const cant = await CompanyUser.find({
      active: false,
      company: company_id,
    })
      .countDocuments()
      .select("-password -token");
    const data = await CompanyUser.find({ active: false, company: company_id })
      .select("-password -token")
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

export const list_users_actives_companies = async (req, res) => {
  try {
    const { company_id } = req.params;

    const cant = await CompanyUser.find({
      active: true,
      company: company_id,
    })
      .countDocuments()
      .select("-password -token");
    const data = await CompanyUser.find({ active: true, company: company_id })
      .select("-password -token")
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

export const update_user_company = async (req, res) => {
  try {
    const { user_id } = req.params;

    const user = await CompanyUser.findById(user_id);
    if (!user)
      return res
        .status(404)
        .json({ status: false, message: "Usuario no encontrado" });

    const {
      role,
      first_name,
      last_name,
      email,
      phone,
      document_type,
      document_number,
      active,
    } = req.body;

    if (role !== undefined) {
      const role_data = await Role.findOne({
        _id: role,
        company: user.company,
      });
      if (!role_data)
        return res.status(404).json({
          status: false,
          message: "El rol no pertenece a esta empresa",
        });

      if (!role_data.active)
        return res.status(400).json({
          status: false,
          message: "El rol seleccionado esta desactivado",
        });
    }

    if (email !== undefined) {
      const email_exist = await CompanyUser.exists({
        company: user.company,
        email: email.toLowerCase(),
        _id: { $ne: user_id },
      });
      if (email_exist)
        return res.status(409).json({
          status: false,
          message: "El correo ya esta registrado en esta empresa",
        });
    }

    const updating = {};

    if (role !== undefined) updating.role = role;
    if (first_name !== undefined) updating.first_name = first_name;
    if (last_name !== undefined) updating.last_name = last_name;
    if (email !== undefined) updating.email = email;
    if (phone !== undefined) updating.phone = phone;
    if (document_type !== undefined) updating.document_type = document_type;
    if (document_number !== undefined)
      updating.document_number = document_number;
    if (active !== undefined) updating.active = active;

    await CompanyUser.updateOne(
      { _id: user_id },
      {
        $set: updating,
      },
    );

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

export const change_password_user_company = async (req, res) => {
  try {
    const { user_id } = req.params;

    const { current_password, new_password } = req.body;

    if (!current_password || !new_password)
      return res
        .status(400)
        .json({ status: false, message: "Campos requeridos" });

    const user = await CompanyUser.findById(user_id);
    if (!user)
      return res
        .status(404)
        .json({ status: false, message: "Usuario no encontrado" });

    const valid = await compare_password(current_password, user.password);
    if (!valid)
      return res
        .status(403)
        .json({ status: false, message: "Contraseña actual incorrecta" });

    const password = await encrypt_password(new_password);
    await CompanyUser.updateOne(
      { _id: user_id },
      {
        $set: {
          password,
          password_changed: true,
        },
      },
    );

    res
      .status(200)
      .json({ status: true, message: "Contraseña actualizada correctamente" });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const change_status_user_company = async (req, res) => {
  try {
    const { user_id } = req.params;

    const user = await CompanyUser.findById(user_id);
    if (!user)
      return res.status(404).json({ message: "Usuario no encontrado" });

    await CompanyUser.updateOne(
      { _id: user_id },
      {
        $set: {
          active: !user.active,
        },
      },
    );

    res.status(200).json({
      status: true,
      message: `Usuario ${user.active ? "desactivado" : "activado"} correctamente`,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};
