import mongoose from "mongoose";

const { Schema } = mongoose;

const FormFieldSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["text", "email", "number", "select", "checkbox", "textarea"],
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    required: {
      type: Boolean,
      default: false,
    },
    placeholder: {
      type: String,
      default: "",
      trim: true,
    },
    validation: {
      type: Schema.Types.Mixed,
      default: {},
    },
    options: {
      type: [
        {
          label: {
            type: String,
            required: true,
            trim: true,
          },
          value: {
            type: String,
            required: true,
            trim: true,
          },
        },
      ],
      default: [],
    },
  },
  { _id: false },
);

const FormDefinitionSchema = new Schema(
  {
    formId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    formName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    priority: {
      type: Number,
      default: 100,
      min: 0,
      index: true,
    },
    scheduling: {
      type: Schema.Types.Mixed,
      default: {},
    },
    fields: {
      type: [FormFieldSchema],
      default: [],
    },
    submit: {
      endpoint: {
        type: String,
        required: true,
        trim: true,
      },
      method: {
        type: String,
        enum: ["POST", "PUT", "PATCH"],
        default: "POST",
      },
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

const FormDefinition = mongoose.model("FormDefinition", FormDefinitionSchema);

export default FormDefinition;
