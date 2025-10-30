import { catchAsyncError } from "../../middlewares/catchAsyncError.js";
import ErrorHandler from "../../middlewares/errorMiddleware.js";
import { User } from "../../models/User.js";
import { Property } from "../../models/Property.js";
import { Host } from "../../models/HostSchema.js";

export const getAdminAllHosts = catchAsyncError(async (req, res, next) => {
  const adminId = req.admin?._id;

  // 1️⃣ Admin Authentication Check
  if (!req.admin || req.admin.role !== "admin") {
    return next(new ErrorHandler("Access denied! Admins only.", 403));
  }

  if (!adminId) {
    return next(new ErrorHandler("Admin authentication required!", 401));
  }

  // 2️⃣ Fetch Verified or Reverified Hosts
  const verifiedHosts = await Host.find({
    verificationStatus: { $in: ["verified", "reverified"] },
  })
    .populate("user", "name email phone avatar gender dob bio location createdAt")
    .sort({ appliedAt: -1 });

  if (!verifiedHosts || verifiedHosts.length === 0) {
    return res.status(200).json({
      success: true,
      message: "No verified or reverified hosts found.",
      hosts: [],
    });
  }

  // 3️⃣ Attach Properties for Each Host
  const enrichedHosts = await Promise.all(
  verifiedHosts.map(async (host) => {
    if (!host.user) {
      return {
        hostId: host._id,
        verificationStatus: host.verificationStatus,
        appliedAt: host.appliedAt,
        user: null,
        propertyCount: 0,
        properties: [],
      };
    }

    const properties = await Property.find({ userId: host.user._id }).select(
      "title location price image.url propertyPostedOn expired"
    );

    return {
      hostId: host._id,
      verificationStatus: host.verificationStatus,
      appliedAt: host.appliedAt,
      user: {
        _id: host.user._id,
        name: host.user.name,
        email: host.user.email,
        phone: host.user.phone,
        avatar: host.user.avatar,
        gender: host.user.gender,
        dob: host.user.dob,
        bio: host.user.bio,
        location: host.user.location,
        createdAt: host.user.createdAt,
      },
      propertyCount: properties.length,
      properties,
    };
  })
);

  // 4️⃣ Final Response
  res.status(200).json({
    success: true,
    message: "Verified and reverified hosts fetched successfully.",
    totalVerified: verifiedHosts.length,
    hosts: enrichedHosts,
  });
});


export const getAdminAllActiveHosts = catchAsyncError(async (req, res, next) => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

    const activeHosts = await User.find({
        role: { $in: ["host", "Host"] },
        lastActiveAt: { $gte: sevenDaysAgo }
    }).select("-password").lean();

    const enrichedHosts = await Promise.all(
        activeHosts.map(async (host) => {
            const properties = await Property.find({ userId: host._id })
                .select("title location price image.url propertyPostedOn expired");

            return {
                _id: host._id,
                name: host.name,
                email: host.email,
                phone: host.phone,
                isBanned: host.isBanned,
                lastLogin: host.lastLogin,
                lastActiveAt: host.lastActiveAt,
                createdAt: host.createdAt,
                propertyCount: properties.length,
                properties,
            };
        })
    );

    res.status(200).json({
        success: true,
        count: enrichedHosts.length,
        hosts: enrichedHosts,
        message: `${enrichedHosts.length} hosts active in last 7 days.`
    });
});


export const getAdminAllOnlineHosts = catchAsyncError(async (req, res, next) => {
    // Define 15 minutes ago timestamp
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    // Fetch all online hosts
    const onlineHosts = await User.find({
        role: { $in: ["host", "Host"] },
        lastActiveAt: { $gte: fifteenMinutesAgo },
        isBanned: false // Optional: only include non-banned hosts
    }).select("-password").lean();

    // Enrich with property details
    const enrichedHosts = await Promise.all(
        onlineHosts.map(async (host) => {
            const properties = await Property.find({ userId: host._id })
                .select("title location price image.url propertyPostedOn expired");

            return {
                _id: host._id,
                name: host.name,
                email: host.email,
                phone: host.phone,
                isBanned: host.isBanned,
                lastLogin: host.lastLogin,
                lastActiveAt: host.lastActiveAt,
                createdAt: host.createdAt,
                propertyCount: properties.length,
                properties,
            };
        })
    );

    res.status(200).json({
        success: true,
        count: enrichedHosts.length,
        hosts: enrichedHosts,
        message: `${enrichedHosts.length} host(s) online in the last 15 minutes.`
    });
});


export const getAdminNewRegisterHosts = catchAsyncError(async (req, res, next) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0); // 👈 Set to 12:00 AM today

  const newHosts = await User.find({
    role: { $in: ["host", "Host"] },
    createdAt: { $gte: startOfDay },
  }).select("-password").lean();

  const enrichedHosts = await Promise.all(
    newHosts.map(async (host) => {
      const properties = await Property.find({ userId: host._id })
        .select("title location price image.url propertyPostedOn expired");

      return {
        _id: host._id,
        name: host.name,
        email: host.email,
        phone: host.phone,
        isBanned: host.isBanned,
        lastLogin: host.lastLogin,
        lastActiveAt: host.lastActiveAt,
        createdAt: host.createdAt,
        propertyCount: properties.length,
        properties,
      };
    })
  );

  res.status(200).json({
    success: true,
    count: enrichedHosts.length,
    hosts: enrichedHosts,
    message: `${enrichedHosts.length} new host(s) registered today.`,
  });
});

export const getAdminLogoutHosts = catchAsyncError(async (req, res, next) => {
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

  const logoutHosts = await User.find({
    role: { $in: ["host", "Host"] },
    lastActiveAt: { $lt: fifteenMinutesAgo },
    isBanned: false // Optional: Exclude banned users
  }).select("-password").lean();

  const enrichedHosts = await Promise.all(
    logoutHosts.map(async (host) => {
      const properties = await Property.find({ userId: host._id })
        .select("title location price image.url propertyPostedOn expired");

      return {
        _id: host._id,
        name: host.name,
        email: host.email,
        phone: host.phone,
        isBanned: host.isBanned,
        lastLogin: host.lastLogin,
        lastActiveAt: host.lastActiveAt,
        createdAt: host.createdAt,
        propertyCount: properties.length,
        properties,
      };
    })
  );

  res.status(200).json({
    success: true,
    count: enrichedHosts.length,
    hosts: enrichedHosts,
    message: `${enrichedHosts.length} host(s) are currently logged out (inactive >15 min).`,
  });
});

export const getAdminBannedHosts = catchAsyncError(async (req, res, next) => {
  const bannedHosts = await User.find({
    role: { $in: ["host", "Host"] },
    isBanned: true
  }).select("-password").lean();

  const enrichedHosts = await Promise.all(
    bannedHosts.map(async (host) => {
      const properties = await Property.find({ userId: host._id })
        .select("title location price image.url propertyPostedOn expired");

      return {
        _id: host._id,
        name: host.name,
        email: host.email,
        phone: host.phone,
        isBanned: host.isBanned,
        lastLogin: host.lastLogin,
        lastActiveAt: host.lastActiveAt,
        createdAt: host.createdAt,
        propertyCount: properties.length,
        properties,
      };
    })
  );

  res.status(200).json({
    success: true,
    count: enrichedHosts.length,
    hosts: enrichedHosts,
    message: `${enrichedHosts.length} banned host(s) found.`,
  });
});




