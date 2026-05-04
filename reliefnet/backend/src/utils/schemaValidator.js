function validate(schema, data) {
    if (!schema || !schema.fields) return null;

    const errors = {};

    for (const field of schema.fields) {
        const value = data[field.name];

        // Required
        if (field.required && (value === undefined || value === null || value === "")) {
            errors[field.name] = `${field.name} is required`;
            continue;
        }

        if (value === undefined || value === null) continue;

        // Type
        if (field.type === "number" && typeof value !== "number") {
            errors[field.name] = `${field.name} must be a number`;
        }

        if (field.type === "string" && typeof value !== "string") {
            errors[field.name] = `${field.name} must be a string`;
        }

        if (field.type === "boolean" && typeof value !== "boolean") {
            errors[field.name] = `${field.name} must be a boolean`;
        }

        // Min length
        if (field.minLength && typeof value === "string") {
            if (value.length < field.minLength) {
                errors[field.name] = `${field.name} must be at least ${field.minLength} characters`;
            }
        }
    }

    return Object.keys(errors).length > 0 ? errors : null;
}

module.exports = { validate };