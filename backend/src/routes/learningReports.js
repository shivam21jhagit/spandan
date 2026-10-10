import express from 'express'
import { authenticate } from '../middleware/auth.js'

import Room from '../models/Room.js'
import RoomMember from '../models/RoomMember.js'
import LearningReport from '../models/LearningReport.js'

const router = express.Router()

router.use(authenticate)


/**
 * GET /api/learning-reports/:roomId/all
 * Only the teacher who owns the room can view its student reports.
 */
router.get('/:roomId/all', async (req, res) => {
  try {
    const { roomId } = req.params
    const userId = req.user._id

    const room = await Room.findById(roomId).lean()

    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room not found'
      })
    }

    if (String(room.teacher) !== String(userId)) {
      return res.status(403).json({
        success: false,
        error: 'Only the room owner can view all learning reports'
      })
    }

    if (!room.endedAt) {
      return res.status(409).json({
        success: false,
        error: 'Learning reports are available only after the session ends'
      })
    }

    const reports = await LearningReport.find({ roomId })
      .populate('studentId', 'name email')
      .sort({ createdAt: -1 })
      .lean()

    return res.json({
      success: true,
      reports
    })
  } catch (error) {
    console.error('Failed to fetch room learning reports:', error)

    return res.status(500).json({
      success: false,
      error: 'Failed to fetch room learning reports'
    })
  }
})


// GET /api/learning-reports/:roomId
// Students can retrieve only their own report for a room.
// Teachers can retrieve reports for rooms they own.

router.get('/:roomId/student/:studentId', async (req, res) => {
  try {
    const { roomId, studentId } = req.params
    const userId = req.user._id

    const room = await Room.findById(roomId).lean()

    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room not found'
      })
    }

    if (String(room.teacher) !== String(userId)) {
      return res.status(403).json({
        success: false,
        error: 'Only the room owner can view this report'
      })
    }

    if (!room.endedAt) {
      return res.status(409).json({
        success: false,
        error: 'The session has not ended'
      })
    }

    const report = await LearningReport.findOne({
      roomId,
      studentId
    })
      .populate('studentId', 'name email')
      .lean()

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Learning report not found'
      })
    }

    return res.json({ success: true, report })
  } catch (error) {
    console.error('Failed to fetch student report:', error)

    return res.status(500).json({
      success: false,
      error: 'Failed to fetch student report'
    })
  }
})

router.get('/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params
    const userId = req.user._id

    const room = await Room.findById(roomId).lean()

    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room not found'
      })
    }

    const isTeacher = String(room.teacher) === String(userId)

    if (!isTeacher) {
      const membership = await RoomMember.findOne({
        roomId,
        studentId: userId
      }).lean()

      if (!membership) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to view this learning report'
        })
      }
    }

    if (!room.endedAt) {
      return res.status(409).json({
        success: false,
        error: 'Learning report is available only after the session ends'
      })
    }

    const report = await LearningReport.findOne({
      roomId,
      studentId: userId
    }).lean()

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Learning report not found'
      })
    }

    res.json({
      success: true,
      report
    })
  } catch (error) {
    console.error('Failed to fetch learning report:', error)

    res.status(500).json({
      success: false,
      error: 'Failed to fetch learning report'
    })
  }
})

export default router