import { User } from "../models/User.js";
import { Property } from "../models/Property.js";

// General search (for Admin)
export const adminSearch = async (req, res) => {
  try {
    const { query } = req.query;

    const users = await User.find({
      name: { $regex: query, $options: "i" },
    }).limit(10);

    const properties = await Property.find({
      title: { $regex: query, $options: "i" },
    }).limit(10);

    res.json({ users, properties });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Guest page search
export const guestSearch = async (req, res) => {
  try {
    const { query } = req.query;

    const properties = await Property.find({
      city: { $regex: query, $options: "i" },
    }).limit(10);

    res.json({ properties });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Host page search (own properties only)
export const hostSearch = async (req, res) => {
  try {
    const { query } = req.query;
    const hostId = req.user.id; // assume JWT se userId aa raha hai

    const properties = await Property.find({
      userId: hostId,
      title: { $regex: query, $options: "i" },
    }).limit(10);

    res.json({ properties });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
