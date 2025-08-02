import { catchAsyncError } from "../../middlewares/catchAsyncError.js";
import { User } from "../../models/User.js";
import { Booking } from "../../models/Booking.js";


export const getTotalGuestRegister = catchAsyncError(async (req, res, next) => {
  const totalGuests = await User.countDocuments({
    role: { $in: ["guest", "Guest"] }
  });

  res.status(200).json({
    success: true,
    totalGuest: totalGuests,
    message: `Total Guest: ${totalGuests}`
  });
});

export const getAdminAllGuests = catchAsyncError(async (req, res, next) => {
  // 1️⃣ Get all users with role "guest"
  const guests = await User.find({ role: { $in: ["guest", "Guest"] } }).select("-password");

  // 2️⃣ Attach properties to each guest booking
  const enrichedGuests = await Promise.all(
    guests.map(async (guest) => {
      const bookings = await Booking.find({ user: guest._id })
        .populate("property", "title location price image.url")

      return {
        _id: guest._id,
        name: guest.name,
        email: guest.email,
        phone: guest.phone,
         createdAt: guest.createdAt, // ⬅️ add this
  isBanned: guest.isBanned,
        totalBookings: bookings.length,
        bookings: bookings.map(b => ({
          propertyTitle: b.property?.title || "Property not found",
          location: b.property?.location || "-",
          price: b.property.price || "-",
          image: b.property.image.url || "-",
          checkIn: b.checkIn || "-",
          checkOut: b.checkOut || "-",
          status: b.bookingStatus || "-",
        }))
      };
    })
  );

  res.status(200).json({
    success: true,
    guests: enrichedGuests,
    message: `Fetched guest booking history.`,
  });
});

// export const getAdminAllActiveGuests = catchAsyncError(async (req, res, next) => {
//     const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

//     const activeGuests = await User.find({
//         role: { $in: ["guest", "Guest"] },
//         lastActiveAt: { $gte: sevenDaysAgo }
//     }).select("-password").lean();

//     const enrichedGuests = await Promise.all(
//         activeGuests.map(async (guest) => {
//             const properties = await Property.find({ userId: guest._id })
//                 .select("title location price image.url propertyPostedOn expired");

//             return {
//                 _id: guest._id,
//                 name: guest.name,
//                 email: guest.email,
//                 phone: guest.phone,
//                 isBanned: guest.isBanned,
//                 lastLogin: guest.lastLogin,
//                 lastActiveAt: guest.lastActiveAt,
//                 createdAt: guest.createdAt,
//                 propertyCount: properties.length,
//                 properties,
//             };
//         })
//     );

//     res.status(200).json({
//         success: true,
//         count: enrichedGuests.length,
//         guests: enrichedGuests,
//         message: `${enrichedGuests.length} guests active in last 7 days.`
//     });
// });


// export const getAdminAllOnlineGuests = catchAsyncError(async (req, res, next) => {
//     // Define 15 minutes ago timestamp
//     const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

//     // Fetch all online guests
//     const onlineGuests = await User.find({
//         role: { $in: ["guest", "Guest"] },
//         lastActiveAt: { $gte: fifteenMinutesAgo },
//         isBanned: false // Optional: only include non-banned guests
//     }).select("-password").lean();

//     // Enrich with property details
//     const enrichedGuests = await Promise.all(
//         onlineGuests.map(async (guest) => {
//             const properties = await Property.find({ userId: guest._id })
//                 .select("title location price image.url propertyPostedOn expired");

//             return {
//                 _id: guest._id,
//                 name: guest.name,
//                 email: guest.email,
//                 phone: guest.phone,
//                 isBanned: guest.isBanned,
//                 lastLogin: guest.lastLogin,
//                 lastActiveAt: guest.lastActiveAt,
//                 createdAt: guest.createdAt,
//                 propertyCount: properties.length,
//                 properties,
//             };
//         })
//     );

//     res.status(200).json({
//         success: true,
//         count: enrichedGuests.length,
//         guests: enrichedGuests,
//         message: `${enrichedGuests.length} guest(s) online in the last 15 minutes.`
//     });
// });


// export const getAdminNewRegisterGuests = catchAsyncError(async (req, res, next) => {
//   const startOfDay = new Date();
//   startOfDay.setHours(0, 0, 0, 0); // 👈 Set to 12:00 AM today

//   const newGuests = await User.find({
//     role: { $in: ["guest", "Guest"] },
//     createdAt: { $gte: startOfDay },
//   }).select("-password").lean();

//   const enrichedGuests = await Promise.all(
//     newGuests.map(async (guest) => {
//       const properties = await Property.find({ userId: guest._id })
//         .select("title location price image.url propertyPostedOn expired");

//       return {
//         _id: guest._id,
//         name: guest.name,
//         email: guest.email,
//         phone: guest.phone,
//         isBanned: guest.isBanned,
//         lastLogin: guest.lastLogin,
//         lastActiveAt: guest.lastActiveAt,
//         createdAt: guest.createdAt,
//         propertyCount: properties.length,
//         properties,
//       };
//     })
//   );

//   res.status(200).json({
//     success: true,
//     count: enrichedGuests.length,
//     guests: enrichedGuests,
//     message: `${enrichedGuests.length} new guest(s) registered today.`,
//   });
// });

// export const getAdminLogoutGuests = catchAsyncError(async (req, res, next) => {
//   const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

//   const logoutGuests = await User.find({
//     role: { $in: ["guest", "Guest"] },
//     lastActiveAt: { $lt: fifteenMinutesAgo },
//     isBanned: false // Optional: Exclude banned users
//   }).select("-password").lean();

//   const enrichedGuests = await Promise.all(
//     logoutGuests.map(async (guest) => {
//       const properties = await Property.find({ userId: guest._id })
//         .select("title location price image.url propertyPostedOn expired");

//       return {
//         _id: guest._id,
//         name: guest.name,
//         email: guest.email,
//         phone: guest.phone,
//         isBanned: guest.isBanned,
//         lastLogin: guest.lastLogin,
//         lastActiveAt: guest.lastActiveAt,
//         createdAt: guest.createdAt,
//         propertyCount: properties.length,
//         properties,
//       };
//     })
//   );

//   res.status(200).json({
//     success: true,
//     count: enrichedGuests.length,
//     guests: enrichedGuests,
//     message: `${enrichedGuests.length} guest(s) are currently logged out (inactive >15 min).`,
//   });
// });

// export const getAdminBannedGuests = catchAsyncError(async (req, res, next) => {
//   const bannedGuests = await User.find({
//     role: { $in: ["guest", "Guest"] },
//     isBanned: true
//   }).select("-password").lean();

//   const enrichedGuests = await Promise.all(
//     bannedGuests.map(async (guest) => {
//       const properties = await Property.find({ userId: guest._id })
//         .select("title location price image.url propertyPostedOn expired");

//       return {
//         _id: guest._id,
//         name: guest.name,
//         email: guest.email,
//         phone: guest.phone,
//         isBanned: guest.isBanned,
//         lastLogin: guest.lastLogin,
//         lastActiveAt: guest.lastActiveAt,
//         createdAt: guest.createdAt,
//         propertyCount: properties.length,
//         properties,
//       };
//     })
//   );

//   res.status(200).json({
//     success: true,
//     count: enrichedGuests.length,
//     guests: enrichedGuests,
//     message: `${enrichedGuests.length} banned guest(s) found.`,
//   });
// });

