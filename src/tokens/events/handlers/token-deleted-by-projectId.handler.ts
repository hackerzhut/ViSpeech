import {Logger, Inject} from '@nestjs/common';
import {EventsHandler, IEventHandler, EventBus} from '@nestjs/cqrs';
import {InjectRepository} from '@nestjs/typeorm';
import {TokenDto} from 'tokens/dtos/tokens.dto';
import {Repository, getMongoRepository} from 'typeorm';
import { ClientKafka } from '@nestjs/microservices';
import { config } from '../../../../config';
import { CONSTANTS } from 'common/constant';
import { Utils } from 'utils';
import { TokenDeletedByProjectIdEvent, TokenDeletedByProjectIdSuccessEvent, TokenDeletedByProjectIdFailedEvent } from '../impl/token-deleted-by-projectId.event';

@EventsHandler(TokenDeletedByProjectIdEvent)
export class TokenDeletedByProjectIdHandler implements IEventHandler<TokenDeletedByProjectIdEvent> {
    constructor(
        @InjectRepository(TokenDto)
        private readonly repository: Repository<TokenDto>,
        private readonly eventBus: EventBus,
    ) {
    }

    async handle(event: TokenDeletedByProjectIdEvent) {
        Logger.log(event.streamId, 'TokenDeletedByProjectIdEvent');
        const {streamId, projectId} = event;

        try {
            await getMongoRepository(TokenDto).updateMany({ projectId }, { $set: { isValid: false }});
            this.eventBus.publish(new TokenDeletedByProjectIdSuccessEvent(streamId, projectId));
        } catch (error) {
            this.eventBus.publish(new TokenDeletedByProjectIdFailedEvent(streamId, projectId, error));
        }
    }
}

@EventsHandler(TokenDeletedByProjectIdSuccessEvent)
export class TokenDeletedByProjectIdSuccessHandler
    implements IEventHandler<TokenDeletedByProjectIdSuccessEvent> {
    constructor(
        @Inject(config.KAFKA.NAME)
        private readonly clientKafka: ClientKafka,
    ) {
        this.clientKafka.connect();
    }

    handle(event: TokenDeletedByProjectIdSuccessEvent) {
        this.clientKafka.emit(CONSTANTS.TOPICS.TOKEN_DELETED_BY_USERID_SUCCESS_EVENT, JSON.stringify(event));
        Logger.log(event.projectId, 'TokenDeletedByProjectIdSuccessEvent');
    }
}

@EventsHandler(TokenDeletedByProjectIdFailedEvent)
export class TokenDeletedByProjectIdFailedHandler
    implements IEventHandler<TokenDeletedByProjectIdFailedEvent> {
    constructor(
        @Inject(config.KAFKA.NAME)
        private readonly clientKafka: ClientKafka,
    ) {
        this.clientKafka.connect();
    }
    handle(event: TokenDeletedByProjectIdFailedEvent) {
        const errorObj = Utils.getErrorObj(event.error)
        event['errorObj'] = errorObj
        this.clientKafka.emit(CONSTANTS.TOPICS.TOKEN_DELETED_BY_USERID_FAILED_EVENT, JSON.stringify(event));
        Logger.log(errorObj, 'TokenDeletedByProjectIdFailedEvent');
    }
}