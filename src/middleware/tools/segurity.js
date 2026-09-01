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
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role,
        active: user.active,
        data: user,
      };
      return next();
    }

    const company_user = await CompanyUser.findById(decoded._id)
      .populate("company", "name active")
      .populate("role", "name code access active system");
    if (company_user) {
      req.user = {
        _id: company_user._id,
        type: "company_user",
        company: company_user.company,
        role: company_user.role,
        active: company_user.active,
        data: company_user,
      };
      return next();
    }

    res.status(404).json({ status: false, message: "Usuario no encontrado" });
  } catch (err) {
    if (err.name === "TokenExpiredError")
      return res
        .status(403)
        .json({ status: false, message: "Sesion finalizada" });

    return res.status(403).json({ status: false, message: "Token invalido" });
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

      if (req.user.type === "user" && req.user.role === "super admin")
        return next();

      const userRole =
        typeof req.user.role === "string" ? req.user.role : req.user.role?.code;

      if (role.includes(userRole)) return next();

      return res
        .status(403)
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

      // Super Admin bypass total
      if (req.user.type === "user" && req.user.role === "super admin") {
        return next();
      }

      // CompanyUser administrador bypass
      if (
        req.user.type === "company_user" &&
        req.user.role?.code === "administrador"
      )
        return next();

      if (req.user.type !== "company_user")
        return res
          .status(403)
          .json({ status: false, message: "No tienes acceso a este recurso" });

      const access = req.user.role?.access;
      if (!access)
        return res.status(403).json({
          status: false,
          message: "El rol no tiene accesos configurados",
        });

      // permissions: [module, action] or [module] or []
      // Soporta uso legacy TokenPermissions("products","create") -> module=products, action=create
      // y también sin parámetros (solo verifica company_user)
      if (!permissions.length) return next();

      let moduleKey = permissions[0];
      let actionKey = permissions[1];

      // Si se pasó un solo string con formato "module:action"
      if (
        !actionKey &&
        typeof moduleKey === "string" &&
        moduleKey.includes(":")
      ) {
        const parts = moduleKey.split(":");
        moduleKey = parts[0];
        actionKey = parts[1];
      }

      // Normaliza access: puede ser Map o Object
      const getModuleAccess = (acc, mod) => {
        if (!acc) return null;
        if (acc instanceof Map)
          return acc.get(mod) || acc.get(mod.toLowerCase());
        return acc[mod] || acc[mod.toLowerCase()] || acc[mod.toUpperCase()];
      };

      const moduleAccess = getModuleAccess(access, moduleKey);
      if (!moduleAccess) {
        // Si no hay acción específica, el módulo sin acceso = denegado
        // Pero si no se especificó acción, permitir si el módulo existe aunque vacío => denegar si no existe
        if (!actionKey) {
          return res.status(403).json({
            status: false,
            message: "No tienes acceso a este modulo",
          });
        }
        return res.status(403).json({
          status: false,
          message: "No tienes acceso a este modulo",
        });
      }

      if (actionKey) {
        const actions = Array.isArray(moduleAccess)
          ? moduleAccess
          : [moduleAccess];
        const normalized = actions.map((a) => String(a).toLowerCase());
        if (
          !normalized.includes(String(actionKey).toLowerCase()) &&
          !normalized.includes("*") &&
          !normalized.includes("all")
        ) {
          return res
            .status(403)
            .json({ status: false, message: "No tienes permisos suficientes" });
        }
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
