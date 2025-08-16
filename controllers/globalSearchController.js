// controllers/globalSearchController.js
import { User } from "../models/User.js";
import { Property } from "../models/Property.js";
import { Experience } from "../models/ExperienceCategory.js";
import { Booking } from "../models/Booking.js";

export const globalSearch = async (req, res) => {
  try {
    const { query, minPrice, maxPrice, city, role } = req.query;

    // 🔍 Build search conditions dynamically
    const regexQuery = query ? { $regex: query, $options: "i" } : {};

    // Users search
    const users = await User.find({
      $or: [
        { name: regexQuery },
        { email: regexQuery },
        { phone: regexQuery }
      ],
      ...(role ? { role } : {}) // optional filter by role (guest/host)
    }).select("name email phone role");

    // Properties search
    const properties = await Property.find({
      $or: [
        { title: regexQuery },
        { description: regexQuery },
        { city: regexQuery },
        { country: regexQuery },
        { location: regexQuery }
      ],
      ...(minPrice || maxPrice
        ? {
            price: {
              ...(minPrice ? { $gte: minPrice } : {}),
              ...(maxPrice ? { $lte: maxPrice } : {}),
            },
          }
        : {}),
      ...(city ? { city: { $regex: city, $options: "i" } } : {}),
    }).populate("userId", "name email");

    // Experiences search
    const experiences = await Experience.find({
      $or: [
        { title: regexQuery },
        { description: regexQuery },
        { location: regexQuery },
        { city: regexQuery },
        { country: regexQuery }
      ]
    });

    // Bookings search
    const bookings = await Booking.find({
      ...(query ? {} : {}), // could extend with propertyId/userId lookups
    })
      .populate("user", "name email")
      .populate("property", "title city country");

    res.json({
      success: true,
      data: {
        users,
        properties,
        experiences,
        bookings,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
