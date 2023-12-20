import { Request, Response } from "express";
import { NotificationsService } from "../services/NotificationsService";
import { Logger } from "pino";

export class NotificationsController {
    private readonly logger: Logger;
    private readonly notificationsService: NotificationsService;

    constructor({
        logger,
        notificationsService,
    }: {
        logger: Logger;
        notificationsService: NotificationsService;
    }) {
        this.logger = logger;
        this.notificationsService = notificationsService;
    }

    public get = async (req: Request, res: Response): Promise<void> => {
        const userId = req.query.user_id as string;
        const response = await this.notificationsService.getNotifications(
            userId,
        );
        res.json(response).status(200);
    };

    public post = async (req: Request, res: Response): Promise<void> => {
        if (!req.body) res.send({ message: "Bad Request" }).status(400);
        const body = req.body as {
            user_id: string;
            category: string;
            type: string;
            additionalData?: Record<string, string | number>;
            isCritical: boolean;
        };
        const response = await this.notificationsService.createNotification(
            body,
        );
        if (response.isCreated) {
            res.json(response).status(202);
        } else {
            throw new Error("Failed to create new notification");
        }
    };
}
