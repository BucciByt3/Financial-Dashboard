// server/middleware/checkBlocked.js
import { BlockedUser } from '../models/Admin.js';

const checkBlocked = async (req, res, next) => {
  try {
    const { email, deviceInfo } = req.body;
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip;

    // Check if device is blocked using multiple criteria
    const blockedUser = await BlockedUser.findOne({
      $or: [
        { email },
        { ipAddress },
        { 'deviceInfo.hardwareId': deviceInfo?.hardwareId },
        { 
          $and: [
            { 'deviceInfo.hardwareInfo.gpu.renderer': deviceInfo?.hardwareInfo?.gpu?.renderer },
            { 'deviceInfo.hardwareInfo.gpu.vendor': deviceInfo?.hardwareInfo?.gpu?.vendor },
            { 'deviceInfo.screenResolution': deviceInfo?.screenResolution },
            { 'deviceInfo.hardwareInfo.cores': deviceInfo?.hardwareInfo?.cores }
          ]
        }
      ]
    });

    if (blockedUser) {
      console.log('Blocked registration attempt:', {
        email,
        hardwareId: deviceInfo?.hardwareId,
        ipAddress,
        matchedBlockedUser: blockedUser.email
      });

      return res.status(403).json({
        error: 'Account creation not allowed',
        message: 'This device has been blocked by an administrator'
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

export default checkBlocked;
