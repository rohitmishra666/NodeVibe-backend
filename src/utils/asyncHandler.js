const asyncHandler = (requestHandler) => {
    (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
    };
};

export { asyncHandler };

/* THIS IS FOR ASYNC AWAIT SYNTAX */

// const asyncHandler=  () =>{}
// const asyncHandler = (func) => {()=>{}}
// const asyncHandler = (func) => async()=>{}

// const asyncHandler = (fn) => (req, res, next) => {
//     try {

//     } catch (error) {
//         res.status(err.code || 500).json({
//             success: false,
//             message: err.message
//         })
//     }
// }
