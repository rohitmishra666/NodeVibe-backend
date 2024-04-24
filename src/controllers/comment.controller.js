import mongoose from "mongoose"
import { Comment } from "../models/comment.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query

    try {
        const comments = await Comment.aggregatePaginate([
            {
                $match: {
                    video: mongoose.Types.ObjectId(videoId)
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "owner",
                    as: "commentOwner",
                }
            },
            {
                $lookup: {
                    from: "likes",
                    localField: "_id",
                    foreignField: "comment",
                    as: "likes"
                }
            },
            {
                $addFields: {
                    owner: {
                        $first: "commentOwner"
                    },
                    likesCount: {
                        $size: "$likes"
                    },
                    isLiked: {
                        $cond: {
                            if: { $in: [mongoose.Types.ObjectId(req.user?._id), "$likes.likedBy"] },
                            then: true,
                            else: false
                        }
                    }
                }
            },
            {
                project: {
                    content: 1,
                    owner: {
                        username: 1,
                        avatar: 1,
                        fullname: 1
                    },
                    likesCount: 1,
                    isLiked: 1
                }
            }
        ], { page, limit }, { sort: { createdAt: -1 } })

        if (!comments?.length()) {
            throw new ApiError(406, "No Comments on this Video!")
        }

        return res
            .status(200)
            .json(new ApiResponse(200, { comments }, "Comments Loaded Successfully!"))

    } catch (error) {
        throw new ApiError(405, "Problem in Loading Comments!")
    }
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const { videoId } = req.params
    const { content } = req.body
    const { user } = req.body

    const newComment = new Comment({
        content,
        video: videoId,
        owner: user._id
    })

    try {
        await newComment.save();
    } catch (error) {
        throw new ApiError(405, "Problem in Adding Comment!")
    }

    return res
        .status(201)
        .json(new ApiResponse(201, { newComment }, "Comment Added Successfully!"))

})


const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment

    const { content, commentId } = req.body

    try {
        const updatedComment = await Comment.findByIdAndUpdate(commentId, { content }, { new: true })

        return res
            .status(200)
            .json(new ApiResponse(200, { updatedComment }, "Comment Updated Successfully!"))

    } catch (error) {
        throw new ApiError(405, error?.message || "Problem in Updating Comment!")
    }
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const { commentId } = req.body

    try {
        const deletedComment = await Comment.findByIdAndDelete(commentId)

        if(!deletedComment){
            throw new ApiError(407, "Comment Not Found!")
        }

        return res
            .status(200)
            .json(new ApiResponse(200, "Comment Deleted Successfully!"))

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
