import { Router } from 'express';
import {
    deleteVideo,
    getAllVideos,
    getVideoById,
    publishAVideo,
    togglePublishStatus,
    updateVideo,
    searchVideos
} from "../controllers/video.controller.js"
import { optionalAuth, verifyJWT } from "../middlewares/auth.middleware.js"
import { upload } from "../middlewares/multer.middleware.js"

const router = Router();

router
    .route("/")
    .get(getAllVideos)
    .post(searchVideos)

router.route("/publish").post(
    upload.fields([
        {
            name: "videoFile",
            maxCount: 1,
        },
        {
            name: "thumbnail",
            maxCount: 1,
        },

    ]),
    verifyJWT,
    publishAVideo
);

router
    .route("/:videoId")
    .get(optionalAuth, getVideoById)
    .delete(verifyJWT, deleteVideo)
    .patch(
        upload.fields([
            {
                name: "thumbnail",
                maxCount: 1,
            }
        ]),
        verifyJWT, 
        updateVideo
    );

router.route("/toggle/publish/:videoId").patch(verifyJWT, togglePublishStatus);

export default router