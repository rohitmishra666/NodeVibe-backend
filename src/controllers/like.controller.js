import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: toggle like on video
    if (!isValidObjectId(videoId)) {
        return (new ApiError(400, 'Invalid video id!'))
    }
    const likedAlready = await Like.findOne({ video: videoId, likedBy: req.user?._id })

    if (likedAlready) {
        await Like.findByIdAndDelete(likedAlready._id)
        return res
            .status(200)
            .json(new ApiResponse(200, 'Video unliked successfully', { liked: false }))
    }

    const newLike = Like.create({
        video: videoId,
        likedBy: req.user?._id
    })

    return res
        .status(200)
        .json(new ApiResponse(200, 'Video liked successfully', { liked: true }))

})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    //TODO: toggle like on comment

    if (!isValidObjectId(commentId)) {
        return (new ApiError(400, 'Invalid comment id!'))
    }

    //check if user has liked comment already
    const likedAlready = await Like.findOne({ comment: commentId, likedBy: req.user?._id })

    if (likedAlready) {
        await Like.findByIdAndDelete(likedAlready._id)
        return res
            .status(200)
            .json(new ApiResponse(200, 'Comment unliked successfully', { liked: false }))
    }

    const newLike = Like.create({
        comment: commentId,
        likedBy: req.user?._id
    })

    return res
        .status(200)
        .json(new ApiResponse(200, 'Comment liked successfully', { liked: true }))

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    //TODO: toggle like on tweet

    if (!isValidObjectId(tweetId)) {
        return (new ApiError(400, 'Invalid tweet id!'))
    }

    //check if user has liked tweet already
    const likedAlready = await Like.findOne({ tweet: tweetId, likedBy: req.user?._id })

    if (likedAlready) {
        await Like.findByIdAndDelete(likedAlready._id)
        return res
            .status(200)
            .json(new ApiResponse(200, 'Tweet unliked successfully', { liked: false }))
    }

    const newLike = Like.create({
        tweet: tweetId,
        likedBy: req.user?._id
    })

    return res
        .status(200)
        .json(new ApiResponse(200, 'Tweet liked successfully', { liked: true }))

}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    try {
        const likedVideos = await Like.aggregate([
            {
                match: {
                    likedBy: req.user?._id,
                    video: { $exists: true }
                }
            },
            {
                $lookup: {
                    from: "videos",
                    localField: "video",
                    foreignField: "_id",
                    as: "likedVideos"
                },
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "ownerDetails"
                        },
                    },
                    {
                        $unwind: "$ownerDetails"
                    }
                ]
            },
            {
                $unwind: "$likedVideos"
            },
            {
                $project: {
                    title: 1,
                    duration: 1,
                    viewCount: 1,
                    thumbnail: 1,
                    owner: {
                        username: 1,
                        avatar: 1,
                        fullName: 1
                    }
                }
            }

        ], { sort: { createdAt: -1 } })

        if (!likedVideos?.length) {
            throw new ApiError(404, "No liked videos found!")
        }
        return res
            .status(200)
            .json(new ApiResponse(200, likedVideos, "Liked videos fetched successfully!"))

    } catch (error) {
        throw new ApiError(404, error?.message || "Problem in fetching liked videos!")
    }
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}