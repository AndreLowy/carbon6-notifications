import PromiseRouter from "express-promise-router";

import { NotificationsController } from "../controllers/NotificationsController";
import { NotificationsService } from "../services/notificationsService";
import { Logger } from "pino";
import { Router } from "express";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

export const createRouter = ({
    logger,
    dynamoDBClient,
}: {
    logger: Logger;
    dynamoDBClient: DynamoDBClient;
}): Router => {
    const router = PromiseRouter();

    const notificationsService = new NotificationsService({
        logger,
        dynamoDBClient,
    });
    const notificationsController = new NotificationsController({
        logger,
        notificationsService,
    });

    router.get("/notifications", notificationsController.get);
    router.post("/notification", notificationsController.post);
    return router;
};
