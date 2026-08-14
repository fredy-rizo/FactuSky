import fs from "fs";
import path from "path";
import sharp from "sharp";
import mongoose from "mongoose";
import cloudinary from "../Cloudinary/Cloudinary.js";

export const upload_image = async (image, name) => {
  try {
    const datename =
      new Date().getFullYear() +
      new Date().getDate() +
      new Date().getMonth() +
      new Date().getHours() +
      new Date().getMinutes() +
      "_" +
      new Date().getSeconds() +
      new Date().getMilliseconds();

    const result = await cloudinary.uploader.upload(image, {
      folder: "",
      public_id: `${datename}${name.replace(".webp", "")}`,
      resource_type: "image",
    });

    return {
      imageLink: result.secure_url,
      publicId: result.public_id,
    };
  } catch (err) {
    console.error("Error al buscar directorio upload_image", err);
    return { imageLink: "" };
  }
};

export const delete_image = (files) => {
  try {
    if (!files || !Array.isArray(files)) return;

    const flatFiles = files.flat();
    const deleteFiles = new Set();

    for (const element of flatFiles) {
      if (typeof element !== "string") continue;

      const normalizedPath = path.normalize(element);

      if (fs.existsSync(normalizedPath) && !deleteFiles.has(normalizedPath)) {
        fs.unlinkSync(normalizedPath);
        deleteFiles.add(normalizedPath);
      }
    }
  } catch (err) {
    console.error("Error al buscar directorio 2 → ", err);
  }
};

export const generate_image = async (files, fieldName) => {
  const images = [];
  const deleteFiles = [];

  const allSizes = [{ suffix: "avatar", width: 1920, height: 1080 }];

  const fields = Array.isArray(fieldName) ? fieldName : [fieldName];

  const normalizedFiles = Array.isArray(files)
    ? files
    : Object.entries(files || {}).flatMap(([fieldName, arr]) =>
        arr.map((file) => ({
          ...file,
          fieldName,
        })),
      );

  // console.log("req.files:", files);
  // console.log("normalizedFiles:", normalizedFiles);
  const processingPromises = normalizedFiles.map(async (element) => {
    const fileNameWidthoutSpaces = element.originalname.replace(/\s/g, "_");
    const baseName = fileNameWidthoutSpaces.split(".").slice(0, -1).join(".");

    const imageId = new mongoose.Types.ObjectId();
    const imageObject = { _id: imageId };

    const suffix =
      element.fieldName === "files"
        ? fields[normalizedFiles.indexOf(element)]
        : element.fieldName;
    const size = allSizes.find((s) => s.suffix === suffix);
    if (!size) return;

    const outputPath = `${element.destination}/${suffix}_${baseName}.webp`;

    await sharp(element.path)
      .resize(size.width, size.height)
      .webp({ quality: 70 })
      .toFile(outputPath);

    const uploadResult = await upload_image(
      outputPath,
      `${suffix}_${baseName}`,
    );

    const imageLink = uploadResult?.imageLink || "";

    imageObject[`url${suffix.charAt(0).toUpperCase() + suffix.slice(1)}`] =
      imageLink;

    imageObject[suffix] = imageLink;
    images.push(imageObject);

    deleteFiles.push(outputPath);
    deleteFiles.push(element.path);
  });
  await Promise.all(processingPromises);
  return {
    ...Object.fromEntries(
      fields.map((field) => [field, images.find((img) => img[field]) || null]),
    ),
    deleteFiles,
  };
};
