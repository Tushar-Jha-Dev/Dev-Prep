/**
 * DevPrep - Profile Controller (`profileController.js`)
 * 
 * Endpoints:
 * - GET    /api/profile/avatar  -> Returns authenticated user's avatar data URL or null
 * - PUT    /api/profile/avatar  -> Validates and saves cropped 256x256 base64 avatar
 * - DELETE /api/profile/avatar  -> Removes user's avatar from avatars.json
 * 
 * Security & Data Privacy:
 * - Strictly scoped to `req.user.id`. Never accepts a userId from client parameters.
 * - Stored in `server/data/avatars.json` separate from `users.json` to keep user database lightweight.
 * - Validated using magic bytes file signature check (WebP, JPEG, PNG). SVG and GIF strictly rejected.
 * - Decoded binary payload capped at 100 KB.
 */

const { getStorage } = require('../storage');
const { validateAvatarPayload } = require('../utils/validators');

/**
 * GET /api/profile/avatar
 * Returns { avatar: dataUrl | null } for authenticated user
 */
async function getAvatar(req, res, next) {
  try {
    const userId = req.user.id;
    const storage = getStorage();
    const dataUrl = await storage.getAvatar(userId);

    res.status(200).json({
      avatar: dataUrl
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/profile/avatar
 * Validates base64 data URL and saves to avatars storage
 */
async function updateAvatar(req, res, next) {
  try {
    const userId = req.user.id;
    const { image } = req.body;

    const validationError = validateAvatarPayload(image);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const storage = getStorage();
    await storage.setAvatar(userId, image);

    res.status(200).json({
      message: 'Profile photo updated successfully',
      avatar: image
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/profile/avatar
 * Removes avatar entry from storage
 */
async function deleteAvatar(req, res, next) {
  try {
    const userId = req.user.id;
    const storage = getStorage();
    await storage.deleteAvatar(userId);

    res.status(200).json({
      message: 'Profile photo removed successfully',
      avatar: null
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAvatar,
  updateAvatar,
  deleteAvatar
};
