import jwt from "jsonwebtoken"
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

export const optionalAuth = asyncHandler(async (req, res, next) => {
    try {
        // Retrieve token from cookies or Authorization header
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

        if (token===undefined || !token || token === "null") {
            // If no token is found, set req.user to null and proceed to next middleware
            req.user = null;
            return next();
        }
        // If a token is present, verify it and proceed with the verifyJWT middleware
        verifyJWT(req, res, next);
    } catch (error) {
        // Handle errors and pass them to the next error handling middleware
        next(new ApiError(401, error?.message || "optionalAuth error"));
    }
});

export const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        const headerToken = req.header("Authorization")?.replace("Bearer ", "")

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