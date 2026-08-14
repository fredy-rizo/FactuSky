import jwt from "jsonwebtoken";
import config from "../../config.js";
import { User } from "../../core/Mongo/users/models/User.js";

export const BootstrapCreateUser = async (req, res, next) => {
  try {
    const count = await User.countDocuments();

    if (count === 0) {
      return next();
    }

    const authHeader = req.headers["token-access"];
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        status: false,
        message: "Sin autorización",
      });
    }

    const decoded = jwt.verify(token, config.SECRET);

    const user = await User.findById(decoded._id);

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "Usuario no encontrado",
      });
    }

    if (!user.active) {
      return res.status(403).json({
        status: false,
        message: "Usuario inactivo",
      });
    }

    if (user.role !== "super admin") {
      return res.status(403).json({
        status: false,
        message: "No tienes permisos",
      });
    }

    req.user = user;

    return next();
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      status: false,
      message: err.message,
    });
  }
};
