module.exports = fn => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);


// src/utils/asyncHandler.js

// const asyncHandler = (fn) => {
//     return (req, res, next) => {
//         Promise.resolve(fn(req, res, next)).catch(next);
//     };
// };

// module.exports = asyncHandler;