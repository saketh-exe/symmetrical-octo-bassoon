import User from "../models/user.ts";
import type { Request, Response } from "express";
import logger from "../utils/logger.ts";

interface CustomRequest extends Request {
  user?: string;
  token?: string;
  sessionId?: string;
  role?: string;
  id?: string;
}

export async function getAllOrSingleUsers(req: CustomRequest, res: Response) {
  const paramId = req.params.id;

  // Get single user by ID
  if (paramId) {
    // trying to access specific user
    if (req.role !== "admin" && req.id !== paramId) {
      return res.status(403).json({ message: "Forbidden" });
    }
    try {
      const foundUser = await User.findById(paramId)
        .select("-password")
        .populate({
          path: "enrolledCourses",
          select: "title description Instructor_id numberOfRegistrations",
          populate: {
            path: "Instructor_id",
            select: "name email",
          },
        })
        .populate({
          path: "createdCourses",
          select: "title description Instructor_id numberOfRegistrations",
        })
        .lean();

      if (!foundUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Structure the response with additional computed data
      const userInfo = {
        id: foundUser._id,
        name: foundUser.name,
        email: foundUser.email,
        role: foundUser.role,
        profile: foundUser.profile || {
          avatar: null,
          bio: null,
          socialLinks: [],
          skills: [],
        },
        enrolledCourses: foundUser.enrolledCourses || [],
        createdCourses: foundUser.createdCourses || [],
        stats: {
          totalEnrolledCourses: (foundUser.enrolledCourses || []).length,
          totalCreatedCourses: (foundUser.createdCourses || []).length,
        },
        createdAt: foundUser.createdAt,
        updatedAt: foundUser.updatedAt,
      };

      logger.info(`User fetched successfully: ${foundUser.email}`);
      return res.status(200).json({
        success: true,
        user: userInfo,
      });
    } catch (e) {
      logger.error(`Error in getAllUsers: ${(e as Error).message}`);
      return res.status(500).json({
        success: false,
        message: "Error fetching user",
        error: (e as Error).message,
      });
    }
  }

  // Get all users (Admin only)
  if (req.role !== "admin") {
    return res.status(403).json({ message: "Forbidden" });
  }

  try {
    // admin accessing all users with populated course details
    const users = await User.find()
      .select("-password")
      .populate({
        path: "enrolledCourses",
        select: "title description Instructor_id numberOfRegistrations",
        populate: {
          path: "Instructor_id",
          select: "name email",
        },
      })
      .populate({
        path: "createdCourses",
        select: "title description Instructor_id numberOfRegistrations",
      })
      .lean();

    // Map users to structured format
    const usersInfo = users.map((user) => ({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profile: user.profile || {
        avatar: null,
        bio: null,
        socialLinks: [],
        skills: [],
      },
      enrolledCourses: user.enrolledCourses || [],
      createdCourses: user.createdCourses || [],
      stats: {
        totalEnrolledCourses: (user.enrolledCourses || []).length,
        totalCreatedCourses: (user.createdCourses || []).length,
      },
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));

    logger.info(
      `Admin ${req.user} fetched all users (${usersInfo.length} total)`
    );
    return res.status(200).json({
      success: true,
      count: usersInfo.length,
      users: usersInfo,
    });
  } catch (e) {
    logger.error(`Error in getAllUsers (admin): ${(e as Error).message}`);
    return res.status(500).json({
      success: false,
      message: "Error fetching users",
      error: (e as Error).message,
    });
  }
}

export async function modifyUser(req: CustomRequest, res: Response) {
  const paramId = req.params.id;
  if (!paramId) {
    return res.status(400).json({ message: "User ID is required" });
  }
  if (req.role !== "admin" && req.id !== paramId) {
    return res.status(403).json({ message: "Forbidden" });
  }
  const { name } = req.body;
  try {
    const updatedUser = await User.findByIdAndUpdate(
      paramId,
      { name },
      { new: true }
    ).select("name email role");
    if (!updatedUser)
      return res.status(404).json({ message: "User not found" });
    return res.status(200).json({ user: updatedUser });
  } catch (e) {
    logger.error(`Error in updateUser: ${(e as Error).message}`);
    return res
      .status(500)
      .json({ message: "Error updating user", error: (e as Error).message });
  }
}
export async function deleteUser(req: CustomRequest, res: Response) {
  const paramId = req.params.id;

  // Only admins can delete users
  if (req.role !== "admin") {
    logger.warn(`Unauthorized delete attempt by user: ${req.user}`);
    return res.status(403).json({
      message: "Forbidden: Only administrators can delete users",
    });
  }

  if (!paramId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  try {
    const deletedUser = await User.findByIdAndDelete(paramId).select(
      "name email role"
    );

    if (!deletedUser) {
      logger.warn(`Delete attempt for non-existent user ID: ${paramId}`);
      return res.status(404).json({ message: "User not found" });
    }

    logger.info(
      `Admin ${req.user} deleted user: ${deletedUser.email} (${deletedUser.name})`
    );
    return res.status(200).json({
      message: "User deleted successfully",
      deletedUser: {
        id: deletedUser._id,
        name: deletedUser.name,
        email: deletedUser.email,
        role: deletedUser.role,
      },
    });
  } catch (e) {
    logger.error(`Error in deleteUser: ${(e as Error).message}`);
    return res
      .status(500)
      .json({ message: "Error deleting user", error: (e as Error).message });
  }
}

// Bulk delete users - Admin only
export async function bulkDeleteUsers(req: CustomRequest, res: Response) {
  // Only admins can bulk delete users
  if (req.role !== "admin") {
    logger.warn(`Unauthorized bulk delete attempt by user: ${req.user}`);
    return res.status(403).json({
      message: "Forbidden: Only administrators can delete users",
    });
  }

  const { userIds } = req.body;

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({
      message: "User IDs array is required and must not be empty",
    });
  }

  try {
    const result = await User.deleteMany({
      _id: { $in: userIds },
      role: { $ne: "admin" }, // Prevent deleting other admins
    });

    logger.info(`Admin ${req.user} bulk deleted ${result.deletedCount} users`);
    return res.status(200).json({
      message: `Successfully deleted ${result.deletedCount} user(s)`,
      deletedCount: result.deletedCount,
    });
  } catch (e) {
    logger.error(`Error in bulkDeleteUsers: ${(e as Error).message}`);
    return res
      .status(500)
      .json({ message: "Error deleting users", error: (e as Error).message });
  }
}

export async function getInfo(req: CustomRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    // Fetch user with populated course data
    const foundUser = await User.findOne({ email: req.user })
      .select("-password")
      .populate({
        path: "enrolledCourses",
        select: "title description Instructor_id",
        populate: {
          path: "Instructor_id",
          select: "name email",
        },
      })
      .populate({
        path: "createdCourses",
        select: "title description Instructor_id numberOfRegistrations",
      })
      .lean(); // Use lean() for better performance as we're only reading data

    if (!foundUser) {
      logger.warn(`User not found: ${req.user}`);
      return res.status(404).json({ message: "User not found" });
    }

    // Structure the response with additional computed data
    const userInfo = {
      id: foundUser._id,
      name: foundUser.name,
      email: foundUser.email,
      role: foundUser.role,
      profile: foundUser.profile || {
        avatar: null,
        bio: null,
        socialLinks: [],
        skills: [],
      },
      enrolledCourses: foundUser.enrolledCourses || [],
      createdCourses: foundUser.createdCourses || [],
      stats: {
        totalEnrolledCourses: (foundUser.enrolledCourses || []).length,
        totalCreatedCourses: (foundUser.createdCourses || []).length,
      },
      createdAt: foundUser.createdAt,
      updatedAt: foundUser.updatedAt,
    };

    logger.info(`User info fetched successfully for: ${req.user}`);
    return res.status(200).json({
      success: true,
      user: userInfo,
    });
  } catch (e) {
    logger.error(`Error in getInfo: ${(e as Error).message}`);
    return res.status(500).json({
      success: false,
      message: "Error fetching user info",
      error: (e as Error).message,
    });
  }
}

// Get user analytics - Admin only
export async function getUserAnalytics(req: CustomRequest, res: Response) {
  // Only admins can access analytics
  if (req.role !== "admin") {
    logger.warn(`Unauthorized analytics access attempt by user: ${req.user}`);
    return res.status(403).json({
      message: "Forbidden: Only administrators can access analytics",
    });
  }

  const userId = req.params.id;

  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  try {
    const user = await User.findById(userId)
      .select("-password")
      .populate({
        path: "enrolledCourses",
        select:
          "title description Instructor_id numberOfRegistrations createdAt",
        populate: {
          path: "Instructor_id",
          select: "name email",
        },
      })
      .populate({
        path: "createdCourses",
        select: "title description numberOfRegistrations createdAt",
      })
      .lean();

    if (!user) {
      logger.warn(`Analytics requested for non-existent user ID: ${userId}`);
      return res.status(404).json({ message: "User not found" });
    }

    const analytics: any = {
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      userRole: user.role,
      accountCreatedAt: user.createdAt,
      accountAge: Math.floor(
        (new Date().getTime() -
          new Date(user.createdAt || new Date()).getTime()) /
          (1000 * 60 * 60 * 24)
      ), // days
    };

    // Role-based analytics
    if (user.role === "student") {
      // Student Analytics
      const enrolledCourses = (user.enrolledCourses as any[]) || [];

      // Course enrollment timeline data
      const enrollmentTimeline = enrolledCourses.map((course) => ({
        courseName: course.title,
        enrolledDate: course.createdAt,
        instructor: course.Instructor_id?.name || "Unknown",
      }));

      // Instructor distribution
      const instructorCount: { [key: string]: number } = {};
      enrolledCourses.forEach((course) => {
        const instructorName = course.Instructor_id?.name || "Unknown";
        instructorCount[instructorName] =
          (instructorCount[instructorName] || 0) + 1;
      });

      const instructorDistribution = Object.entries(instructorCount).map(
        ([name, count]) => ({
          instructor: name,
          coursesEnrolled: count,
        })
      );

      // Course popularity (based on numberOfRegistrations)
      const coursePopularity = enrolledCourses
        .map((course) => ({
          courseTitle: course.title,
          totalStudents: course.numberOfRegistrations || 0,
        }))
        .sort((a, b) => b.totalStudents - a.totalStudents);

      analytics.studentAnalytics = {
        totalEnrolledCourses: enrolledCourses.length,
        enrollmentTimeline: enrollmentTimeline.sort(
          (a, b) =>
            new Date(a.enrolledDate).getTime() -
            new Date(b.enrolledDate).getTime()
        ),
        instructorDistribution: instructorDistribution.sort(
          (a, b) => b.coursesEnrolled - a.coursesEnrolled
        ),
        coursePopularity,
        averageClassSize:
          enrolledCourses.length > 0
            ? Math.round(
                enrolledCourses.reduce(
                  (sum, course) => sum + (course.numberOfRegistrations || 0),
                  0
                ) / enrolledCourses.length
              )
            : 0,
        mostPopularCourse:
          coursePopularity.length > 0 ? coursePopularity[0] : null,
      };
    } else if (user.role === "teacher") {
      // Teacher Analytics
      const createdCourses = (user.createdCourses as any[]) || [];
      const enrolledCourses = (user.enrolledCourses as any[]) || [];

      // Total students across all courses
      const totalStudentsReached = createdCourses.reduce(
        (sum, course) => sum + (course.numberOfRegistrations || 0),
        0
      );

      // Course performance data
      const coursePerformance = createdCourses
        .map((course) => ({
          courseId: course._id,
          courseTitle: course.title,
          studentsEnrolled: course.numberOfRegistrations || 0,
          createdAt: course.createdAt,
        }))
        .sort((a, b) => b.studentsEnrolled - a.studentsEnrolled);

      // Monthly course creation trend
      const courseCreationByMonth: { [key: string]: number } = {};
      createdCourses.forEach((course) => {
        const date = new Date(course.createdAt);
        const monthYear = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;
        courseCreationByMonth[monthYear] =
          (courseCreationByMonth[monthYear] || 0) + 1;
      });

      const creationTrend = Object.entries(courseCreationByMonth)
        .map(([month, count]) => ({ month, coursesCreated: count }))
        .sort((a, b) => a.month.localeCompare(b.month));

      // Student enrollment distribution
      const enrollmentDistribution = createdCourses.map((course) => ({
        courseTitle: course.title,
        students: course.numberOfRegistrations || 0,
      }));

      // Performance metrics
      const averageStudentsPerCourse =
        createdCourses.length > 0
          ? Math.round(totalStudentsReached / createdCourses.length)
          : 0;

      const mostPopularCourse =
        coursePerformance.length > 0 ? coursePerformance[0] : null;
      const leastPopularCourse =
        coursePerformance.length > 0
          ? coursePerformance[coursePerformance.length - 1]
          : null;

      analytics.teacherAnalytics = {
        totalCoursesCreated: createdCourses.length,
        totalStudentsReached,
        averageStudentsPerCourse,
        coursePerformance,
        creationTrend,
        enrollmentDistribution,
        mostPopularCourse,
        leastPopularCourse,
        totalCoursesEnrolledIn: enrolledCourses.length, // Courses teacher is enrolled in (for learning)
        engagementRate:
          createdCourses.length > 0
            ? (
                (totalStudentsReached / (createdCourses.length * 100)) *
                100
              ).toFixed(2) + "%"
            : "0%",
      };
    } else if (user.role === "admin") {
      // Admin user - limited analytics
      analytics.adminAnalytics = {
        note: "Admin accounts have limited analytics",
        accountInfo: {
          role: user.role,
          createdAt: user.createdAt,
          accountAge: analytics.accountAge,
        },
      };
    }

    logger.info(`Admin ${req.user} accessed analytics for user: ${user.email}`);
    return res.status(200).json({
      success: true,
      analytics,
    });
  } catch (e) {
    logger.error(`Error in getUserAnalytics: ${(e as Error).message}`);
    return res.status(500).json({
      success: false,
      message: "Error fetching user analytics",
      error: (e as Error).message,
    });
  }
}
