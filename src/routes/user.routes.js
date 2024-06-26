import { Router } from 'express'
import {
    loginUser,
    registerUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
} from '../controllers/user.controller.js';
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
)

router.route("/login").post(loginUser)

//secured routes
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/current-user").get(verifyJWT, getCurrentUser)
router.route("/update-account").patch(verifyJWT, updateAccountDetails)

// AVATAR, COVER_IMAGE
router
    .route("/avatar")
    .patch(upload.fields([
        {
            name: "avatar",
            maxCount: 1,
        }
    ]),
        verifyJWT,
        updateUserAvatar
    );

router
    .route("/cover-image")
    .patch(upload.fields([
        {
            name: "coverImage",
            maxCount: 1,
        }
    ]),
        verifyJWT,
        updateUserCoverImage
    );

router.route("/c/:username").get(getUserChannelProfile)

router.route("/history").get(verifyJWT, getWatchHistory)

export default router
