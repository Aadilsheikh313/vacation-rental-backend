import { catchAsyncError } from "../../middlewares/catchAsyncError.js";
import ErrorHandler from "../../middlewares/errorMiddleware.js";
import { Host } from "../../models/HostSchema.js";


//==================== Get All pending  Hosts Controller function =================
export const getAllPendingHosts = catchAsyncError(async (req, res, next) => {
    // 1️⃣ Check if admin is authenticated
    const adminId = req.admin?._id; // Assuming req.user contains the authenticated admin's details

    if (!req.admin || req.admin.role !== "admin") {
        return next(new ErrorHandler("Access denied! Admins only.", 403));
    }

    if (!adminId) {
        return next(new ErrorHandler("Admin authentication required!", 401));
    }
    // 2️⃣ Find all hosts whose verificationStatus is "pending"
    const pendingHosts = await Host.find({ verificationStatus: "pending" })
        .populate('user', 'name email phone avatar gender dob bio location createdAt')
        .sort({ appliedAt: -1 }); // latest applied first

    // 3️⃣ if no pending hosts found
    if (!pendingHosts || pendingHosts.length === 0) {
        return res.status(200).json({
            success: true,
            message: "No pending hosts found.",
            totalPending: 0,
            hosts: [],
        });
    }

    // 4️⃣ Send pending hosts list
    res.status(200).json({
        success: true,
        message: "Pending hosts fetched successfully.",
        totalPending: pendingHosts.length,
        hosts: pendingHosts,
    });


});

// ================= Verfaction Host Controller function =================
export const verifyOrRejectHost = catchAsyncError(async (req, res, next) => {
    const { hostId } = req.params;
    const { action, note } = req.body; // action should be either "verify" or "reject"

    if (!req.admin || req.admin.role !== "admin") {
        return next(new ErrorHandler("Access denied! Admins only.", 403));
    }

    const adminId = req.admin?._id; // Assuming req.user contains the authenticated admin's details

    if (!adminId) {
        return next(new ErrorHandler("Admin authentication required!", 401));
    }

    const host = await Host.findById(hostId).populate('user', 'name email phone avatar gender createdAt ')
    .sort({ appliedAt: -1 }); // latest applied first

    // ❌ Host existence check
    if (!host) {
        return next(new ErrorHandler("Host not found!", 404));
    }

    // 🚫 Already verified/rejected check
    if (host.verificationStatus === "verified" && action === "verify") {
        return next(new ErrorHandler("Host is already verified!", 400));
    }

    if (host.verificationStatus === "rejected" && action === "reject") {
        return next(new ErrorHandler("Host is already rejected!", 400));
    }

    // ✅ Perform action
    if (action === "verify") {
        host.verificationStatus = "verified";
        host.verifiedAt = Date.now();
        host.rejectedAt = null;
        host.rejectedReason = null;
        host.adminNote = note || "Host verified successfully.";
    } else if (action === "reject") {
        host.verificationStatus = "rejected";
        host.rejectedAt = Date.now();
        host.verifiedAt = null;
        host.rejectedReason = note || "Host rejected by admin.";
        host.adminNote = note || null;
    } else {
        return next(new ErrorHandler("Invalid action. Use 'verify' or 'reject'.", 400));
    }
    // 🧾 Add to audit log
    host.audit.push({
        action: action === "verify" ? "verified" : "rejected",
        performedBy: adminId,
        performedByModel: "Admin",
        note: note || (action === "verify" ? "Host verified" : "Host rejected"),
        date: Date.now(),
    });

    host.lastUpdatedAt = Date.now();
    await host.save();

    const sanitizedHost = {
        _id: host._id,
        verificationStatus: host.verificationStatus,
        verifiedAt: host.verifiedAt,
        rejectedAt: host.rejectedAt,
        adminNote: host.adminNote,
        user: {
            name: host.user.name,
            email: host.user.email,
        }
    };
    // if (action === "verify") {
    //     await sendEmail(host.user.email, "Host Verified!", "Congrats, your host account is verified!");
    // }

    res.status(200).json({
        success: true,
        message: `Host ${action === "verify" ? "verified" : "rejected"} successfully!`,
        host: sanitizedHost,
    });
});