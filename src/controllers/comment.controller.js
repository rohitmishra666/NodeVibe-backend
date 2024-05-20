import mongoose from "mongoose"
import { Comment } from "../models/comment.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video

    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query
    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    }

    try {
        const comments = await Comment.aggregate([
            {
                $match: {
                    video: mongoose.Types.ObjectId.createFromHexString(videoId)
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "result",
                    pipeline: [
                        {
                            $project: {
                                username: 1,
                                fullName: 1,
                                avatar: 1
                            }
                        }
                    ]
                }
            },
            {
                $addFields: {
                    commentOwner: {
                        $first: "$result"
                    }
                }
            },
            {
                $sort: {
                    createdAt: -1
                }
            }
        ], options)

        if (!comments) {
            throw new ApiError(404, "No Comments Found!", {})
        }

        return res
            .status(200)
            .json(new ApiResponse(200, "ALL OK!", { comments }))
            
    } catch (error) {
        throw new ApiError(404, error?.message || "Error in fetching comments!")
    }

})

const addComment = asyncHandler(async (req, res) => {

    // TODO: add a comment to a video
    const { videoId } = req.params
    const { content } = req.body
    const user = req.user

    if (!user) {
        throw new ApiError(401, "User Not Found!")
    }

    const newComment = await Comment.create({
        content: content,
        video: videoId,
        owner: user?._id
    })

    if (!newComment) {
        throw new ApiError(406, "Error in Adding Comment!")
    }

    return res
        .status(201)
        .json(new ApiResponse(201, { newComment }, "Comment Added Successfully!"))

})


const updateComment = asyncHandler(async (req, res) => {

    // TODO: update a comment
    const { content, commentId } = req.body

        const updatedComment = await Comment.findByIdAndUpdate(commentId, { content }, { new: true })
        
        if(!updatedComment) {
            throw new ApiError(404, "Comment Not Found!")
        }

        return res
            .status(200)
            .json(new ApiResponse(200, { updatedComment }, "Comment Updated Successfully!")) 
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const { commentId } = req.body

    try {

        const comment = await Comment.findById(commentId)

        if (req.user?._id.toString() !== comment.owner.toString()) {
            throw new ApiError(404, "You are not authorised to delete this comment!")
        }


        const deletedComment = await Comment.findByIdAndDelete(commentId);

        if (!deletedComment) {
            return res
                .status(200)
                .json(new ApiResponse(200, "Comment Deleted Successfully!"))
        }

    } catch (error) {
        throw new ApiError(408, error?.message || "Error in Deleting Comment!")
    }
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}
