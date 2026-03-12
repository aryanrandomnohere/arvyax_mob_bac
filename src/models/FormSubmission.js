import mongoose from "mongoose";

const { Schema } = mongoose;

const FormSubmissionSchema = new Schema(
  {
    formId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    formName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      required: true,
      default: {},
    },
    submitEndpoint: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

FormSubmissionSchema.index({ formId: 1, userId: 1, createdAt: -1 });

const FormSubmission = mongoose.model("FormSubmission", FormSubmissionSchema);

export default FormSubmission;
