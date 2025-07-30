import { catchAsyncError } from "../../middlewares/catchAsyncError.js";
import { User } from "../../models/User.js";
import {Property} from "../../models/Property.js"

export const getTotalHosts = catchAsyncError(async(req, res, next) =>{
    const totalHosts = await User.countDocuments({
        role: {$in :["host", "Host"]}
    });

     res.status(200).json({
        success: true,
        totalHosts,
        message: `Total  Hosts: ${totalHosts}`
    });
});


export const getAdminAllHosts = catchAsyncError(async (req, res, next) => {
  // 1️⃣ Get all users with role "host"
  const hosts = await User.find({ role: { $in: ["host", "Host"] } }).select("-password");

  // 2️⃣ Attach properties to each host
  const enrichedHosts = await Promise.all(
    hosts.map(async (host) => {
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

