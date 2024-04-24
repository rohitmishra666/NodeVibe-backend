import mongoose, { isValidObjectId } from "mongoose"
import { Tweet } from "../models/tweet.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const { content } = req.body
    if (!content) {
        return (new ApiError(410, 'Content is required!'))
    }

    const tweet = await Tweet.create({
        content: content,
        owner: req.user?._id
    });

    if (!tweet) {
        return (new ApiError(500, 'Error creating tweet!'))
    }

    return res
        .status(201)
        .json(new ApiResponse(201, 'Tweet created successfully', { tweet }))
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const { userId } = req.user?._id

    try {
        const userTweets = await Tweet.aggregate([
            {
                $match: {
                    owner: mongoose.Types.ObjectId(userId)
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "ownerDetails"
                }
            },
            {
                $project: {
                    content: 1,
                    owner: {
                        username: 1,
                        avatar: 1,
                        fullname: 1
                    }
                }
            }
        ], { sort: { createdAt: -1 } })

        if (!userTweets) {
            return (new ApiError(404, 'No tweets found!'))
        }

        return res
            .status(200)
            .json(new ApiResponse(200, 'User tweets fetched successfully', { userTweets }))
    } catch (error) {
        return (new ApiError(500, 'Error fetching user tweets!'))
    }
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    try {
        const { tweetId, content } = req.body

        const updatedTweet = await Tweet.findByIdAndUpdate(tweetId, { content: content }, { new: true })

        if (!updatedTweet) {
            return (new ApiError(413, 'Error updating tweet!'))
        }

        return res
            .status(200)
            .json(new ApiResponse(200, 'Tweet updated successfully', { updatedTweet }))

    } catch (error) {
        throw new ApiError(412, 'Error updating tweet!')
    }
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const { tweetId } = req.body

    const deletedTweet = await Tweet.findByIdAndDelete(tweetId)

    if (!deletedTweet) {
        throw new ApiError(414, 'Error deleting tweet!')
    }

    return res
        .status(200)
        .json(new ApiResponse(200, 'Tweet deleted successfully', {}))

})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
