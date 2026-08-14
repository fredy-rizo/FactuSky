import jwt from "jsonwebtoken";
import config from "../../config.js";
import { User } from "../../core/Mongo/users/models/User.js";
import { CompanyUser } from "../../core/Mongo/companyUser/models/CompanyUser.js";

export const Token = async (req, res, next) => {
  const authHeader = req.headers["token-access"];
  const token = authHeader?.split(" ")[1];

  if (!token)
    return res.status(400).json({ status: false, message: "Sin autorizacion" });

  jwt.verify(token, config.SECRET, async (err, user) => {
    if (err) {
      if (err.message === "jwt expired")
        return res
          .status(403)
          .json({ status: false, message: "Sesion finalizada" });

      return res.status(403).json({
        status: false,
        message: `${err.message}. Rechazo en la conexion`,
      });
    }

    const data_user = await User.findById(user._id);
    if (!data_user)
      return res
        .status(404)
        .json({ status: false, message: "Usuario no encontrado" });

    req.user = {
      _id: data_user._id,
      first_name: data_user.first_name,
      last_name: data_user.last_name,
      email: data_user.email,
      role: data_user.role,
      active: data_user.active,
    };
    next();
    return;
  });
};

export const TokenAny = async (req, res, next) => {
  const authHeader = req.headers["token-access"];
  const token = authHeader?.split(" ")[1];
  if (!token)
    return res.status(400).json({ status: false, message: "Sin autorizacion" });

  try {
    const decoded = jwt.verify(token, config.SECRET);
    const user = await User.findById(decoded._id);

    if (user) {
      req.user = {
        _id: user._id,
        type: "user",
        role: user.role,
        active: user.active,
        permissions: user.permissions || [],
        data: user,
      };
      return next();
    }

    const company_user = await CompanyUser.findById(decoded._id)
      .populate("company", "name active")
      .populate("role", "name code permissions active");
    if (company_user) {
      req.user = {
        _id: company_user._id,
        type: "company_user",
        company: company_user.company,
        role: company_user.role,
        permissions: company_user.role?.permissions || [],
        active: company_user.active,
        data: company_user,
      };
      return next();
    }

    res.status(404).json({ status: false, message: "Usuario no encontrado" });
  } catch (err) {
    if (err.name === "Token expired error")
      return res
        .status(403)
        .json({ status: false, message: "Sesion finalizada" });

    return res.status(403).json({ status: 403, message: "Token invalido" });
  }
};

export const TokenAuthorize = (...role) => {
  return async (req, res, next) => {
    try {
      if (!req.user)
        return res
          .status(401)
          .json({ status: false, message: "No autenticado" });

      if (!req.user.active)
        return res
          .status(403)
          .json({ status: false, message: "Usuario inactivo" });

      if (!role.length) return next();

      if (role.includes(req.user.role)) return next();

      return res
        .statu(403)
        .json({ status: false, message: "No tienes permisos" });
    } catch (err) {
      return res
        .status(500)
        .json({ status: false, message: "Error al validar autorizacion" });
    }
  };
};

// -------- usar para company -------- //
export const TokenPermissions = (...permissions) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          status: false,
          message: "No autenticado",
        });
      }

      if (!req.user.active) {
        return res.status(403).json({
          status: false,
          message: "Usuario inactivo",
        });
      }

      // Super Admin
      if (req.user.type === "user" && req.user.role === "super admin") {
        return next();
      }

      // CompanyUser
      const has_permissions = permissions.every((permission) =>
        (req.user.permissions || []).includes(permission),
      );

      if (!has_permissions) {
        return res.status(403).json({
          status: false,
          message: "No tienes permisos suficientes",
        });
      }

      return next();
    } catch (err) {
      console.log(err);

      return res.status(500).json({
        status: false,
        message: "Error al validar permisos",
      });
    }
  };
};
