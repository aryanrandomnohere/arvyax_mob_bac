import AmbienceCommand from "../models/AmbienceCommand.js";
import AWS from "aws-sdk";
import {
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_ENDPOINT,
  R2_BUCKET_NAME,
} from "../config/constants.js";
/**
 * Ambience Command Controller
 * Handles BLE/timed commands for soundscape environments
 * Controls LED lighting, sound mixing, and ambience transitions
 */

// Configure Cloudflare R2
const s3 = new AWS.S3({
  accessKeyId: R2_ACCESS_KEY_ID,
  secretAccessKey: R2_SECRET_ACCESS_KEY,
  endpoint: R2_ENDPOINT,
  region: "auto",
  signatureVersion: "v4",
  s3ForcePathStyle: true,
});

// Helper function to upload to Cloudflare R2
async function uploadToCloudflare(fileName, jsonData) {
  const params = {
    Bucket: R2_BUCKET_NAME,
    Key: `ambience-commands/${fileName}`,
    Body: JSON.stringify(jsonData, null, 2),
    ContentType: "application/json",
    CacheControl: "no-cache",
  };

  const result = await s3.upload(params).promise();
  return result;
}

// Helper function to delete from Cloudflare R2
async function deleteFromCloudflare(fileName) {
  const params = {
    Bucket: R2_BUCKET_NAME,
    Key: `ambience-commands/${fileName}`,
  };

  await s3.deleteObject(params).promise();
}

// Helper function to validate JSON structure
function validateJsonStructure(jsonData) {
  try {
    const hasStarting = Array.isArray(jsonData.starting);
    const hasMiddle = Array.isArray(jsonData.middle);
    const hasEnding = Array.isArray(jsonData.ending);
    const hasMainDuration =
      typeof jsonData.mainDuration === "number" && jsonData.mainDuration > 0;

    const validateCommands = (commands) => {
      return commands.every((cmd) => {
        return (
          typeof cmd.second === "number" &&
          cmd.second >= 0 &&
          typeof cmd.value === "string" &&
          cmd.value.length > 0 &&
          /^[0-9A-Fa-f]+$/.test(cmd.value)
        );
      });
    };

    const validStarting = !hasStarting || validateCommands(jsonData.starting);
    const validMiddle = !hasMiddle || validateCommands(jsonData.middle);
    const validEnding = !hasEnding || validateCommands(jsonData.ending);

    return (
      hasStarting &&
      hasMiddle &&
      hasEnding &&
      hasMainDuration &&
      validStarting &&
      validMiddle &&
      validEnding
    );
  } catch (error) {
    console.error("Validation error:", error);
    return false;
  }
}

/**
 * Get all ambience commands
 * Returns list of all environment command sets
 */
export const getAllAmbienceCommands = async (req, res) => {
  try {
    const commands = await AmbienceCommand.find().select(
      "environment mainDuration cloudflareUrl size totalCommands createdAt updatedAt"
    );

    const formattedCommands = commands.map((cmd) => ({
      environment: cmd.environment,
      mainDuration: cmd.mainDuration,
      fileName: `${cmd.environment}_commands.json`,
      size: cmd.size || 0,
      totalCommands: cmd.totalCommands || 0,
      lastModified: cmd.updatedAt,
      cloudflareUrl:
        cmd.cloudflareUrl ||
        `${R2_ENDPOINT.replace("https://", "https://pub-")}/${
          cmd.environment
        }_commands.json`,
    }));

    res.json({
      success: true,
      count: commands.length,
      data: formattedCommands,
    });
  } catch (error) {
    console.error("Error fetching ambience commands:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching ambience commands",
      error: error.message,
    });
  }
};

/**
 * Get ambience commands by environment
 * Returns commands for specific environment (e.g., rain, campfire)
 */
export const getAmbienceCommandsByEnvironment = async (req, res) => {
  try {
    const environment = req.params.environment.toLowerCase();
    const command = await AmbienceCommand.findOne({ environment });

    if (!command) {
      return res.status(404).json({
        success: false,
        message: `No commands found for environment: ${environment}`,
      });
    }

    const responseData = {
      mainDuration: command.mainDuration,
      starting: command.starting,
      middle: command.middle,
      ending: command.ending,
    };

    res.json({
      success: true,
      environment: command.environment,
      fileName: `${command.environment}_commands.json`,
      data: responseData,
      totalCommands: command.totalCommands || 0,
      lastModified: command.updatedAt,
      cloudflareUrl: command.cloudflareUrl,
      size: command.size || 0,
    });
  } catch (error) {
    console.error("Error fetching environment commands:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching environment commands",
      error: error.message,
    });
  }
};

