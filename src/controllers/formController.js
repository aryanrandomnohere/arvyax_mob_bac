import FormDefinition from "../models/FormDefinition.js";
import FormSubmission from "../models/FormSubmission.js";

async function getFormSchemaById(formId) {
  return FormDefinition.findOne({ formId, isActive: true })
    .select("-__v -createdAt -updatedAt")
    .lean();
}

function normalizeFormDefinition(form) {
  return {
    ...form,
    priority: Number.isFinite(form?.priority) ? form.priority : 100,
    scheduling:
      form?.scheduling && typeof form.scheduling === "object"
        ? form.scheduling
        : {},
  };
}

function normalizeFormIdKey(formId) {
  return String(formId || "")
    .trim()
    .toLowerCase();
}

function getTimezoneOrUtc(timezone) {
  try {
    if (!timezone || typeof timezone !== "string") return "UTC";
    new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format(new Date());
    return timezone;
  } catch {
    return "UTC";
  }
}

function getDatePartsInTimezone(date, timezone) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "long",
  });

  const parts = formatter.formatToParts(date);
  const value = (type) => parts.find((part) => part.type === type)?.value ?? "";

  const year = Number(value("year"));
  const month = Number(value("month"));
  const day = Number(value("day"));
  const weekday = String(value("weekday") || "").toLowerCase();
  const dateKey = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const weekdayToIndex = {
    monday: 0,
    tuesday: 1,
    wednesday: 2,
    thursday: 3,
    friday: 4,
    saturday: 5,
    sunday: 6,
  };

  const weekdayIndex = weekdayToIndex[weekday] ?? 0;
  const baseUtc = new Date(Date.UTC(year, month - 1, day));
  const weekStartUtc = new Date(baseUtc);
  weekStartUtc.setUTCDate(baseUtc.getUTCDate() - weekdayIndex);
  const weekKey = `${weekStartUtc.getUTCFullYear()}-${String(weekStartUtc.getUTCMonth() + 1).padStart(2, "0")}-${String(weekStartUtc.getUTCDate()).padStart(2, "0")}`;

  return {
    year,
    month,
    day,
    weekday,
    dateKey,
    monthKey: `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}`,
    weekKey,
  };
}

function getSchedulingMode(scheduling) {
  const type = String(scheduling?.type || "").toLowerCase();
  const frequency = String(scheduling?.frequency || "").toLowerCase();

  if (["daily", "weekly", "monthly"].includes(frequency)) {
    return "recurring";
  }
  if (type === "recurring") {
    return "recurring";
  }
  return "one_time";
}

function isRecurringFormDueNow(form, latestSubmittedAt, now = new Date()) {
  const scheduling = form?.scheduling || {};
  if (scheduling?.isActive === false) return false;

  const timezone = getTimezoneOrUtc(scheduling?.timezone);
  const nowParts = getDatePartsInTimezone(now, timezone);
  const latestParts = latestSubmittedAt
    ? getDatePartsInTimezone(new Date(latestSubmittedAt), timezone)
    : null;

  const frequency = String(scheduling?.frequency || "").toLowerCase();
  const resolvedFrequency = ["daily", "weekly", "monthly"].includes(frequency)
    ? frequency
    : "daily";

  if (resolvedFrequency === "daily") {
    return !latestParts || latestParts.dateKey !== nowParts.dateKey;
  }

  if (resolvedFrequency === "weekly") {
    const dayOfWeek = String(scheduling?.dayOfWeek || "").toLowerCase();
    if (dayOfWeek && dayOfWeek !== nowParts.weekday) {
      return false;
    }

    return !latestParts || latestParts.weekKey !== nowParts.weekKey;
  }

  if (resolvedFrequency === "monthly") {
    const dayOfMonth = Number(scheduling?.dayOfMonth);
    if (Number.isInteger(dayOfMonth) && nowParts.day !== dayOfMonth) {
      return false;
    }

    return !latestParts || latestParts.monthKey !== nowParts.monthKey;
  }

  return false;
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
  const formList = await FormDefinition.find({ isActive: true })
    .select("-__v -createdAt -updatedAt")
    .sort({ priority: 1, formId: 1 })
    .lean();

  const forms = formList.reduce((acc, form) => {
    acc[form.formId] = normalizeFormDefinition(form);
    return acc;
  }, {});

  return res.json({
    forms,
    total: formList.length,
  });
};

export const getFormById = async (req, res) => {
  const formId = String(req.params.formId || "").trim();
  const form = await getFormSchemaById(formId);

  if (!form) {
    return res.status(404).json({ error: "Form not found" });
  }

  return res.json(normalizeFormDefinition(form));
};

export const getPendingForms = async (req, res) => {
  const userId = String(req.user?.id || "").trim();
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const formList = await FormDefinition.find({ isActive: true })
    .select("-__v -createdAt -updatedAt")
    .sort({ priority: 1, formId: 1 })
    .lean();

  const userSubmissions = await FormSubmission.find({ userId })
    .select("formId createdAt")
    .sort({ createdAt: -1 })
    .lean();

  const latestSubmissionMap = userSubmissions.reduce((acc, submission) => {
    const key = normalizeFormIdKey(submission?.formId);
    if (!key) return acc;

    if (!acc[key]) {
      acc[key] = submission.createdAt;
    }
    return acc;
  }, {});

  const pendingList = formList.filter((form) => {
    const normalizedForm = normalizeFormDefinition(form);
    const formIdKey = normalizeFormIdKey(normalizedForm.formId);
    const latestSubmittedAt = latestSubmissionMap[formIdKey] ?? null;
    const mode = getSchedulingMode(normalizedForm.scheduling);

    if (mode === "one_time") {
      return !latestSubmittedAt;
    }

    return isRecurringFormDueNow(normalizedForm, latestSubmittedAt);
  });

  const forms = pendingList.reduce((acc, form) => {
    acc[form.formId] = normalizeFormDefinition(form);
    return acc;
  }, {});

  const isDebug = String(req.query?.debug || "") === "1";

  const payload = {
    forms,
    total: pendingList.length,
  };

  if (isDebug) {
    payload.debug = {
      userId,
      submittedFormIds: Object.keys(latestSubmissionMap),
      pendingFormIds: pendingList.map((f) => f.formId),
    };
  }

  return res.json(payload);
};

export const submitForm = async (req, res) => {
  const formId = String(req.params.formId || "").trim();
  const form = await getFormSchemaById(formId);

  if (!form) {
    return res.status(404).json({ error: "Form not found" });
  }

  const { metadata = {}, formName } = req.body;
  const userId = String(req.user?.id || "").trim();

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

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
    userId,
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
