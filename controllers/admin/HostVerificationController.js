import { catchAsyncError } from "../../middlewares/catchAsyncError.js";
import ErrorHandler from "../../middlewares/errorMiddleware.js";
import { Host } from "../../models/HostSchema.js";
import { User } from "../../models/User.js";
import { Admin } from "../../models/admin.js";


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



//========================Get all Verifed Host ======================
export const GetAllVerifedHost = catchAsyncError(async (req, res, next) => {
  const adminId = req.admin?._id;

  if (!req.admin || req.admin.role !== "admin") {
    return next(new ErrorHandler("Access denied! Admins only.", 403));
  }

  if (!adminId) {
    return next(new ErrorHandler("Admin authentication required!", 401));
  }

  const verifedHosts = await Host.find({
    verificationStatus: { $in: ["verified", "reverified"] },
  })
    .populate("user", "name email phone avatar gender dob bio location createdAt")
    .sort({ appliedAt: -1 });

  if (!verifedHosts || verifedHosts.length === 0) {
    return res.status(200).json({
      success: true,
      message: "No verified or reverified hosts found.",
      hosts: [],
    });
  }

  res.status(200).json({
    success: true,
    message: "Verified and reverified hosts fetched successfully.",
    totalVerified: verifedHosts.length,
    hosts: verifedHosts,
  });
});


export const GetAllRejectHost = catchAsyncError(async (req, res, next) => {
    const adminId = req.admin?._id;

    if (!req.admin || req.admin.role !== "admin") {
        return next(new ErrorHandler("Access denied! Admins only.", 403));
    }

    if (!adminId) {
        return next(new ErrorHandler("Admin authentication required!", 401));
    }

    const rejectHosts = await Host.find({ verificationStatus: "rejected" })
        .populate('user', 'name email phone avatar gender dob bio location createdAt')
        .sort({ appliedAt: -1 });

    if (!rejectHosts || rejectHosts.length === 0) {
        return res.status(200).json({
            success: true,
            message: "No rejected hosts found.",
            hosts: [],
        });
    }

    res.status(200).json({
        success: true,
        message: "Rejected hosts fetched successfully.",
        totalRejected: rejectHosts.length,
        hosts: rejectHosts,
    });
});

// ================= Verfaction Host Controller function =================

export const verifyOrRejectHost = catchAsyncError(async (req, res, next) => {
    const { hostId } = req.params;
    const { action, note } = req.body; // action = "verify" | "reject"

    // 🔐 Check if user is admin
    if (!req.admin || req.admin.role !== "admin") {
        return next(new ErrorHandler("Access denied! Admins only.", 403));
    }

    const adminId = req.admin?._id;

    if (!adminId) {
        return next(new ErrorHandler("Admin authentication required!", 401));
    }

    // 🧭 Find Admin Details
    const admin = await Admin.findById(adminId).select("name email phone");
    if (!admin) {
        return next(new ErrorHandler("Admin not found!", 404));
    }

    // 🧭 Find Host & linked User details
    const host = await Host.findById(hostId).populate("user", "name email phone avatar gender createdAt");
    if (!host) {
        return next(new ErrorHandler("Host not found!", 404));
    }

    // 🚫 Prevent redundant actions
    if (host.verificationStatus === "verified" && action === "verify") {
        return next(new ErrorHandler("Host is already verified!", 400));
    }

    if (host.verificationStatus === "rejected" && action === "reject") {
        return next(new ErrorHandler("Host is already rejected!", 400));
    }

    // ✅ Perform Verification or Rejection
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

    // 🧾 Add to Audit Log
    host.audit.push({
        action: action === "verify" ? "verified" : "rejected",
        performedBy: adminId,
        performedByModel: "Admin",
        note: note || (action === "verify" ? "Host verified" : "Host rejected"),
        adminDetails: {
            name: admin.name,
            email: admin.email,
            phone: admin.phone,
        },
        date: Date.now(),
    });

    host.lastUpdatedAt = Date.now();
    await host.save();

    // 🧹 Prepare clean response
    const sanitizedHost = {
        _id: host._id,
        verificationStatus: host.verificationStatus,
        verifiedAt: host.verifiedAt,
        rejectedAt: host.rejectedAt,
        adminNote: host.adminNote,
        user: {
            name: host.user.name,
            email: host.user.email,
            phone: host.user.phone,
        },
        verifiedOrRejectedBy: {
            name: admin.name,
            email: admin.email,
            phone: admin.phone,
        },
    };

    // 📩 Optional email notification
    // if (action === "verify") {
    //     await sendEmail(host.user.email, "Host Verified!", "Congrats! Your host account is verified.");
    // }

    res.status(200).json({
        success: true,
        message: `Host ${action === "verify" ? "verified" : "rejected"} successfully!`,
        host: sanitizedHost,
    });
});


