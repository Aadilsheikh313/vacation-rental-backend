// controllers/globalSearchController.js
import { User } from "../models/User.js";
import { Property } from "../models/Property.js";
import { Experience } from "../models/ExperienceCategory.js";
import { Booking } from "../models/Booking.js";

export const globalSearch = async (req, res) => {
  try {
    const { query, minPrice, maxPrice, city, role } = req.query;

    // ✅ Build regex safely
    const regexQuery = query && typeof query === "string"
      ? { $regex: query, $options: "i" }
      : null;

    // ---------- Users ----------
    let userFilter = {};
    if (regexQuery) {
      userFilter.$or = [
        { name: regexQuery },
        { email: regexQuery },
        { phone: regexQuery },
      ];
    }
    if (role) userFilter.role = role;

    const users = await User.find(userFilter).select("name email phone role");

    // ---------- Properties ----------
    let propertyFilter = {};
    if (regexQuery) {
      propertyFilter.$or = [
        { title: regexQuery },
        { description: regexQuery },
        { city: regexQuery },
        { country: regexQuery },
        { location: regexQuery },
      ];
    }
    if (minPrice || maxPrice) {
      propertyFilter.price = {
        ...(minPrice ? { $gte: Number(minPrice) } : {}),
        ...(maxPrice ? { $lte: Number(maxPrice) } : {}),
      };
    }
    if (city) {
      propertyFilter.city = { $regex: city, $options: "i" };
    }

    const properties = await Property.find(propertyFilter).populate(
      "userId",
      "name email"
    );

    // ---------- Experiences ----------
    let experienceFilter = {};
    if (regexQuery) {
      experienceFilter.$or = [
        { title: regexQuery },
        { description: regexQuery },
        { location: regexQuery },
        { city: regexQuery },
        { country: regexQuery },
      ];
    }

    const experiences = await Experience.find(experienceFilter);

    // ---------- Bookings ----------
    const bookings = await Booking.find({})
      .populate("user", "name email")
      .populate("property", "title city country");

    // ---------- Response ----------
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
    console.error("❌ Global Search Error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};
