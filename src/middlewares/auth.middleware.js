import jwt from "jsonwebtoken"
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

export const optionalAuth = asyncHandler(async (req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer", "")
        console.log(req.cookies?.accessToken, "req.cookies?.accessToken")
        console.log(token ? "Token found" : "Token not found")

        if (!token) {
            req.user = null;
            return next();
        }
        verifyJWT(req, _, next)

    } catch (error) {
        throw new ApiError(401, error?.message || "optionalAuth error")
    }
})

export const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer", "")
        // console.log(req.cookies?.accessToken, "req.cookies?.accessToken")
        console.log(token ? "Token found" : "Token not found")

        if (!token) {
            throw new ApiError(401, "Unauthorised request")
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")

        if (!user) {
            throw new ApiError(401, "Invalid Access token")
        }

        req.user = user;
        next();

    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token")
    }

})