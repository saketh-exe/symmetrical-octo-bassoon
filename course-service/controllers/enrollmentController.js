import { Course } from "../models/Course.js";
import User from "../models/User.js";

// Enroll a student in a course
export const enrollInCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        const userEmail = req.user.email; // Get email from middleware

        // Check if course exists
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        // Check if student exists
        const student = await User.findOne({ email: userEmail });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        // Check if already enrolled
        if (student.enrolledCourses.includes(courseId)) {
            return res.status(400).json({
                success: false,
                message: "Already enrolled in this course"
            });
        }

        // Add course to student's enrolledCourses
        student.enrolledCourses.push(courseId);
        await student.save();

        // Increment numberOfRegistrations in course
        course.numberOfRegistrations = (course.numberOfRegistrations || 0) + 1;
        await course.save();

        res.status(200).json({
            success: true,
            message: "Successfully enrolled in course",
            data: {
                courseId: course._id,
                courseTitle: course.title,
                studentId: student._id
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Error enrolling in course",
            error: error.message
        });
    }
};

// Unenroll a student from a course
export const unenrollFromCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        const userEmail = req.user.email; // Get email from middleware

        // Check if course exists
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        // Check if student exists
        const student = await User.findOne({ email: userEmail });
        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }


        // Check if student is enrolled
        if (!student.enrolledCourses.includes(courseId)) {
            return res.status(400).json({
                success: false,
                message: "Not enrolled in this course"
            });
        }

        // Remove course from student's enrolledCourses
        student.enrolledCourses.pull(courseId);
        await student.save();

        // Decrement numberOfRegistrations in course
        course.numberOfRegistrations = Math.max((course.numberOfRegistrations || 0) - 1, 0);
        await course.save();

        res.status(200).json({
            success: true,
            message: "Successfully unenrolled from course",
            data: {
                courseId: course._id,
                courseTitle: course.title,
                studentId: student._id
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error unenrolling from course",
            error: error.message
        });
    }
};

// Get all enrolled courses for a student
export const getEnrolledCourses = async (req, res) => {
    try {
        const userEmail = req.user.email; // Get email from middleware

        const student = await User.findOne({ email: userEmail })
            .populate({
                path: 'enrolledCourses',
                populate: {
                    path: 'Instructor_id',
                    select: 'name email'
                }
            });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        res.status(200).json({
            success: true,
            count: student.enrolledCourses.length,
            data: student.enrolledCourses
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching enrolled courses",
            error: error.message
        });
    }
};

// Get all students enrolled in a specific course (for instructors)
export const getCourseEnrollments = async (req, res) => {
    try {
        const { courseId } = req.params;

        // Check if course exists
        const course = await Course.findById(courseId).populate('Instructor_id', 'name email');
        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        // Find all students enrolled in this course
        const enrolledStudents = await User.find(
            { enrolledCourses: courseId },
            'name email role profile.avatar'
        );

        res.status(200).json({
            success: true,
            course: {
                id: course._id,
                title: course.title,
                instructor: course.Instructor_id
            },
            count: enrolledStudents.length,
            students: enrolledStudents
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching course enrollments",
            error: error.message
        });
    }
};

// Check if a student is enrolled in a course
export const checkEnrollmentStatus = async (req, res) => {
    try {
        const { courseId } = req.params;
        const userEmail = req.user.email; // Get email from middleware

        const student = await User.findOne({ email: userEmail });
        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        const isEnrolled = student.enrolledCourses.includes(courseId);

        res.status(200).json({
            success: true,
            isEnrolled,
            courseId
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error checking enrollment status",
            error: error.message
        });
    }
};
