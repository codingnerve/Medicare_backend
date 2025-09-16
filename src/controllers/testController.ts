import { Request, Response, NextFunction } from "express";
import { Test } from "@/models/Test";
import { createError } from "@/middleware/errorHandler";

interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
    role: string;
  };
}

export const getAllTests = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  try {
    const page = parseInt((req.query as any)["page"] as string) || 1;
    const limit = parseInt((req.query as any)["limit"] as string) || 10;
    const skip = (page - 1) * limit;
    const { category, search, minPrice, maxPrice } = req.query;

    // Build filter object
    const filter: any = { isAvailable: true };

    if (category) {
      filter.category = category;
    }

    if (search) {
      filter.$text = { $search: search as string };
    }

    if (minPrice) {
      filter.price = { ...filter.price, $gte: parseFloat(minPrice as string) };
    }

    if (maxPrice) {
      filter.price = { ...filter.price, $lte: parseFloat(maxPrice as string) };
    }

    const [tests, total] = await Promise.all([
      Test.find(filter).sort({ category: 1, price: 1 }).skip(skip).limit(limit),
      Test.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: tests,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return _next(error);
  }
};

export const getTestById = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  try {
    const { id } = req.params;

    const test = await Test.findById(id);

    if (!test) {
      return _next(createError("Test not found", 404));
    }

    return res.json({
      success: true,
      data: test,
    });
  } catch (error) {
    return _next(error);
  }
};

export const createTest = async (
  req: AuthRequest,
  res: Response,
  _next: NextFunction
) => {
  try {
    // Only admin can create tests
    if (req.user?.role !== "ADMIN") {
      return _next(createError("Admin access required", 403));
    }

    const test = await Test.create(req.body);

    res.status(201).json({
      success: true,
      message: "Test created successfully",
      data: test,
    });
  } catch (error) {
    return _next(error);
  }
};

export const updateTest = async (
  req: AuthRequest,
  res: Response,
  _next: NextFunction
) => {
  try {
    const { id } = req.params;

    // Only admin can update tests
    if (req.user?.role !== "ADMIN") {
      return _next(createError("Admin access required", 403));
    }

    const test = await Test.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!test) {
      return _next(createError("Test not found", 404));
    }

    return res.json({
      success: true,
      message: "Test updated successfully",
      data: test,
    });
  } catch (error) {
    return _next(error);
  }
};

export const deleteTest = async (
  req: AuthRequest,
  res: Response,
  _next: NextFunction
) => {
  try {
    const { id } = req.params;

    // Only admin can delete tests
    if (req.user?.role !== "ADMIN") {
      return _next(createError("Admin access required", 403));
    }

    const test = await Test.findByIdAndDelete(id);

    if (!test) {
      return _next(createError("Test not found", 404));
    }

    return res.json({
      success: true,
      message: "Test deleted successfully",
    });
  } catch (error) {
    return _next(error);
  }
};

export const getTestCategories = async (
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  try {
    const categories = await Test.distinct("category");

    return res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    return _next(error);
  }
};
