import { Router } from 'express';
import {
    addComment,
    deleteComment,
    getVideoComments,
    updateComment,
} from "../controllers/comment.controller.js"
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { healthcheck } from "../controllers/healthcheck.controller.js"

const router = Router();

router.route('/').get(healthcheck);


router
    .route("/:videoId")
    .get(getVideoComments)
    .post(verifyJWT, addComment);
router
    .route("/c/:commentId")
    .delete(verifyJWT, deleteComment)
    .patch(verifyJWT, updateComment);

export default router