export const userConfigSchema = {
    searchPreferences: {
        type: 'object',
        properties: {
            categories: {
                type: 'array',
                items: { type: 'string' },
                default: []
            },
            priceRange: {
                type: 'object',
                properties: {
                    min: { type: 'number', minimum: 0 },
                    max: { type: 'number', minimum: 0 }
                },
                default: { min: 0, max: 1000 }
            },
            sizePreferences: {
                type: 'array',
                items: { type: 'string' },
                default: []
            },
            brandPreferences: {
                type: 'array',
                items: { type: 'string' },
                default: []
            },
            conditionPreferences: {
                type: 'array',
                items: { 
                    type: 'string',
                    enum: ['new', 'very_good', 'good', 'satisfactory']
                },
                default: []
            }
        },
        required: [],
        additionalProperties: false
    },
    notificationPreferences: {
        type: 'object',
        properties: {
            frequency: {
                type: 'string',
                enum: ['immediate', 'hourly', 'daily'],
                default: 'immediate'
            },
            activeHours: {
                type: 'object',
                properties: {
                    start: { type: 'number', minimum: 0, maximum: 23 },
                    end: { type: 'number', minimum: 0, maximum: 23 }
                },
                default: { start: 8, end: 22 }
            },
            notificationMethods: {
                type: 'array',
                items: { type: 'string', enum: ['telegram'] },
                default: ['telegram']
            }
        },
        required: [],
        additionalProperties: false
    }
};
