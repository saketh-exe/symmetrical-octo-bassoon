
import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { roles } from "../middleware/role.js";
const router = Router();
import { getAllCourses, getCourseById, createCourse, updateCourse, deleteCourse } from '../controllers/courseController.js';
import {
    enrollInCourse,
    unenrollFromCourse,
    getEnrolledCourses,
    getCourseEnrollments,
    checkEnrollmentStatus
} from '../controllers/enrollmentController.js';

// Course CRUD routes
router.get('/', getAllCourses);
router.get('/:id', getCourseById);
router.post('/', authenticate, roles, createCourse);
router.put('/:id', authenticate, roles, updateCourse);
router.delete('/:id', authenticate, roles, deleteCourse);

// Enrollment routes
router.post('/:courseId/enroll', authenticate, enrollInCourse); // Enroll in a course
router.delete('/:courseId/unenroll', authenticate, unenrollFromCourse); // Unenroll from a course
router.get('/enrolled/my-courses', authenticate, getEnrolledCourses); // Get student's enrolled courses
router.get('/:courseId/enrollments', authenticate, getCourseEnrollments); // Get all students in a course
router.get('/:courseId/enrollment-status', authenticate, checkEnrollmentStatus); // Check if enrolled

export default router;