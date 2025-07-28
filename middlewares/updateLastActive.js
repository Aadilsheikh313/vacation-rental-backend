// middleware/updateLastActive.js
export const updateLastActive = async (req, res, next) => {
    if (req.user) {
        await User.findByIdAndUpdate(req.user._id, {
            lastActiveAt: new Date()
        });
    }
    next();
};
