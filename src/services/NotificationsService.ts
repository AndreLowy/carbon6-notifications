import {
    AttributeValue,
    DynamoDBClient,
    PutItemCommand,
    PutItemCommandInput,
    QueryCommand,
    QueryCommandOutput,
} from "@aws-sdk/client-dynamodb";
import { Logger } from "pino";
import { ulid } from "../common/ulid";

interface Notifications {
    id: string;
    user_id: string;
    notificationTime: string;
    category: string;
}

interface GetNotificationsResponse {
    notifications: Notifications[];
}

export class NotificationsService {
    private readonly logger: Logger;
    private readonly dynamoDBClient: DynamoDBClient;

    constructor({
        logger,
        dynamoDBClient,
    }: {
        logger: Logger;
        dynamoDBClient: DynamoDBClient;
    }) {
        this.logger = logger;
        this.dynamoDBClient = dynamoDBClient;
    }

    public getNotifications = async (
        userId: string,
    ): Promise<GetNotificationsResponse> => {
        const tableName = "notifications";

        const params = {
            TableName: tableName,
            KeyConditionExpression: "user_id = :userId",
            ExpressionAttributeValues: {
                ":userId": { S: userId },
            },
        };

        const command = new QueryCommand(params);
        try {
            const notifications = await this.dynamoDBClient.send(command);
            this.logger.info({ notifications }, "Found notifications");
            return {
                notifications:
                    notifications.Items as unknown as Notifications[],
            };
        } catch (error) {
            this.logger.error({ error }, "Failed to get notification");
            throw error;
        }
    };

    public createNotification = async ({
        user_id,
        category,
        type,
        additionalData = {},
        isCritical,
    }: {
        user_id: string;
        category: string;
        type: string;
        additionalData?: Record<string, string | number>;
        isCritical: boolean;
    }): Promise<{ isCreated: boolean }> => {
        const notification = {
            notification_id: ulid(),
            user_id,
            category,
            type,
            status: "UNREAD",
            severity: isCritical ? "CRITICAL" : "NON_CRITICAL",
            additionalData: JSON.stringify(additionalData),
            isEmailed: false,
            isSMS: false,
            createdAt: new Date().toISOString(),
        };

        // ****
        // Send notification to SQS queue to eventually be processed
        // Return 202 Accepted response
        // ****

        const tableName = "notifications";

        const params: PutItemCommandInput = {
            TableName: tableName,
            Item: {},
        };

        for (const [key, value] of Object.entries(notification)) {
            let attributeValue: AttributeValue;
            switch (typeof value) {
                case "string":
                    attributeValue = { S: value };
                    break;
                case "number":
                    attributeValue = { N: value };
                    break;
                case "boolean":
                    attributeValue = { BOOL: value };
                    break;

                default:
                    throw new Error(`Unsupported type for attribute ${key}`);
            }
            params.Item[key] = attributeValue;
        }

        const command = new PutItemCommand(params);
        try {
            const notification = await this.dynamoDBClient.send(command);
            this.logger.info({ notification }, "Found notifications");
            return {
                isCreated: true,
            };
        } catch (error) {
            this.logger.error({ error }, "Failed to get notification");
            throw error;
        }
    };
}