export const ReVerification = catchAsyncError(async (req, res, next) => {
    const { hostId } = req.params;
    const {action, note } = req.body;
  
    // 1️⃣ Check admin authentication
    if (!req.admin || req.admin.role !== "admin") {
        return next(new ErrorHandler("Access denied! Admins only.", 403));
    }

    const adminId = req.admin?._id;
    console.log("AdminID", adminId);
    
    if (!adminId) {
        return next(new ErrorHandler("Admin authentication required!", 401));
    }

    // 2️⃣ Find host
    const host = await Host.findById(hostId).populate("user", "name email phone avatar");
    if (!host) {
        return next(new ErrorHandler("Host not found!", 404));
    }

    // 3️⃣ Check if host was previously rejected
    if (host.verificationStatus !== "rejected") {
        return next(new ErrorHandler("This host is not rejected, so it cannot be reverified.", 400));
    }

    // 4️⃣ Find who rejected it from audit log
    const rejectedAudit = host.audit.find(a => a.action === "rejected");
    if (!rejectedAudit) {
        return next(new ErrorHandler("Rejection record not found in audit log.", 400));
    }

    const rejectedByAdminId = rejectedAudit.performedBy.toString();

    // 5️⃣ Ensure same admin re-verifies
    if (rejectedByAdminId !== adminId.toString()) {
        return next(new ErrorHandler("Access denied! Only the admin who rejected can reverify this host.", 403));
    }

    // 6️⃣ Update verification status
    host.verificationStatus = "reverified";
    host.verifiedAt = Date.now();
    host.rejectedAt = null;
    host.rejectedReason = null;

    // 7️⃣ Add new audit log entry for re-verification
    host.audit.push({
        action: "reverified",
        performedBy: adminId,
        performedByModel: "Admin",
        note: note || "Host reverified by same admin after review.",
        adminDetails: {
            name: req.admin.name,
            email: req.admin.email,
            phone: req.admin.phone
        },
        date: Date.now(),
    });

    await host.save();

    // 8️⃣ Return response with previous rejection info
    res.status(200).json({
        success: true,
        message: "Host reverified successfully by the same admin.",
        host,
        previousRejection: {
            rejectedBy: rejectedAudit.adminDetails,
            rejectedDate: rejectedAudit.date,
            rejectedNote: rejectedAudit.note,
        }
    });
});


// ============================== Get User Profile (for Admin) ==============================
export const GetUserProfile = catchAsyncError(async (req, res, next) => {
  const { userId } = req.params;

  // 🔐 1️⃣ Check if Admin is authenticated
  if (!req.admin || req.admin.role !== "admin") {
    return next(new ErrorHandler("Access denied! Admins only.", 403));
  }

  const adminId = req.admin?._id;
  if (!adminId) {
    return next(new ErrorHandler("Admin authentication required!", 401));
  }

  // 🧭 2️⃣ Find user basic details
  const user = await User.findById(userId).select(
    "name email phone role avatar bio dob gender location isBanned banReason bannedAt unbannedAt createdAt updatedAt"
  );

  if (!user) {
    return next(new ErrorHandler("User not found!", 404));
  }

  // 🏠 3️⃣ If user is a host, include Host details
  if (user.role === "host") {
    const host = await Host.findOne({ user: userId }).select(
      "verificationStatus verifiedAt rejectedAt rejectedReason adminNote governmentID governmentIDNumber cancelledChequeImage governmentIDImage payout earnings rating"
    );

    // ✅ Response for Host
    return res.status(200).json({
      success: true,
      message: "Host profile fetched successfully.",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
        dob: user.dob,
        gender: user.gender,
        location: user.location,
        isBanned: user.isBanned,
        banReason: user.banReason,
        bannedAt: user.bannedAt,
        unbannedAt: user.unbannedAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      hostDetails: host || null, // HostSchema ka data (if found)
    });
  }

  // 👤 4️⃣ If user is a guest
  res.status(200).json({
    success: true,
    message: "Guest profile fetched successfully.",
    user,
  });
});
