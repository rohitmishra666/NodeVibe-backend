import { Router } from 'express';
import {
    addComment,
    deleteComment,
    getVideoComments,
    updateComment,
} from "../controllers/comment.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { healthcheck } from "../controllers/healthcheck.controller.js"

const router = Router();

// router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route('/').get(healthcheck);


router
    .route("/:videoId")
    .get(getVideoComments)
    .post(verifyJWT,addComment);
router
    .route("/c/:commentId")
    .delete(deleteComment)
    .patch(updateComment);

export default router