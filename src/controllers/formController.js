import FormDefinition from "../models/FormDefinition.js";
import FormSubmission from "../models/FormSubmission.js";

async function getFormSchemaById(formId) {
  return FormDefinition.findOne({ formId, isActive: true })
    .select("-__v -createdAt -updatedAt")
    .lean();
}

function isEmptyValue(value) {
  return (
    value === undefined ||
    value === null ||
    (typeof value === "string" && value.trim() === "")
  );
}

function compilePattern(pattern) {
  if (typeof pattern !== "string" || !pattern.trim()) {
    return null;
  }

  try {
    return new RegExp(pattern);
  } catch {
    // Some stored patterns may be double-escaped (e.g. "\\\\."), unescape once.
    try {
      return new RegExp(pattern.replace(/\\\\/g, "\\"));
    } catch {
      return null;
    }
  }
}

function validateSubmissionAgainstSchema(form, metadata) {
  const details = [];
  const fieldNameSet = new Set((form.fields || []).map((field) => field.name));

  for (const key of Object.keys(metadata || {})) {
    if (!fieldNameSet.has(key)) {
      details.push({
        field: key,
        message: `${key} is not defined in form schema`,
      });
    }
  }

  for (const field of form.fields || []) {
    const value = metadata[field.name];

    if (field.required) {
      if (field.type === "checkbox") {
        if (value !== true) {
          details.push({
            field: field.name,
            message: `${field.label} must be accepted`,
          });
          continue;
        }
      } else if (isEmptyValue(value)) {
        details.push({
          field: field.name,
          message: `${field.label} is required`,
        });
        continue;
      }
    }

    if (isEmptyValue(value)) {
      continue;
    }

    if (field.type === "text") {
      if (typeof value !== "string") {
        details.push({
          field: field.name,
          message: `${field.label} must be a string`,
        });
        continue;
      }

      const minLength = field.validation?.minLength;
      const maxLength = field.validation?.maxLength;

      if (Number.isInteger(minLength) && value.length < minLength) {
        details.push({
          field: field.name,
          message: `${field.label} must be at least ${minLength} characters`,
        });
      }

      if (Number.isInteger(maxLength) && value.length > maxLength) {
        details.push({
          field: field.name,
          message: `${field.label} must be at most ${maxLength} characters`,
        });
      }

      continue;
    }

    if (field.type === "email") {
      if (typeof value !== "string") {
        details.push({
          field: field.name,
          message: `${field.label} must be a string`,
        });
        continue;
      }

      const emailValue = value.trim();
      const configuredPattern = field.validation?.pattern;
      const configuredRegex = compilePattern(configuredPattern);
      const fallbackEmailRegex =
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      const isValid = configuredRegex
        ? configuredRegex.test(emailValue)
        : fallbackEmailRegex.test(emailValue);

      if (!isValid) {
        details.push({
          field: field.name,
          message: `${field.label} is invalid`,
        });
      }

      continue;
    }

    if (field.type === "number") {
      const parsed = Number(value);

      if (!Number.isFinite(parsed)) {
        details.push({
          field: field.name,
          message: `${field.label} must be a valid number`,
        });
        continue;
      }

      const min = field.validation?.min;
      const max = field.validation?.max;

      if (typeof min === "number" && parsed < min) {
        details.push({
          field: field.name,
          message: `${field.label} must be at least ${min}`,
        });
      }

      if (typeof max === "number" && parsed > max) {
        details.push({
          field: field.name,
          message: `${field.label} must be at most ${max}`,
        });
      }

      continue;
    }

    if (field.type === "select") {
      const allowedOptions = (field.options || []).map(
        (option) => option.value,
      );
      if (!allowedOptions.includes(value)) {
        details.push({
          field: field.name,
          message: `${field.label} must be one of: ${allowedOptions.join(", ")}`,
        });
      }
      continue;
    }

    if (field.type === "checkbox") {
      if (typeof value !== "boolean") {
        details.push({
          field: field.name,
          message: `${field.label} must be a boolean`,
        });
      }
    }
  }

  return details;
}

export const getForms = async (req, res) => {
  const forms = await FormDefinition.find({ isActive: true })
    .select("-__v -createdAt -updatedAt")
    .sort({ formId: 1 })
    .lean();

  return res.json({
    forms,
    total: forms.length,
  });
};

export const getFormById = async (req, res) => {
  const formId = String(req.params.formId || "").trim();
  const form = await getFormSchemaById(formId);

  if (!form) {
    return res.status(404).json({ error: "Form not found" });
  }

  return res.json(form);
};

export const submitForm = async (req, res) => {
  const formId = String(req.params.formId || "").trim();
  const form = await getFormSchemaById(formId);

  if (!form) {
    return res.status(404).json({ error: "Form not found" });
  }

  const { id, metadata = {}, formName } = req.body;

  if (formName !== form.formName) {
    return res.status(400).json({
      error: "formName does not match form definition",
      expected: form.formName,
      received: formName,
    });
  }

  const details = validateSubmissionAgainstSchema(form, metadata);
  if (details.length) {
    return res.status(400).json({
      error: "Form validation failed",
      details,
    });
  }

  const submission = await FormSubmission.create({
    formId: form.formId,
    formName: form.formName,
    userId: id,
    metadata,
    submitEndpoint: form.submit?.endpoint ?? null,
  });

  return res.status(201).json({
    success: true,
    message: "Form submitted successfully",
    submission: {
      id: String(submission._id),
      formId: submission.formId,
      formName: submission.formName,
      userId: submission.userId,
      metadata: submission.metadata,
      createdAt: submission.createdAt,
    },
  });
};