/**
 * Create new ambience commands
 * Creates command set for new environment
 */
export const createAmbienceCommands = async (req, res) => {
  try {
    const { environment, mainDuration, starting, middle, ending } = req.body;

    if (!environment) {
      return res.status(400).json({
        success: false,
        message: "Environment name is required",
      });
    }

    const existingCommand = await AmbienceCommand.findOne({
      environment: environment.toLowerCase(),
    });

    if (existingCommand) {
      return res.status(409).json({
        success: false,
        message: `Commands for environment '${environment}' already exist. Use PUT to update.`,
      });
    }

    const envName = environment.toLowerCase();
    const fileName = `${envName}_commands.json`;

    const jsonData = {
      mainDuration: mainDuration || 300,
      starting: starting || [],
      middle: middle || [],
      ending: ending || [],
    };

    if (!validateJsonStructure(jsonData)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid JSON structure. Must contain starting, middle, ending arrays and mainDuration",
      });
    }

    try {
      const cloudflareResult = await uploadToCloudflare(fileName, jsonData);

      const newCommand = new AmbienceCommand({
        environment: envName,
        mainDuration: jsonData.mainDuration,
        starting: jsonData.starting,
        middle: jsonData.middle,
        ending: jsonData.ending,
        cloudflareUrl: cloudflareResult.Location,
        size: Buffer.byteLength(JSON.stringify(jsonData)),
      });

      await newCommand.save();

      res.status(201).json({
        success: true,
        message: "Ambience commands created successfully",
        environment: newCommand.environment,
        fileName: fileName,
        cloudflareUrl: cloudflareResult.Location,
        databaseId: newCommand._id,
        totalCommands: newCommand.totalCommands || 0,
        size: newCommand.size,
      });
    } catch (saveError) {
      try {
        await deleteFromCloudflare(fileName);
      } catch (cleanupError) {
        console.error("Failed to cleanup Cloudflare upload:", cleanupError);
      }
      throw saveError;
    }
  } catch (error) {
    console.error("Error creating ambience commands:", error);
    res.status(500).json({
      success: false,
      message: "Error creating ambience commands",
      error: error.message,
    });
  }
};

/**
 * Update ambience commands
 * Updates existing command set for environment
 */
export const updateAmbienceCommands = async (req, res) => {
  try {
    const environment = req.params.environment.toLowerCase();
    const { mainDuration, starting, middle, ending } = req.body;

    const jsonData = {
      mainDuration: mainDuration || 300,
      starting: starting || [],
      middle: middle || [],
      ending: ending || [],
    };

    if (!validateJsonStructure(jsonData)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid JSON structure. Must contain starting, middle, ending arrays and mainDuration",
      });
    }

    const existingCommand = await AmbienceCommand.findOne({ environment });
    if (!existingCommand) {
      return res.status(404).json({
        success: false,
        message: `No commands found for environment: ${environment}`,
      });
    }

    const fileName = `${environment}_commands.json`;

    try {
      const cloudflareResult = await uploadToCloudflare(fileName, jsonData);

      const updatedCommand = await AmbienceCommand.findOneAndUpdate(
        { environment },
        {
          mainDuration: jsonData.mainDuration,
          starting: jsonData.starting,
          middle: jsonData.middle,
          ending: jsonData.ending,
          cloudflareUrl: cloudflareResult.Location,
          size: Buffer.byteLength(JSON.stringify(jsonData)),
          updatedAt: Date.now(),
        },
        { new: true, runValidators: true }
      );

      res.json({
        success: true,
        message: "Ambience commands updated successfully",
        environment: updatedCommand.environment,
        fileName: fileName,
        cloudflareUrl: cloudflareResult.Location,
        databaseId: updatedCommand._id,
        totalCommands: updatedCommand.totalCommands || 0,
        size: updatedCommand.size,
      });
    } catch (updateError) {
      throw updateError;
    }
  } catch (error) {
    console.error("Error updating ambience commands:", error);
    res.status(500).json({
      success: false,
      message: "Error updating ambience commands",
      error: error.message,
    });
  }
};

/**
 * Delete ambience commands
 * Removes command set from database and R2
 */
