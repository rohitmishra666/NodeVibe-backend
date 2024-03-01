import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { User } from "../models/user.model";

export const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        const token = req.cookie?.accessToken || req.header("Authorization")?.replace("Bearer", "")

        if (!token) {
            new ApiError(401, "Unauthorised request")
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id.select("-password -refreshToken"))

        if (!user) {
            //TODO: discuss about frontend
            throw new ApiError(401, "Invalid Access token")
        }

        req.user = user;
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token")
    }

})