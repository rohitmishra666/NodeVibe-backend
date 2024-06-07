import { v2 as cloudinary } from "cloudinary";
import fs from "fs"
import { ApiError } from "../utils/ApiError.js";
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_SECRET_KEY
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        });
        // file has been uploaded
        fs.unlinkSync(localFilePath)
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath)
        //remove the locally saved temporary file as the upload operation got failed
        return null;
    }
}

const deleteOnCloudinary = async (filePath, text = "image") => {
    cloudinary.uploader
        .destroy(filePath,
            { type: 'upload', resource_type: text })
        .then((result) => {
            return result;
        })
        .catch((error) => {
            throw new ApiError(400, "Error deleting image from cloudinary");
        });

}
export { uploadOnCloudinary, deleteOnCloudinary }