export const deleteAmbienceCommands = async (req, res) => {
  try {
    const environment = req.params.environment.toLowerCase();

    const deletedCommand = await AmbienceCommand.findOneAndDelete({
      environment,
    });

    if (!deletedCommand) {
      return res.status(404).json({
        success: false,
        message: `No commands found for environment: ${environment}`,
      });
    }

    try {
      const fileName = `${environment}_commands.json`;
      await deleteFromCloudflare(fileName);
    } catch (deleteError) {
      console.error("Error deleting from Cloudflare:", deleteError);
    }

    res.json({
      success: true,
      message: "Ambience commands deleted successfully",
      environment: deletedCommand.environment,
      fileName: `${environment}_commands.json`,
    });
  } catch (error) {
    console.error("Error deleting ambience commands:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting ambience commands",
      error: error.message,
    });
  }
};

/**
 * Bulk upload ambience commands
 * Creates/updates multiple command sets at once
 */
export const bulkUploadAmbienceCommands = async (req, res) => {
  try {
    const { commands } = req.body;

    if (!commands || !Array.isArray(commands)) {
      return res.status(400).json({
        success: false,
        message: "Commands array is required",
      });
    }

    const results = [];
    const errors = [];

    for (const cmd of commands) {
      try {
        const { environment, mainDuration, starting, middle, ending } = cmd;

        if (!environment) {
          errors.push("Environment name is required");
          continue;
        }

        const envName = environment.toLowerCase();
        const fileName = `${envName}_commands.json`;

        const jsonData = {
          mainDuration: mainDuration || 300,
          starting: starting || [],
          middle: middle || [],
          ending: ending || [],
        };

        if (!validateJsonStructure(jsonData)) {
          errors.push(
            `Invalid JSON structure for environment '${environment}'`
          );
          continue;
        }

        const cloudflareResult = await uploadToCloudflare(fileName, jsonData);

        const ambience = await AmbienceCommand.findOneAndUpdate(
          { environment: envName },
          {
            environment: envName,
            mainDuration: jsonData.mainDuration,
            starting: jsonData.starting,
            middle: jsonData.middle,
            ending: jsonData.ending,
            cloudflareUrl: cloudflareResult.Location,
            size: Buffer.byteLength(JSON.stringify(jsonData)),
            updatedAt: new Date(),
          },
          {
            new: true,
            upsert: true,
            setDefaultsOnInsert: true,
          }
        );

        results.push({
          environment: ambience.environment,
          fileName: fileName,
          cloudflareUrl: cloudflareResult.Location,
          databaseId: ambience._id,
          success: true,
        });
      } catch (error) {
        errors.push(`Failed to upload '${cmd.environment}': ${error.message}`);
      }
    }

    res.json({
      success: errors.length === 0,
      message: `Bulk upload completed. ${results.length} successful, ${errors.length} failed`,
      results,
      errors,
      summary: {
        total: commands.length,
        successful: results.length,
        failed: errors.length,
      },
    });
  } catch (error) {
    console.error("Error in bulk upload:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process bulk upload",
      error: error.message,
    });
  }
};

/**
 * Get ambience commands statistics
 * Returns overview of all command sets
 */
export const getAmbienceCommandsStats = async (req, res) => {
  try {
    const totalEnvironments = await AmbienceCommand.countDocuments();
    const totalCommandsResult = await AmbienceCommand.aggregate([
      {
        $group: {
          _id: null,
          totalCommands: { $sum: "$totalCommands" },
          totalSize: { $sum: "$size" },
        },
      },
    ]);

    const lastUpdated = await AmbienceCommand.findOne()
      .sort({ updatedAt: -1 })
      .select("updatedAt");

    res.json({
      success: true,
      stats: {
        totalEnvironments,
        totalCommands: totalCommandsResult[0]?.totalCommands || 0,
        totalSize: totalCommandsResult[0]?.totalSize || 0,
        lastUpdated: lastUpdated?.updatedAt || null,
      },
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
      error: error.message,
    });
  }
};

/**
 * Search ambience commands
 * Searches by environment name and duration range
 */
export const searchAmbienceCommands = async (req, res) => {
  try {
    const { q, minDuration, maxDuration } = req.query;

    let query = {};

    if (q) {
      query.environment = { $regex: q, $options: "i" };
    }

    if (minDuration) {
      query.mainDuration = { $gte: parseInt(minDuration) };
    }

    if (maxDuration) {
      query.mainDuration = {
        ...query.mainDuration,
        $lte: parseInt(maxDuration),
      };
    }

    const commands = await AmbienceCommand.find(query)
      .select(
        "environment mainDuration cloudflareUrl size totalCommands updatedAt"
      )
      .sort({ updatedAt: -1 });

    res.json({
      success: true,
      data: commands,
      total: commands.length,
      query: { q, minDuration, maxDuration },
    });
  } catch (error) {
    console.error("Error searching ambience commands:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search ambience commands",
      error: error.message,
    });
  }
};
