import mongoose from "mongoose";
import { MONGODB_URI } from "../config/constants.js";
import FormDefinition from "../models/FormDefinition.js";

const forms = [
  {
    formId: "userProfile",
    formName: "userProfile",
    title: "User Profile Update",
    fields: [
      {
        name: "firstName",
        type: "text",
        label: "First Name",
        required: true,
        placeholder: "Enter first name",
        validation: {
          minLength: 2,
          maxLength: 50,
        },
      },
      {
        name: "email",
        type: "email",
        label: "Email Address",
        required: true,
        validation: {
          pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
        },
      },
      {
        name: "age",
        type: "number",
        label: "Age",
        required: true,
        validation: {
          min: 18,
          max: 100,
        },
      },
      {
        name: "country",
        type: "select",
        label: "Country",
        required: false,
        options: [
          { label: "India", value: "IN" },
          { label: "USA", value: "US" },
        ],
      },
      {
        name: "termsAccepted",
        type: "checkbox",
        label: "Accept Terms",
        required: true,
      },
    ],
    submit: {
      endpoint: "/api/forms/userProfile/submit",
      method: "POST",
    },
    isActive: true,
  },
  {
    formId: "tempTestForm",
    formName: "tempTestForm",
    title: "Temporary Test Form",
    fields: [
      {
        name: "fullName",
        type: "text",
        label: "Full Name",
        required: true,
        validation: { minLength: 3, maxLength: 80 },
      },
      {
        name: "contactEmail",
        type: "email",
        label: "Contact Email",
        required: true,
        validation: {
          pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
        },
      },
      {
        name: "experienceYears",
        type: "number",
        label: "Experience (Years)",
        required: false,
        validation: { min: 0, max: 40 },
      },
      {
        name: "plan",
        type: "select",
        label: "Plan",
        required: true,
        options: [
          { label: "Free", value: "FREE" },
          { label: "Pro", value: "PRO" },
        ],
      },
      {
        name: "agreePolicy",
        type: "checkbox",
        label: "I Agree to Policy",
        required: true,
      },
    ],
    submit: {
      endpoint: "/api/forms/tempTestForm/submit",
      method: "POST",
    },
    isActive: true,
  },
];

const seedForms = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("📦 Connected to database");

    for (const form of forms) {
      await FormDefinition.updateOne(
        { formId: form.formId },
        { $set: form },
        { upsert: true },
      );
      console.log(`✅ Upserted form: ${form.formId}`);
    }

    console.log("✅ Forms seeding completed");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding forms:", error);
    process.exit(1);
  }
};

seedForms();
