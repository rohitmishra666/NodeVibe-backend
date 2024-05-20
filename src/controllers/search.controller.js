import { Video } from "../models/video.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const searchController = asyncHandler(async (req, res) => {
    const { query="z", limit = 10, sortBy = "createdAt", sortType = -1 } = req.body;
    
    const options = {
        limit: parseInt(limit, 10),
        sort: { [sortBy]: sortType }
    }

    const searchResult = await Video.aggregate(
        [
            {
                $search:
                {
                    index: "autocomplete",
                    autocomplete:
                    {
                        query: query,
                        path: "title",
                        fuzzy: {
                            maxEdits: 1,
                            prefixLength: 1,
                            maxExpansions: 1
                        }
                    }
                }
            },
            {
                $project: {
                    title: 1,
                    // videoFile: 1,
                    thumbnail: 1,
                    // duration: 1,
                    // owner: 1,
                    // isPublished: 1
                }
            }
        ], options)

    if (!searchResult) {
        throw new ApiError(400, "unable to fetch data");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, { searchResult }, " search results found"))
})

export { searchController }