import { Module, OnModuleInit, forwardRef } from "@nestjs/common";
import { CommandBus, EventBus, EventPublisher, QueryBus } from "@nestjs/cqrs";
import { ClientsModule } from "@nestjs/microservices";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "auth/auth.module";
import { kafkaClientOptions } from "common/kafka-client.options";
import { EventStore } from "core/event-store/event-store";
import { EventStoreModule } from "core/event-store/event-store.module";
import { PermissionDto } from "permissions/dtos/permissions.dto";
import { UserDto } from "users/dtos/users.dto";
import { config } from "../../config";
import { CommandHandlers } from "./commands/handlers";
import { ProjectsController } from "./controllers/projects.controller";
import { ProjectDto } from "./dtos/projects.dto";
import { EventHandlers } from "./events/handlers";
import { ProjectCreatedEvent, ProjectCreatedFailedEvent, ProjectCreatedSuccessEvent } from "./events/impl/project-created.event";
import { ProjectDeletedEvent, ProjectDeletedSuccessEvent, ProjectDeletedFailedEvent } from "./events/impl/project-deleted.event";
import { ProjectUpdatedEvent, ProjectUpdatedSuccessEvent, ProjectUpdatedFailedEvent } from "./events/impl/project-updated.event";
import { ProjectWelcomedEvent } from "./events/impl/project-welcomed.event";
import { QueryHandlers } from "./queries/handler";
import { ProjectRepository } from "./repository/project.repository";
import { ProjectsSagas } from "./sagas/projects.sagas";
import { ProjectsService } from "./services/projects.service";
import { ProjectDeletedByUserIdEvent, ProjectDeletedByUserIdSuccessEvent, ProjectDeletedByUserIdFailedEvent } from "./events/impl/project-deleted-by-userId.event";


@Module({
    imports: [
        ClientsModule.register([{
            name: config.KAFKA.NAME,
            ...kafkaClientOptions,
        }]),
        TypeOrmModule.forFeature([ProjectDto, PermissionDto, UserDto]),
        forwardRef(() => AuthModule),
        EventStoreModule.forFeature(),
    ],
    controllers: [ProjectsController],
    providers: [
        ProjectsService,
        ProjectsSagas,
        ...CommandHandlers,
        ...EventHandlers,
        ...QueryHandlers,
        ProjectRepository,
        QueryBus, EventBus, EventStore, CommandBus, EventPublisher,
    ],
    exports: [ProjectsService],
})
export class ProjectsModule implements OnModuleInit {
    constructor(
        private readonly command$: CommandBus,
        private readonly query$: QueryBus,
        private readonly event$: EventBus,
        private readonly eventStore: EventStore,
    ) {
    }

    async onModuleInit() {
        this.eventStore.setEventHandlers(ProjectsModule.eventHandlers);
        await this.eventStore.bridgeEventsTo((this.event$ as any).subject$);
        this.event$.publisher = this.eventStore;
        /** ------------ */
        this.event$.register(EventHandlers);
        this.command$.register(CommandHandlers);
        this.query$.register(QueryHandlers);
        this.event$.registerSagas([ProjectsSagas]);
    }

    public static eventHandlers = {
        // create
        ProjectCreatedEvent: (streamId, data) => new ProjectCreatedEvent(streamId, data),
        ProjectCreatedSuccessEvent: (streamId, data) => new ProjectCreatedSuccessEvent(streamId, data),
        ProjectCreatedFailedEvent: (streamId, data, error) => new ProjectCreatedFailedEvent(streamId, data, error),

        // delete
        ProjectDeletedEvent: (streamId, data) => new ProjectDeletedEvent(streamId, data),
        ProjectDeletedSuccessEvent: (streamId, data) => new ProjectDeletedSuccessEvent(streamId, data),
        ProjectDeletedFailedEvent: (streamId, data, error) => new ProjectDeletedFailedEvent(streamId, data, error),

        // delete by userId
        ProjectDeletedByUserIdEvent: (streamId, data) => new ProjectDeletedByUserIdEvent(streamId, data),
        ProjectDeletedByUserIdSuccessEvent: (streamId, data) => new ProjectDeletedByUserIdSuccessEvent(streamId, data),
        ProjectDeletedByUserIdFailedEvent: (streamId, data, error) => new ProjectDeletedByUserIdFailedEvent(streamId, data, error),

        // update
        ProjectUpdatedEvent: (streamId, data) => new ProjectUpdatedEvent(streamId, data),
        ProjectUpdatedSuccessEvent: (streamId, data) => new ProjectUpdatedSuccessEvent(streamId, data),
        ProjectUpdatedFailedEvent: (streamId, data, error) => new ProjectUpdatedFailedEvent(streamId, data, error),

        ProjectWelcomedEvent: (streamId, data) => new ProjectWelcomedEvent(streamId, data),
    };
}
