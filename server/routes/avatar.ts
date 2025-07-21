import { Request, Response } from "express";
import multer from "multer";
import sharp from "sharp";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { enhancedAuthService } from "../services/auth-enhanced";

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check if the file is an image
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

// Ensure upload directory exists
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "avatars");

async function ensureUploadDir() {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  } catch (error) {
    console.error("Failed to create upload directory:", error);
  }
}

// Initialize upload directory
ensureUploadDir();

export async function handleUploadAvatar(req: Request, res: Response) {
  try {
    // Check if user is authenticated
    const userId = req.body.userId || req.session?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    // Verify user exists
    const userProfile = await enhancedAuthService.getEnhancedProfile(userId);
    if (!userProfile) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No image file provided",
      });
    }

    // Generate unique filename
    const fileExtension =
      path.extname(req.file.originalname).toLowerCase() || ".jpg";
    const fileName = `${userId}_${crypto.randomBytes(8).toString("hex")}${fileExtension}`;
    const filePath = path.join(UPLOAD_DIR, fileName);

    try {
      // Process image with sharp
      const processedImageBuffer = await sharp(req.file.buffer)
        .resize(400, 400, {
          fit: "cover",
          position: "center",
        })
        .jpeg({
          quality: 85,
          progressive: true,
        })
        .toBuffer();

      // Save processed image
      await fs.writeFile(filePath, processedImageBuffer);

      // Generate public URL
      const imageUrl = `/uploads/avatars/${fileName}`;

      // Update user profile with new image URL
      const success = await enhancedAuthService.updateProfileImage(
        userId,
        imageUrl,
      );

      if (!success) {
        // Clean up uploaded file if database update fails
        try {
          await fs.unlink(filePath);
        } catch (cleanupError) {
          console.error("Failed to cleanup uploaded file:", cleanupError);
        }

        return res.status(500).json({
          success: false,
          error: "Failed to update profile",
        });
      }

      // Clean up old image if it exists and is not the default
      if (
        userProfile.profileImage &&
        userProfile.profileImage.startsWith("/uploads/avatars/") &&
        userProfile.profileImage !== imageUrl
      ) {
        try {
          const oldImagePath = path.join(
            process.cwd(),
            "public",
            userProfile.profileImage,
          );
          await fs.unlink(oldImagePath);
        } catch (error) {
          // Don't fail if old image cleanup fails
          console.warn("Failed to cleanup old profile image:", error);
        }
      }

      res.json({
        success: true,
        imageUrl,
        message: "Profile image updated successfully",
      });
    } catch (imageError) {
      console.error("Image processing failed:", imageError);
      res.status(500).json({
        success: false,
        error: "Failed to process image",
      });
    }
  } catch (error) {
    console.error("Avatar upload failed:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    });
  }
}

// Handle avatar deletion
export async function handleDeleteAvatar(req: Request, res: Response) {
  try {
    const userId = req.body.userId || req.session?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    const userProfile = await enhancedAuthService.getEnhancedProfile(userId);
    if (!userProfile) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Remove profile image from database
    const success = await enhancedAuthService.updateProfileImage(userId, null);

    if (
      success &&
      userProfile.profileImage &&
      userProfile.profileImage.startsWith("/uploads/avatars/")
    ) {
      // Delete physical file
      try {
        const imagePath = path.join(
          process.cwd(),
          "public",
          userProfile.profileImage,
        );
        await fs.unlink(imagePath);
      } catch (error) {
        console.warn("Failed to delete image file:", error);
        // Don't fail the request if file deletion fails
      }
    }

    res.json({
      success,
      message: success
        ? "Profile image removed successfully"
        : "Failed to remove profile image",
    });
  } catch (error) {
    console.error("Avatar deletion failed:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Deletion failed",
    });
  }
}

// Get available avatar templates/defaults
export async function handleGetAvatarTemplates(req: Request, res: Response) {
  try {
    const templates = [
      {
        id: "default-1",
        name: "Default Blue",
        url: "/images/avatars/default-blue.svg",
        category: "default",
      },
      {
        id: "default-2",
        name: "Default Green",
        url: "/images/avatars/default-green.svg",
        category: "default",
      },
      {
        id: "default-3",
        name: "Default Purple",
        url: "/images/avatars/default-purple.svg",
        category: "default",
      },
      {
        id: "default-4",
        name: "Default Orange",
        url: "/images/avatars/default-orange.svg",
        category: "default",
      },
      {
        id: "ai-1",
        name: "AI Assistant",
        url: "/images/avatars/ai-robot.svg",
        category: "ai",
      },
      {
        id: "ai-2",
        name: "Circuit Brain",
        url: "/images/avatars/ai-brain.svg",
        category: "ai",
      },
    ];

    res.json({
      success: true,
      templates,
    });
  } catch (error) {
    console.error("Failed to get avatar templates:", error);
    res.status(500).json({
      success: false,
      error: "Failed to load avatar templates",
    });
  }
}

// Set avatar template
export async function handleSetAvatarTemplate(req: Request, res: Response) {
  try {
    const { templateId } = req.body;
    const userId = req.body.userId || req.session?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    if (!templateId) {
      return res.status(400).json({
        success: false,
        error: "Template ID is required",
      });
    }

    // Get template URL
    const templates = await handleGetAvatarTemplates(req, res);
    // Note: This is a simplified implementation
    // In a real app, you'd want to validate the template ID properly

    const templateUrl = `/images/avatars/${templateId}.svg`;

    const success = await enhancedAuthService.updateProfileImage(
      userId,
      templateUrl,
    );

    res.json({
      success,
      imageUrl: success ? templateUrl : null,
      message: success
        ? "Avatar template set successfully"
        : "Failed to set avatar template",
    });
  } catch (error) {
    console.error("Failed to set avatar template:", error);
    res.status(500).json({
      success: false,
      error: "Failed to set avatar template",
    });
  }
}

// Middleware wrapper for multer
export const uploadMiddleware = upload.single("profileImage");
