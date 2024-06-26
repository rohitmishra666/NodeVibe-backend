import mongoose from "mongoose"
import { Video } from "../models/video.model.js"
import { Subscription } from "../models/subscription.model.js"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.

    const userId = req.user?._id

    const totalSubcribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $count: 'totalSubcribers'
        }
    ])

    const totalVideos = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $project: {
                thumbnail: 1,
                title: 1,
                views: 1,
                description: 1,
                createdAt: 1,
                duration: 1,
                isPublished: 1
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        }
    ])

    const totalViews = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $group: {
                _id: null,
                totalViews: {
                    $sum: '$views'
                }
            }
        }
    ])

    const stats = {
        totalSubcribers: totalSubcribers[0]?.totalSubcribers || 0,
        totalVideos: totalVideos.length,
        totalViews: totalViews[0]?.totalViews || 0
    }

    return res
        .status(200)
        .json(new ApiResponse(200, { stats }, 'Channel stats'))
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel

    const userId = req.user?._id

    const videos = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: 'likes',
                localField: '_id',
                foreignField: 'video',
                as: 'likesCount'
            }
        },
        {
            $addFields: {
                likes: {
                    $size: '$likesCount'
                }
            }
        },
        {
            $project: {
                likes: 1,
                thumbnail: 1,
                title: 1,
                views: 1,
                createdAt: 1,
                duration: 1,
                isPublished: 1,
                description: 1
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        }
    ])

    if (!videos) {
        throw new ApiError(404, 'Problem fetching videos!!')
    }

    return res
        .status(200)
        .json(new ApiResponse(200, { videos }, 'Channel videos'))
})

export {
    getChannelStats,
    getChannelVideos
}