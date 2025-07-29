export const paginate = (model) => async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    const [results, total] = await Promise.all([
      model.find().skip(skip).limit(limit).sort({ createdAt: -1 }),
      model.countDocuments()
    ]);

    res.status(200).json({
      success: true,
      data: results,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Pagination error", error });
  }
};
