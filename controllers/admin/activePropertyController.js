import { catchAsyncError } from "../../middlewares/catchAsyncError.js";
import ErrorHandler from "../../middlewares/errorMiddleware.js";
import { Property } from "../../models/Property.js";
import { PropertysLog } from "../../models/PropertyLog.js";

// Inactivate Property
export const inActiveProperty = catchAsyncError(async (req, res, next) => {
  const { propertyId } = req.params;
  const { reason } = req.body;
  const adminId = req.admin?._id;

  if (!reason || reason.trim().length < 5) {
    return next(new ErrorHandler("Reason must be at least 5 characters long", 400));
  }

  const property = await Property.findById(propertyId);
  if (!property) return next(new ErrorHandler("Property not found", 404));

  if (property.expired) {
    return next(new ErrorHandler("Property already inactive", 400));
  }

  property.expired = true;
  property.inActiveBy = adminId;
  property.inActiveAt = new Date();
  property.inActiveReason = reason || "Violation of rules";

  await property.save();

  await PropertysLog.create({
    propertyId, // ✅ Important
    action: "inActive",
    performedBy: adminId,
    targetUser: property.userId,
    reason: property.inActiveReason,
  });

  res.status(200).json({
    success: true,
    message: `Property "${property.title}" inactivated successfully.`,
  });
});

// Activate Property
export const activeProperty = catchAsyncError(async (req, res, next) => {
  const { propertyId } = req.params;
  const { note } = req.body;
  const adminId = req.admin?._id;

  if (!note || note.trim().length < 5) {
    return next(new ErrorHandler("Activation note must be at least 5 characters long", 400));
  }

  const property = await Property.findById(propertyId);
  if (!property) return next(new ErrorHandler("Property not found", 404));

  if (!property.expired) {
    return next(new ErrorHandler("Property already active", 400));
  }

  // ✅ Only the admin who inactivated can reactivate it
  if (!property.inActiveBy || property.inActiveBy.toString() !== adminId.toString()) {
    return next(new ErrorHandler("You are not authorized to activate this property", 403));
  }

  property.expired = false;
  property.inActiveBy = null;
  property.inActiveAt = null;
  property.ActiveBy = adminId;
  property.ActiveNote = note || "Reactivated after review";
  property.ActiveAt = new Date();
  property.lastChangedBy = adminId;

  await property.save();

  await PropertysLog.create({
    propertyId, // ✅ Important
    action: "Active",
    performedBy: adminId,
    targetUser: property.userId,
    note: property.ActiveNote,
  });

  res.status(200).json({
    success: true,
    message: `Property "${property.title}" activated successfully.`,
  });
});

// 🔍 Get Property Logs (History)
export const getPropertyLogs = catchAsyncError(async (req, res, next) => {
  const { propertyId } = req.params;

  // 🧠 1️⃣ Find property
  const property = await Property.findById(propertyId).populate("userId", "name email");
  if (!property) return next(new ErrorHandler("Property not found", 404));

  // 🧠 2️⃣ Fetch logs for this specific property
  const logs = await PropertysLog.find({ propertyId })
    .populate("performedBy", "name email phone role createdAt")
    .populate("targetUser", "name email phone createdAt")
    .sort({ createdAt: -1 });
    
  // 🧠 3️⃣ If no logs exist yet
  if (!logs || logs.length === 0) {
    return res.status(200).json({
      success: true,
      message: "This property has no activation or inactivation logs yet.",
      property: {
        title: property.title,
        currentStatus: property.expired ? "Inactive" : "Active",
        expired: property.expired,
        postedBy: property.userId,
      },
      logs: [],
    });
  }

  // 🧠 4️⃣ If logs exist
  res.status(200).json({
    success: true,
    property: {
      title: property.title,
      currentStatus: property.expired ? "Inactive" : "Active",
      expired: property.expired,
      postedBy: property.userId,
      inActiveReason: property.inActiveReason,
      inActiveAt: property.inActiveAt,
      ActiveNote: property.ActiveNote,
      ActiveAt: property.ActiveAt,
    },
    logs,
  });
});
